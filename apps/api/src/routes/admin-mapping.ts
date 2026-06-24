import type { FastifyPluginAsync } from 'fastify'
import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvExpenseGroupMonthly as dg, expenseClassification as dc, auditLog } from '@postoinsight/db'
import { requireTenantSession, requireOwnerRole } from '../lib/auth.js'
import { ACCOUNTING_TYPES, isAccountingType } from '@postoinsight/shared'
import { BadQueryError, parseUuidArray, n, round2, pct } from '../lib/queryParsers.js'

/**
 * Classificação contábil de despesas por grupo financeiro (Plano 2a).
 * Spec: docs/specs/admin-mapping.md
 *
 * Override não-destrutivo: a classificação vive em app.expense_classification;
 * canonical/raw nunca são reescritos. Leitura é tenant-scoped; escrita é
 * owner-only e auditada.
 */
export const adminMappingRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/admin/expense-groups
  // Lista grupos financeiros do tenant + estado de classificação,
  // ordenados por valor total desc (prioridade Pareto).
  // ---------------------------------------------------------------------
  app.get('/expense-groups', async (req, reply) => {
    const tenantId = req.tenantId!
    let locationIds: string[] | undefined
    try {
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Agrega despesa por grupo financeiro (todo o histórico — sem filtro de mês no MVP)
    const groupRows = await db
      .select({
        code:  dg.financialGroupCode,
        name:  sql<string>`max(${dg.financialGroupName})`,
        total: sum(dg.totalExpenses).mapWith(Number),
        count: sql<number>`sum(${dg.entryCount})`.mapWith(Number),
      })
      .from(dg)
      .where(and(
        eq(dg.tenantId, tenantId),
        locationIds ? inArray(dg.locationId, locationIds) : undefined,
      ))
      .groupBy(dg.financialGroupCode)

    // Mapa de classificação do tenant
    const classRows = await db
      .select({
        code:        dc.financialGroupCode,
        accounting:  dc.accountingType,
        customLabel: dc.customLabel,
      })
      .from(dc)
      .where(eq(dc.tenantId, tenantId))

    const classMap = new Map(classRows.map(r => [r.code, r]))

    const grandTotal = round2(groupRows.reduce((acc, r) => acc + n(r.total), 0))

    const groups = groupRows
      .map(r => {
        const total = round2(n(r.total))
        const cls   = classMap.get(r.code)
        const name  = r.name ?? null
        return {
          financial_group_code: r.code,
          financial_group_name: name,
          total,
          entry_count:          n(r.count),
          pct:                  pct(total, grandTotal),
          accounting_type:      cls?.accounting ?? null,
          custom_label:         cls?.customLabel ?? null,
          label:                cls?.customLabel ?? name ?? '(sem grupo)',
        }
      })
      .sort((a, b) => b.total - a.total)

    const classified = groups.filter(g => g.accounting_type != null)
    const classifiedAmount = round2(classified.reduce((acc, g) => acc + g.total, 0))

    return reply.send({
      grand_total: grandTotal,
      groups,
      summary: {
        classified:           classified.length,
        unclassified:         groups.length - classified.length,
        classified_amount:    classifiedAmount,
        classified_pct_value: pct(classifiedAmount, grandTotal),
      },
    })
  })

  // ---------------------------------------------------------------------
  // PUT /api/v1/admin/expense-classification
  // Upsert de 1+ grupos. Owner-only. Auditado em app.audit_log.
  // ---------------------------------------------------------------------
  app.put('/expense-classification', { preHandler: requireOwnerRole }, async (req, reply) => {
    const tenantId = req.tenantId!
    const userId   = req.userId!
    const body = req.body as { items?: Array<{ financial_group_code?: unknown; accounting_type?: unknown; custom_label?: unknown }> }

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({ error: 'Body deve conter "items" (array não vazio)' })
    }

    // Valida e normaliza
    const items: Array<{ code: string; accounting: string; label: string | null }> = []
    for (const raw of body.items) {
      const code = typeof raw.financial_group_code === 'string' ? raw.financial_group_code : null
      if (code == null) {
        return reply.status(400).send({ error: 'Cada item precisa de "financial_group_code" (string)' })
      }
      if (!isAccountingType(raw.accounting_type)) {
        return reply.status(400).send({
          error: `"accounting_type" inválido para grupo ${code}. Permitidos: ${ACCOUNTING_TYPES.join(', ')}`,
        })
      }
      const labelRaw = typeof raw.custom_label === 'string' ? raw.custom_label.trim() : ''
      items.push({ code, accounting: raw.accounting_type, label: labelRaw === '' ? null : labelRaw })
    }

    // Estado anterior (para auditoria)
    const codes = items.map(i => i.code)
    const beforeRows = await db
      .select({ code: dc.financialGroupCode, accounting: dc.accountingType, customLabel: dc.customLabel })
      .from(dc)
      .where(and(eq(dc.tenantId, tenantId), inArray(dc.financialGroupCode, codes)))
    const beforeMap = new Map(beforeRows.map(r => [r.code, r]))

    // Upsert em transação + auditoria
    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .insert(dc)
          .values({
            tenantId,
            financialGroupCode: item.code,
            accountingType:     item.accounting,
            customLabel:        item.label,
            createdBy:          userId,
          })
          .onConflictDoUpdate({
            target: [dc.tenantId, dc.financialGroupCode],
            set: {
              accountingType: item.accounting,
              customLabel:    item.label,
              updatedAt:      sql`now()`,
            },
          })

        const before = beforeMap.get(item.code) ?? null
        await tx.insert(auditLog).values({
          tenantId,
          actorUserId:  userId,
          action:       before ? 'expense_classification.update' : 'expense_classification.create',
          targetEntity: 'expense_classification',
          payloadBefore: before
            ? { financial_group_code: item.code, accounting_type: before.accounting, custom_label: before.customLabel }
            : null,
          payloadAfter: { financial_group_code: item.code, accounting_type: item.accounting, custom_label: item.label },
          ipAddress: req.ip,
        })
      }
    })

    return reply.send({ ok: true, upserted: items.length })
  })
}

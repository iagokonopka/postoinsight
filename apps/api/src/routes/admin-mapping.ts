import type { FastifyPluginAsync } from 'fastify'
import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvExpenseGroupMonthly as dg, expenseClassification as dc, auditLog,
  factSale as fs, productClassification as pc } from '@postoinsight/db'
import { requireTenantSession, requireOwnerRole } from '../lib/auth.js'
import { ACCOUNTING_TYPES, isAccountingType, isSegment, isClassificationKey } from '@postoinsight/shared'
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

  // =====================================================================
  // Classificação de PRODUTO (Plano 2b). Spec: docs/specs/produto-classificacao.md
  // Override não-destrutivo aplicado em tempo de leitura nas telas Combustível
  // e Conveniência. classification_key = "<nível>:<código>".
  // =====================================================================

  // ---------------------------------------------------------------------
  // GET /api/v1/admin/product-groups
  // Lista os nós classificáveis (combustível por produto, conveniência por
  // grupo) com estado de classificação, ordenados por receita desc (Pareto).
  // ---------------------------------------------------------------------
  app.get('/product-groups', async (req, reply) => {
    const tenantId = req.tenantId!
    const segParam = (req.query as any).segment
    const wantFuel = segParam == null || segParam === 'combustivel'
    const wantConv = segParam == null || segParam === 'conveniencia' || segParam === 'lubrificantes' || segParam === 'servicos'

    let locationIds: string[] | undefined
    try {
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }
    const locFilter = locationIds ? inArray(fs.locationId, locationIds) : undefined

    type Node = {
      classification_key: string
      segment: string
      source_code: string
      erp_label: string
      context: string | null
      revenue: number
    }
    const nodes: Node[] = []

    // Combustível → 1 nó por produto (source_product_id)
    if (wantFuel) {
      const rows = await db
        .select({
          code:      fs.sourceProductId,
          erpLabel:  sql<string>`max(${fs.productName})`,
          context:   sql<string | null>`max(${fs.subgroupName})`,
          revenue:   sum(fs.totalValue).mapWith(Number),
        })
        .from(fs)
        .where(and(eq(fs.tenantId, tenantId), eq(fs.segment, 'combustivel'), locFilter))
        .groupBy(fs.sourceProductId)
      for (const r of rows) {
        nodes.push({
          classification_key: `product:${r.code}`,
          segment: 'combustivel',
          source_code: r.code,
          erp_label: r.erpLabel ?? '(sem nome)',
          context: r.context ?? null,
          revenue: round2(n(r.revenue)),
        })
      }
    }

    // Conveniência/loja → 1 nó por grupo (group_id), unifica group_id disperso
    if (wantConv) {
      const segs = segParam == null
        ? ['conveniencia', 'lubrificantes', 'servicos']
        : [segParam as string]
      const rows = await db
        .select({
          code:      fs.groupId,
          erpLabel:  sql<string | null>`max(${fs.groupName})`,
          context:   sql<string | null>`max(${fs.categoryName})`,
          segment:   sql<string>`max(${fs.segment})`,
          revenue:   sum(fs.totalValue).mapWith(Number),
        })
        .from(fs)
        .where(and(eq(fs.tenantId, tenantId), inArray(fs.segment, segs), locFilter))
        .groupBy(fs.groupId)
      for (const r of rows) {
        nodes.push({
          classification_key: `group:${r.code}`,
          segment: r.segment ?? 'conveniencia',
          source_code: String(r.code),
          erp_label: r.erpLabel ?? '(sem grupo)',
          context: r.context ?? null,
          revenue: round2(n(r.revenue)),
        })
      }
    }

    // Mapa de classificação do tenant
    const classRows = await db
      .select({
        key:      pc.classificationKey,
        segment:  pc.segmentOverride,
        display:  pc.displayGroup,
        label:    pc.customLabel,
        visible:  pc.visible,
        order:    pc.sortOrder,
      })
      .from(pc)
      .where(eq(pc.tenantId, tenantId))
    const classMap = new Map(classRows.map(r => [r.key, r]))

    nodes.sort((a, b) => b.revenue - a.revenue)
    const totalRevenue = round2(nodes.reduce((acc, x) => acc + x.revenue, 0))

    let cum = 0
    const out = nodes.map(node => {
      cum = round2(cum + node.revenue)
      const cls = classMap.get(node.classification_key)
      return {
        classification_key: node.classification_key,
        segment:            node.segment,
        source_code:        node.source_code,
        erp_label:          node.erp_label,
        context:            node.context,
        revenue:            node.revenue,
        pct:                pct(node.revenue, totalRevenue),
        cum_pct:            pct(cum, totalRevenue),
        segment_override:   cls?.segment ?? null,
        display_group:      cls?.display ?? null,
        custom_label:       cls?.label ?? null,
        visible:            cls?.visible ?? true,
        sort_order:         cls?.order ?? null,
        label:              cls?.label ?? node.erp_label,
      }
    })

    const classified = out.filter(g => classMap.has(g.classification_key))
    const valorClassificado = round2(classified.reduce((acc, g) => acc + g.revenue, 0))

    return reply.send({
      total_revenue: totalRevenue,
      nodes: out,
      summary: {
        classified:             classified.length,
        unclassified:           out.length - classified.length,
        pct_classified_revenue: pct(valorClassificado, totalRevenue),
      },
    })
  })

  // ---------------------------------------------------------------------
  // PUT /api/v1/admin/product-classification
  // Upsert de 1+ nós. Owner-only. Auditado em app.audit_log.
  // ---------------------------------------------------------------------
  app.put('/product-classification', { preHandler: requireOwnerRole }, async (req, reply) => {
    const tenantId = req.tenantId!
    const userId   = req.userId!
    const body = req.body as { items?: Array<Record<string, unknown>> }

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return reply.status(400).send({ error: 'Body deve conter "items" (array não vazio)' })
    }

    type Item = {
      key: string
      segment: string | null
      display: string | null
      label: string | null
      visible: boolean
      order: number | null
    }
    const items: Item[] = []
    for (const raw of body.items) {
      const key = raw.classification_key
      if (!isClassificationKey(key)) {
        return reply.status(400).send({ error: '"classification_key" inválido (esperado "<nível>:<código>")' })
      }
      const segmentOverride = raw.segment_override
      if (segmentOverride != null && !isSegment(segmentOverride)) {
        return reply.status(400).send({ error: `"segment_override" inválido para ${key}` })
      }
      const trim = (v: unknown) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : null)
      items.push({
        key,
        segment: segmentOverride ?? null,
        display: trim(raw.display_group),
        label:   trim(raw.custom_label),
        visible: raw.visible === undefined ? true : Boolean(raw.visible),
        order:   typeof raw.sort_order === 'number' ? raw.sort_order : null,
      })
    }

    // Estado anterior (para auditoria)
    const keys = items.map(i => i.key)
    const beforeRows = await db
      .select({
        key: pc.classificationKey, segment: pc.segmentOverride, display: pc.displayGroup,
        label: pc.customLabel, visible: pc.visible, order: pc.sortOrder,
      })
      .from(pc)
      .where(and(eq(pc.tenantId, tenantId), inArray(pc.classificationKey, keys)))
    const beforeMap = new Map(beforeRows.map(r => [r.key, r]))

    await db.transaction(async (tx) => {
      for (const item of items) {
        await tx
          .insert(pc)
          .values({
            tenantId,
            classificationKey: item.key,
            segmentOverride:   item.segment,
            displayGroup:      item.display,
            customLabel:       item.label,
            visible:           item.visible,
            sortOrder:         item.order,
            createdBy:         userId,
          })
          .onConflictDoUpdate({
            target: [pc.tenantId, pc.classificationKey],
            set: {
              segmentOverride: item.segment,
              displayGroup:    item.display,
              customLabel:     item.label,
              visible:         item.visible,
              sortOrder:       item.order,
              updatedAt:       sql`now()`,
            },
          })

        const before = beforeMap.get(item.key) ?? null
        await tx.insert(auditLog).values({
          tenantId,
          actorUserId:  userId,
          action:       before ? 'product_classification.update' : 'product_classification.create',
          targetEntity: 'product_classification',
          payloadBefore: before
            ? { classification_key: item.key, segment_override: before.segment, display_group: before.display, custom_label: before.label, visible: before.visible }
            : null,
          payloadAfter: { classification_key: item.key, segment_override: item.segment, display_group: item.display, custom_label: item.label, visible: item.visible },
          ipAddress: req.ip,
        })
      }
    })

    return reply.send({ ok: true, upserted: items.length })
  })
}

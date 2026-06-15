import type { FastifyPluginAsync } from 'fastify'
import { and, eq, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvDespesaGrupoMensal as dg, despesaClassificacao as dc, auditLog } from '@postoinsight/db'
import { requireTenantSession, requireOwnerRole } from '../lib/auth.js'
import { ACCOUNTING_TYPES, isAccountingType } from '@postoinsight/shared'
import { BadQueryError, parseUuidArray, n, round2, pct } from '../lib/queryParsers.js'

/**
 * Classificação contábil de despesas por grupo financeiro (Plano 2a).
 * Spec: docs/specs/admin-mapping.md
 *
 * Override não-destrutivo: a classificação vive em app.despesa_classificacao;
 * canonical/raw nunca são reescritos. Leitura é tenant-scoped; escrita é
 * owner-only e auditada.
 */
export const adminMappingRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/admin/despesa-grupos
  // Lista grupos financeiros do tenant + estado de classificação,
  // ordenados por valor total desc (prioridade Pareto).
  // ---------------------------------------------------------------------
  app.get('/despesa-grupos', async (req, reply) => {
    const tenantId = req.tenantId!
    let locationIds: string[] | undefined
    try {
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Agrega despesa por grupo financeiro (todo o histórico — sem filtro de mês no MVP)
    const grupoRows = await db
      .select({
        codigo:    dg.grupoFinanceiroCodigo,
        descricao: sql<string>`max(${dg.grupoFinanceiroDescricao})`,
        total:     sum(dg.totalDespesas).mapWith(Number),
        qtd:       sql<number>`sum(${dg.qtdLancamentos})`.mapWith(Number),
      })
      .from(dg)
      .where(and(
        eq(dg.tenantId, tenantId),
        locationIds ? inArray(dg.locationId, locationIds) : undefined,
      ))
      .groupBy(dg.grupoFinanceiroCodigo)

    // Mapa de classificação do tenant
    const classRows = await db
      .select({
        codigo:      dc.grupoFinanceiroCodigo,
        accounting:  dc.accountingType,
        customLabel: dc.customLabel,
      })
      .from(dc)
      .where(eq(dc.tenantId, tenantId))

    const classMap = new Map(classRows.map(r => [r.codigo, r]))

    const totalGeral = round2(grupoRows.reduce((acc, r) => acc + n(r.total), 0))

    const grupos = grupoRows
      .map(r => {
        const total = round2(n(r.total))
        const cls   = classMap.get(r.codigo)
        const descricao = r.descricao ?? null
        return {
          grupo_financeiro_codigo:    r.codigo,
          grupo_financeiro_descricao: descricao,
          total,
          qtd_lancamentos:            n(r.qtd),
          pct:                        pct(total, totalGeral),
          accounting_type:            cls?.accounting ?? null,
          custom_label:               cls?.customLabel ?? null,
          label:                      cls?.customLabel ?? descricao ?? '(sem grupo)',
        }
      })
      .sort((a, b) => b.total - a.total)

    const classificados = grupos.filter(g => g.accounting_type != null)
    const valorClassificado = round2(classificados.reduce((acc, g) => acc + g.total, 0))

    return reply.send({
      total_geral: totalGeral,
      grupos,
      resumo: {
        classificados:          classificados.length,
        nao_classificados:      grupos.length - classificados.length,
        valor_classificado:     valorClassificado,
        pct_classificado_valor: pct(valorClassificado, totalGeral),
      },
    })
  })

  // ---------------------------------------------------------------------
  // PUT /api/v1/admin/despesa-classificacao
  // Upsert de 1+ grupos. Owner-only. Auditado em app.audit_log.
  // ---------------------------------------------------------------------
  app.put('/despesa-classificacao', { preHandler: requireOwnerRole }, async (req, reply) => {
    const tenantId = req.tenantId!
    const userId   = req.userId!
    const body = req.body as { itens?: Array<{ grupo_financeiro_codigo?: unknown; accounting_type?: unknown; custom_label?: unknown }> }

    if (!body || !Array.isArray(body.itens) || body.itens.length === 0) {
      return reply.status(400).send({ error: 'Body deve conter "itens" (array não vazio)' })
    }

    // Valida e normaliza
    const itens: Array<{ codigo: string; accounting: string; label: string | null }> = []
    for (const raw of body.itens) {
      const codigo = typeof raw.grupo_financeiro_codigo === 'string' ? raw.grupo_financeiro_codigo : null
      if (codigo == null) {
        return reply.status(400).send({ error: 'Cada item precisa de "grupo_financeiro_codigo" (string)' })
      }
      if (!isAccountingType(raw.accounting_type)) {
        return reply.status(400).send({
          error: `"accounting_type" inválido para grupo ${codigo}. Permitidos: ${ACCOUNTING_TYPES.join(', ')}`,
        })
      }
      const labelRaw = typeof raw.custom_label === 'string' ? raw.custom_label.trim() : ''
      itens.push({ codigo, accounting: raw.accounting_type, label: labelRaw === '' ? null : labelRaw })
    }

    // Estado anterior (para auditoria)
    const codigos = itens.map(i => i.codigo)
    const beforeRows = await db
      .select({ codigo: dc.grupoFinanceiroCodigo, accounting: dc.accountingType, customLabel: dc.customLabel })
      .from(dc)
      .where(and(eq(dc.tenantId, tenantId), inArray(dc.grupoFinanceiroCodigo, codigos)))
    const beforeMap = new Map(beforeRows.map(r => [r.codigo, r]))

    // Upsert em transação + auditoria
    await db.transaction(async (tx) => {
      for (const item of itens) {
        await tx
          .insert(dc)
          .values({
            tenantId,
            grupoFinanceiroCodigo: item.codigo,
            accountingType:        item.accounting,
            customLabel:           item.label,
            createdBy:             userId,
          })
          .onConflictDoUpdate({
            target: [dc.tenantId, dc.grupoFinanceiroCodigo],
            set: {
              accountingType: item.accounting,
              customLabel:    item.label,
              updatedAt:      sql`now()`,
            },
          })

        const before = beforeMap.get(item.codigo) ?? null
        await tx.insert(auditLog).values({
          tenantId,
          actorUserId:  userId,
          action:       before ? 'despesa_classificacao.update' : 'despesa_classificacao.create',
          targetEntity: 'despesa_classificacao',
          payloadBefore: before
            ? { grupo_financeiro_codigo: item.codigo, accounting_type: before.accounting, custom_label: before.customLabel }
            : null,
          payloadAfter: { grupo_financeiro_codigo: item.codigo, accounting_type: item.accounting, custom_label: item.label },
          ipAddress: req.ip,
        })
      }
    })

    return reply.send({ ok: true, upserted: itens.length })
  })
}

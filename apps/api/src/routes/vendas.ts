import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvVendasDiario as mv } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const SEGMENTOS = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const
const GRANULARIDADES = ['dia', 'semana', 'mes'] as const

/**
 * Endpoints do Dashboard de Vendas — `analytics.mv_vendas_diario`.
 * Specs: docs/specs/dashboard-vendas.md
 *
 * Toda query filtra por tenant_id derivado da sessão. Nunca aceita
 * tenant_id como parâmetro externo.
 */
export const vendasRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/resumo
  // ---------------------------------------------------------------------
  app.get('/resumo', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segmento:        mv.segmento,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        descontos:       sum(mv.descontos).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_itens:       sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
        qtd_total:       sum(mv.qtdTotal).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segmento)

    const totais = {
      receita_bruta:   0,
      descontos:       0,
      receita_liquida: 0,
      cmv:             0,
      margem_bruta:    0,
      qtd_itens:       0,
    }
    for (const r of rows) {
      totais.receita_bruta   += n(r.receita_bruta)
      totais.descontos       += n(r.descontos)
      totais.receita_liquida += n(r.receita_liquida)
      totais.cmv             += n(r.cmv)
      totais.margem_bruta    += n(r.margem_bruta)
      totais.qtd_itens       += n(r.qtd_itens)
    }

    // Garante presença dos 4 segmentos (mesmo zerados)
    const por_segmento = SEGMENTOS.map(seg => {
      const r = rows.find(x => x.segmento === seg)
      const receita_bruta   = n(r?.receita_bruta)
      const receita_liquida = n(r?.receita_liquida)
      const cmv             = n(r?.cmv)
      const margem_bruta    = n(r?.margem_bruta)
      return {
        segmento: seg,
        receita_bruta:   round2(receita_bruta),
        receita_liquida: round2(receita_liquida),
        cmv:             round2(cmv),
        margem_bruta:    round2(margem_bruta),
        margem_pct:      pct(margem_bruta, receita_liquida),
        participacao_pct: pct(receita_bruta, totais.receita_bruta),
      }
    })

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      locations: locationIds ?? 'all',
      totais: {
        receita_bruta:   round2(totais.receita_bruta),
        descontos:       round2(totais.descontos),
        receita_liquida: round2(totais.receita_liquida),
        cmv:             round2(totais.cmv),
        margem_bruta:    round2(totais.margem_bruta),
        margem_pct:      pct(totais.margem_bruta, totais.receita_liquida),
        qtd_itens:       totais.qtd_itens,
      },
      por_segmento,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/evolucao
  // ---------------------------------------------------------------------
  app.get('/evolucao', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string
    let locationIds: string[] | undefined
    let segmento: typeof SEGMENTOS[number] | undefined
    let granularidade: typeof GRANULARIDADES[number]
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segmento = parseEnum((req.query as any).segmento, SEGMENTOS, 'segmento')
      granularidade = parseEnum((req.query as any).granularidade, GRANULARIDADES, 'granularidade', 'dia')!
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Coluna de período conforme granularidade.
    const periodoExpr =
      granularidade === 'dia'
        ? sql<string>`to_char(${mv.dataVenda}, 'YYYY-MM-DD')`
        : granularidade === 'mes'
          ? sql<string>`${mv.anoMes}`
          : sql<string>`${mv.anoMes} || '-W' || lpad(${mv.semanaAno}::text, 2, '0')`

    const rows = await db
      .select({
        periodo:       periodoExpr.as('periodo'),
        receita_bruta: sum(mv.receitaBruta).mapWith(Number),
        margem_bruta:  sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        segmento ? eq(mv.segmento, segmento) : undefined,
      ))
      .groupBy(periodoExpr)
      .orderBy(periodoExpr)

    return reply.send({
      granularidade,
      serie: rows.map(r => ({
        periodo:       r.periodo,
        receita_bruta: round2(n(r.receita_bruta)),
        margem_bruta:  round2(n(r.margem_bruta)),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/segmentos
  // Igual ao /resumo mas com qtd_itens e qtd_total no por_segmento.
  // ---------------------------------------------------------------------
  app.get('/segmentos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segmento:        mv.segmento,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_itens:       sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
        qtd_total:       sum(mv.qtdTotal).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segmento)

    const receitaTotal = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    const por_segmento = SEGMENTOS.map(seg => {
      const r = rows.find(x => x.segmento === seg)
      const receita_bruta   = n(r?.receita_bruta)
      const receita_liquida = n(r?.receita_liquida)
      const margem_bruta    = n(r?.margem_bruta)
      return {
        segmento: seg,
        receita_bruta:   round2(receita_bruta),
        receita_liquida: round2(receita_liquida),
        cmv:             round2(n(r?.cmv)),
        margem_bruta:    round2(margem_bruta),
        margem_pct:      pct(margem_bruta, receita_liquida),
        participacao_pct: pct(receita_bruta, receitaTotal),
        qtd_itens:       n(r?.qtd_itens),
        qtd_total:       round2(n(r?.qtd_total)),
      }
    })

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      por_segmento,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/grupos
  // ---------------------------------------------------------------------
  app.get('/grupos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let segmento: typeof SEGMENTOS[number] | undefined
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segmento = parseEnum((req.query as any).segmento, SEGMENTOS, 'segmento')
      if (!segmento) {
        return reply.status(400).send({ error: 'Parâmetro "segmento" é obrigatório' })
      }
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        grupo_id:        mv.grupoId,
        grupo_descricao: sql<string | null>`MAX(${mv.grupoDescricao})`,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, segmento),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)

    const receitaTotal = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    const grupos = rows
      .map(r => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        return {
          grupo_id:        r.grupo_id,
          grupo_descricao: r.grupo_descricao,
          receita_bruta:   round2(receita_bruta),
          cmv:             round2(n(r.cmv)),
          margem_bruta:    round2(margem_bruta),
          margem_pct:      pct(margem_bruta, receita_liquida),
          participacao_pct: pct(receita_bruta, receitaTotal),
        }
      })
      .sort((a, b) => b.receita_bruta - a.receita_bruta)

    return reply.send({ segmento, grupos })
  })
}

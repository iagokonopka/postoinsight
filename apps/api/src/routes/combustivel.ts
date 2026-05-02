import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvCombustivelDiario as mv } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseIntArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const GRANULARIDADES = ['dia', 'semana', 'mes'] as const

/**
 * Endpoints do Dashboard de Combustível — `analytics.mv_combustivel_diario`.
 * Specs: docs/specs/dashboard-combustivel.md
 */
export const combustivelRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/combustivel/resumo
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
        grupo_id:        mv.grupoId,
        grupo_descricao: sql<string | null>`MAX(${mv.grupoDescricao})`,
        volume_litros:   sum(mv.volumeLitros).mapWith(Number),
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)

    const totais = rows.reduce((acc, r) => {
      acc.volume_litros   += n(r.volume_litros)
      acc.receita_bruta   += n(r.receita_bruta)
      acc.receita_liquida += n(r.receita_liquida)
      acc.cmv             += n(r.cmv)
      acc.margem_bruta    += n(r.margem_bruta)
      return acc
    }, { volume_litros: 0, receita_bruta: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0 })

    const por_produto = rows
      .map(r => {
        const volume_litros = n(r.volume_litros)
        const receita_bruta = n(r.receita_bruta)
        const cmv           = n(r.cmv)
        const margem_bruta  = n(r.margem_bruta)
        const receita_liq   = n(r.receita_liquida)
        return {
          grupo_id:               r.grupo_id,
          grupo_descricao:        r.grupo_descricao,
          volume_litros:          round2(volume_litros),
          receita_bruta:          round2(receita_bruta),
          receita_liquida:        round2(receita_liq),
          cmv:                    round2(cmv),
          margem_bruta:           round2(margem_bruta),
          margem_pct:             pct(margem_bruta, receita_liq),
          preco_medio_litro:      volume_litros > 0 ? round2(receita_bruta / volume_litros) : null,
          custo_medio_litro:      volume_litros > 0 && cmv > 0 ? round2(cmv / volume_litros) : null,
          participacao_volume_pct:  pct(volume_litros, totais.volume_litros),
          participacao_receita_pct: pct(receita_bruta, totais.receita_bruta),
        }
      })
      .sort((a, b) => b.volume_litros - a.volume_litros)

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      locations: locationIds ?? 'all',
      totais: {
        volume_litros:   round2(totais.volume_litros),
        receita_bruta:   round2(totais.receita_bruta),
        receita_liquida: round2(totais.receita_liquida),
        cmv:             round2(totais.cmv),
        margem_bruta:    round2(totais.margem_bruta),
        margem_pct:      pct(totais.margem_bruta, totais.receita_liquida),
      },
      por_produto,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/combustivel/evolucao
  // ---------------------------------------------------------------------
  app.get('/evolucao', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string
    let locationIds: string[] | undefined
    let grupoIds: number[] | undefined
    let granularidade: typeof GRANULARIDADES[number]
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      grupoIds    = parseIntArray((req.query as any).grupo_id, 'grupo_id')
      granularidade = parseEnum((req.query as any).granularidade, GRANULARIDADES, 'granularidade', 'dia')!
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const periodoExpr =
      granularidade === 'dia'
        ? sql<string>`to_char(${mv.dataVenda}, 'YYYY-MM-DD')`
        : granularidade === 'mes'
          ? sql<string>`${mv.anoMes}`
          : sql<string>`${mv.anoMes} || '-W' || lpad(${mv.semanaAno}::text, 2, '0')`

    const rows = await db
      .select({
        periodo:       periodoExpr.as('periodo'),
        volume_litros: sum(mv.volumeLitros).mapWith(Number),
        receita_bruta: sum(mv.receitaBruta).mapWith(Number),
        margem_bruta:  sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        grupoIds ? inArray(mv.grupoId, grupoIds) : undefined,
      ))
      .groupBy(periodoExpr)
      .orderBy(periodoExpr)

    return reply.send({
      granularidade,
      serie: rows.map(r => ({
        periodo:       r.periodo,
        volume_litros: round2(n(r.volume_litros)),
        receita_bruta: round2(n(r.receita_bruta)),
        margem_bruta:  round2(n(r.margem_bruta)),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/combustivel/produtos
  // Reaproveita o mesmo agrupamento do /resumo, mas retorna apenas o array.
  // ---------------------------------------------------------------------
  app.get('/produtos', async (req, reply) => {
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
        grupo_id:        mv.grupoId,
        grupo_descricao: sql<string | null>`MAX(${mv.grupoDescricao})`,
        volume_litros:   sum(mv.volumeLitros).mapWith(Number),
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)

    const totalVolume  = rows.reduce((a, r) => a + n(r.volume_litros), 0)
    const totalReceita = rows.reduce((a, r) => a + n(r.receita_bruta), 0)

    const produtos = rows
      .map(r => {
        const volume_litros = n(r.volume_litros)
        const receita_bruta = n(r.receita_bruta)
        const cmv           = n(r.cmv)
        const margem_bruta  = n(r.margem_bruta)
        const receita_liq   = n(r.receita_liquida)
        return {
          grupo_id:               r.grupo_id,
          grupo_descricao:        r.grupo_descricao,
          volume_litros:          round2(volume_litros),
          receita_bruta:          round2(receita_bruta),
          receita_liquida:        round2(receita_liq),
          cmv:                    round2(cmv),
          margem_bruta:           round2(margem_bruta),
          margem_pct:             pct(margem_bruta, receita_liq),
          preco_medio_litro:      volume_litros > 0 ? round2(receita_bruta / volume_litros) : null,
          custo_medio_litro:      volume_litros > 0 && cmv > 0 ? round2(cmv / volume_litros) : null,
          participacao_volume_pct:  pct(volume_litros, totalVolume),
          participacao_receita_pct: pct(receita_bruta, totalReceita),
        }
      })
      .sort((a, b) => b.volume_litros - a.volume_litros)

    return reply.send({ produtos })
  })
}

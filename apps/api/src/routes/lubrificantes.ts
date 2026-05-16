import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvConvenienciaDiario as mv } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const GRANULARIDADES = ['dia', 'semana', 'mes'] as const

// Filtro fixo: apenas lubrificantes
const SEG = 'lubrificantes'

/**
 * Endpoints do Dashboard de Lubrificantes — `analytics.mv_conveniencia_diario` filtrado por segmento = 'lubrificantes'.
 * Espelha a estrutura de convenienciaRoutes, mas restrito ao segmento lubrificantes.
 */
export const lubrificantesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/lubrificantes/resumo
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
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_itens:       sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, SEG),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)

    const totais = rows.reduce((acc, r) => {
      acc.receita_bruta   += n(r.receita_bruta)
      acc.receita_liquida += n(r.receita_liquida)
      acc.cmv             += n(r.cmv)
      acc.margem_bruta    += n(r.margem_bruta)
      acc.qtd_itens       += n(r.qtd_itens)
      return acc
    }, { receita_bruta: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0, qtd_itens: 0 })

    const por_grupo = rows
      .map(r => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        return {
          grupo_id:         r.grupo_id,
          grupo_descricao:  r.grupo_descricao,
          receita_bruta:    round2(receita_bruta),
          receita_liquida:  round2(receita_liquida),
          cmv:              round2(n(r.cmv)),
          margem_bruta:     round2(margem_bruta),
          margem_pct:       pct(margem_bruta, receita_liquida),
          qtd_itens:        n(r.qtd_itens),
          participacao_pct: pct(receita_bruta, totais.receita_bruta),
        }
      })
      .sort((a, b) => b.receita_bruta - a.receita_bruta)

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      locations: locationIds ?? 'all',
      totais: {
        receita_bruta:   round2(totais.receita_bruta),
        receita_liquida: round2(totais.receita_liquida),
        cmv:             round2(totais.cmv),
        margem_bruta:    round2(totais.margem_bruta),
        margem_pct:      pct(totais.margem_bruta, totais.receita_liquida),
        qtd_itens:       totais.qtd_itens,
      },
      por_grupo,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/lubrificantes/evolucao
  // ---------------------------------------------------------------------
  app.get('/evolucao', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string
    let locationIds: string[] | undefined
    let granularidade: typeof GRANULARIDADES[number]
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
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
        receita_bruta: sum(mv.receitaBruta).mapWith(Number),
        margem_bruta:  sum(mv.margemBruta).mapWith(Number),
        qtd_itens:     sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, SEG),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(periodoExpr)
      .orderBy(periodoExpr)

    return reply.send({
      granularidade,
      serie: rows.map(r => ({
        periodo:       r.periodo,
        receita_bruta: round2(n(r.receita_bruta)),
        margem_bruta:  round2(n(r.margem_bruta)),
        qtd_itens:     n(r.qtd_itens),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/lubrificantes/grupos
  // Retorna grupos (ex: Óleos de Motor, Graxas) com KPIs agregados.
  // ---------------------------------------------------------------------
  app.get('/grupos', async (req, reply) => {
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
        categoria_codigo: mv.categoriaCodigo,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_itens:       sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, SEG),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId, mv.categoriaCodigo)

    const total = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    const grupos = rows
      .map(r => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        return {
          grupo_id:         r.grupo_id,
          grupo_descricao:  r.grupo_descricao,
          categoria_codigo: r.categoria_codigo,
          receita_bruta:    round2(receita_bruta),
          receita_liquida:  round2(receita_liquida),
          cmv:              round2(n(r.cmv)),
          margem_bruta:     round2(margem_bruta),
          margem_pct:       pct(margem_bruta, receita_liquida),
          qtd_itens:        n(r.qtd_itens),
          participacao_pct: pct(receita_bruta, total),
        }
      })
      .sort((a, b) => b.receita_bruta - a.receita_bruta)

    return reply.send({ grupos })
  })
}

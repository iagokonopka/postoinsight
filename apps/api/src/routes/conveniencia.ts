import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum } from 'drizzle-orm'
import { db } from '../db.js'
import { mvConvenienciaDiario as mv } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const SEGMENTOS_LOJA = ['conveniencia', 'lubrificantes', 'servicos'] as const
const GRANULARIDADES = ['dia', 'semana', 'mes'] as const

/**
 * Endpoints do Dashboard de Conveniência (loja) — `analytics.mv_conveniencia_diario`.
 * Specs: docs/specs/dashboard-conveniencia.md
 *
 * Cobre os 3 segmentos não-combustível: conveniencia, lubrificantes, servicos.
 */
export const convenienciaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/conveniencia/resumo
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
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segmento)

    const totais = rows.reduce((acc, r) => {
      acc.receita_bruta   += n(r.receita_bruta)
      acc.descontos       += n(r.descontos)
      acc.receita_liquida += n(r.receita_liquida)
      acc.cmv             += n(r.cmv)
      acc.margem_bruta    += n(r.margem_bruta)
      acc.qtd_itens       += n(r.qtd_itens)
      return acc
    }, { receita_bruta: 0, descontos: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0, qtd_itens: 0 })

    const por_segmento = SEGMENTOS_LOJA.map(seg => {
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
  // GET /api/v1/conveniencia/evolucao
  // ---------------------------------------------------------------------
  app.get('/evolucao', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string
    let locationIds: string[] | undefined
    let segmento: typeof SEGMENTOS_LOJA[number] | undefined
    let granularidade: typeof GRANULARIDADES[number]
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segmento = parseEnum((req.query as any).segmento, SEGMENTOS_LOJA, 'segmento')
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
  // GET /api/v1/conveniencia/categorias
  // ---------------------------------------------------------------------
  app.get('/categorias', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let segmento: typeof SEGMENTOS_LOJA[number] | undefined
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segmento    = parseEnum((req.query as any).segmento, SEGMENTOS_LOJA, 'segmento')
      if (!segmento) {
        return reply.status(400).send({ error: 'Parâmetro "segmento" é obrigatório' })
      }
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        categoria_codigo:    mv.categoriaCodigo,
        categoria_descricao: sql<string | null>`MAX(${mv.categoriaDescricao})`,
        receita_bruta:       sum(mv.receitaBruta).mapWith(Number),
        receita_liquida:     sum(mv.receitaLiquida).mapWith(Number),
        cmv:                 sum(mv.cmv).mapWith(Number),
        margem_bruta:        sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, segmento),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.categoriaCodigo)

    const total = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    const categorias = rows
      .filter(r => n(r.receita_bruta) !== 0)
      .map(r => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        return {
          categoria_codigo:    r.categoria_codigo,
          categoria_descricao: r.categoria_descricao,
          receita_bruta:       round2(receita_bruta),
          cmv:                 round2(n(r.cmv)),
          margem_bruta:        round2(margem_bruta),
          margem_pct:          pct(margem_bruta, receita_liquida),
          participacao_pct:    pct(receita_bruta, total),
        }
      })
      .sort((a, b) => b.receita_bruta - a.receita_bruta)

    return reply.send({ segmento, categorias })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/conveniencia/grupos
  // ---------------------------------------------------------------------
  app.get('/grupos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let categoriaCodigo: string
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const cat = (req.query as any).categoria_codigo
      if (typeof cat !== 'string' || !cat.trim()) {
        return reply.status(400).send({ error: 'Parâmetro "categoria_codigo" é obrigatório' })
      }
      categoriaCodigo = cat.trim()
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
        eq(mv.categoriaCodigo, categoriaCodigo),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)

    const total = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

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
          participacao_pct: pct(receita_bruta, total),
        }
      })
      .sort((a, b) => b.receita_bruta - a.receita_bruta)

    return reply.send({ categoria_codigo: categoriaCodigo, grupos })
  })
}

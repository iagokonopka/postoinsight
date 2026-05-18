import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvConvenienciaDiario as mv, fatoVenda } from '@postoinsight/db'
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

    // Filtra apenas conveniência — lubrificantes e serviços têm páginas próprias
    const rows = await db
      .select({
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
        eq(mv.segmento, 'conveniencia'),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))

    const r = rows[0]
    const receita_bruta   = n(r?.receita_bruta)
    const descontos       = n(r?.descontos)
    const receita_liquida = n(r?.receita_liquida)
    const cmv             = n(r?.cmv)
    const margem_bruta    = n(r?.margem_bruta)
    const qtd_itens       = n(r?.qtd_itens)

    // Ticket médio: conta NFs distintas em fato_venda para o segmento conveniencia
    const nfRows = await db
      .select({ nf_count: sql<number>`COUNT(DISTINCT ${fatoVenda.nrNota})`.mapWith(Number) })
      .from(fatoVenda)
      .where(and(
        eq(fatoVenda.tenantId, tenantId),
        eq(fatoVenda.segmento, 'conveniencia'),
        gte(fatoVenda.dataVenda, dataInicio),
        lte(fatoVenda.dataVenda, dataFim),
        locationIds ? inArray(fatoVenda.locationId, locationIds) : undefined,
      ))
    const nf_count    = n(nfRows[0]?.nf_count)
    const ticket_medio = nf_count > 0 ? round2(receita_bruta / nf_count) : null

    return reply.send({
      periodo: { inicio: dataInicio, fim: dataFim },
      locations: locationIds ?? 'all',
      totais: {
        receita_bruta:   round2(receita_bruta),
        descontos:       round2(descontos),
        receita_liquida: round2(receita_liquida),
        cmv:             round2(cmv),
        margem_bruta:    round2(margem_bruta),
        margem_pct:      pct(margem_bruta, receita_liquida),
        qtd_itens,
        nf_count,
        ticket_medio,
      },
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
        // default para 'conveniencia' — lubrificantes/serviços têm rotas próprias
        eq(mv.segmento, segmento ?? 'conveniencia'),
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
      // segmento é opcional — default 'conveniencia'. Permite uso como scatter-data sem filtro obrigatório.
      segmento = parseEnum((req.query as any).segmento, SEGMENTOS_LOJA, 'segmento') ?? 'conveniencia'
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
        qtd_total:           sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
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
          qtd_total:           n(r.qtd_total),
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

  // ---------------------------------------------------------------------
  // GET /api/v1/conveniencia/top-grupos
  // Top 10 grupos da conveniência por receita (excluindo lubrificantes/serviços)
  // ---------------------------------------------------------------------
  app.get('/top-grupos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let limit = 10
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 50) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        grupo_id:        mv.grupoId,
        grupo_descricao: sql<string | null>`MAX(${mv.grupoDescricao})`,
        segmento:        sql<string>`MAX(${mv.segmento})`,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_itens:       sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segmento, 'conveniencia'),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.grupoId)
      .orderBy(desc(sum(mv.receitaBruta)))
      .limit(limit)

    const total = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)
    const grupoIds = rows.map(r => r.grupo_id).filter((id): id is number => id !== null)

    // Busca categorias de cada grupo para o Accordion aninhado
    const catRows = grupoIds.length > 0
      ? await db
          .select({
            grupo_id:            mv.grupoId,
            categoria_codigo:    mv.categoriaCodigo,
            categoria_descricao: sql<string | null>`MAX(${mv.categoriaDescricao})`,
            receita_bruta:       sum(mv.receitaBruta).mapWith(Number),
            receita_liquida:     sum(mv.receitaLiquida).mapWith(Number),
            cmv:                 sum(mv.cmv).mapWith(Number),
            margem_bruta:        sum(mv.margemBruta).mapWith(Number),
            qtd_itens:           sql<number>`COALESCE(SUM(${mv.qtdItens}), 0)`.mapWith(Number),
          })
          .from(mv)
          .where(and(
            eq(mv.tenantId, tenantId),
            eq(mv.segmento, 'conveniencia'),
            inArray(mv.grupoId, grupoIds),
            gte(mv.dataVenda, dataInicio),
            lte(mv.dataVenda, dataFim),
            locationIds ? inArray(mv.locationId, locationIds) : undefined,
          ))
          .groupBy(mv.grupoId, mv.categoriaCodigo)
          .orderBy(mv.grupoId, desc(sum(mv.receitaBruta)))
      : []

    // Indexa categorias por grupo_id
    const catByGrupo = new Map<number, object[]>()
    for (const c of catRows) {
      if (c.grupo_id === null) continue
      if (!catByGrupo.has(c.grupo_id)) catByGrupo.set(c.grupo_id, [])
      const rec = n(c.receita_bruta)
      const liq = n(c.receita_liquida)
      const mb  = n(c.margem_bruta)
      catByGrupo.get(c.grupo_id)!.push({
        categoria_codigo:    c.categoria_codigo,
        categoria_descricao: c.categoria_descricao,
        receita_bruta:       round2(rec),
        cmv:                 round2(n(c.cmv)),
        margem_bruta:        round2(mb),
        margem_pct:          pct(mb, liq),
        qtd_itens:           n(c.qtd_itens),
      })
    }

    return reply.send({
      grupos: rows.map((r, i) => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        return {
          rank:             i + 1,
          grupo_id:         r.grupo_id,
          grupo_descricao:  r.grupo_descricao ?? r.grupo_id,
          segmento:         r.segmento,
          receita_bruta:    round2(receita_bruta),
          cmv:              round2(n(r.cmv)),
          margem_bruta:     round2(margem_bruta),
          margem_pct:       pct(margem_bruta, receita_liquida),
          qtd_itens:        n(r.qtd_itens),
          participacao_pct: pct(receita_bruta, total),
          categorias:       catByGrupo.get(r.grupo_id ?? -1) ?? [],
        }
      }),
    })
  })
}

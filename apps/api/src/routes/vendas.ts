import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvVendasDiario as mv, fatoVenda, dimProduto, locations } from '@postoinsight/db'
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
        periodo:         periodoExpr.as('periodo'),
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
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
      serie: rows.map(r => {
        const margem_bruta    = n(r.margem_bruta)
        const receita_liquida = n(r.receita_liquida)
        return {
          periodo:       r.periodo,
          receita_bruta: round2(n(r.receita_bruta)),
          margem_bruta:  round2(margem_bruta),
          margem_pct:    pct(margem_bruta, receita_liquida),
        }
      }),
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

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/top-produtos
  // Top N grupos por receita bruta — todos os segmentos.
  // Chamado pelo DashboardPage. Usa mv_vendas_diario.
  // Query params: data_inicio, data_fim, location_id?, limit? (default 10, max 50)
  // ---------------------------------------------------------------------
  app.get('/top-produtos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let limit = 10
    let segmento: typeof SEGMENTOS[number] | undefined
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segmento = parseEnum((req.query as any).segmento, SEGMENTOS, 'segmento')
      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 50) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segmento:        mv.segmento,
        grupo_id:        mv.grupoId,
        grupo_descricao: sql<string | null>`MAX(${mv.grupoDescricao})`,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
        qtd_total:       sum(mv.qtdTotal).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        segmento ? eq(mv.segmento, segmento) : undefined,
      ))
      .groupBy(mv.segmento, mv.grupoId)
      .orderBy(desc(sum(mv.receitaBruta)))
      .limit(limit)

    const total = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    return reply.send({
      produtos: rows.map((r, i) => {
        const receita_bruta   = n(r.receita_bruta)
        const receita_liquida = n(r.receita_liquida)
        const margem_bruta    = n(r.margem_bruta)
        // Campos nomeados para bater com a interface TopProduto do DashboardPage:
        // produto → nome do grupo, categoria → segmento
        return {
          rank:             i + 1,
          produto:          r.grupo_descricao ?? String(r.grupo_id),
          categoria:        r.segmento ?? '',
          grupo_id:         r.grupo_id,
          receita:          round2(receita_bruta),
          cmv:              round2(n(r.cmv)),
          margem_bruta:     round2(margem_bruta),
          margem_pct:       pct(margem_bruta, receita_liquida),
          participacao_pct: pct(receita_bruta, total),
          qtd:              round2(n(r.qtd_total)),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/drill/subgrupos
  // Drill-down de grupo → subgrupos. Query em fato_venda JOIN dim_produto.
  // Query params: data_inicio, data_fim, segmento (obrigatório), grupo_id (obrigatório), location_id?
  // ---------------------------------------------------------------------
  app.get('/drill/subgrupos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let segmento: string, grupoId: number
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')

      const seg = (req.query as any).segmento
      if (typeof seg !== 'string' || !seg.trim()) {
        return reply.status(400).send({ error: 'Parâmetro "segmento" é obrigatório' })
      }
      segmento = seg.trim()

      const gid = parseInt((req.query as any).grupo_id)
      if (isNaN(gid)) {
        return reply.status(400).send({ error: 'Parâmetro "grupo_id" deve ser um número inteiro' })
      }
      grupoId = gid
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        subgrupo_id:        fatoVenda.subgrupoId,
        subgrupo_descricao: sql<string | null>`MAX(${fatoVenda.subgrupoDescricao})`,
        receita_bruta:      sum(fatoVenda.vlrTotal).mapWith(Number),
        cmv: sql<number>`COALESCE(SUM(${fatoVenda.custoUnitario} * ${fatoVenda.qtdVenda}), 0)`.mapWith(Number),
        desconto:           sum(fatoVenda.descontoTotal).mapWith(Number),
        qtd_itens:          sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(fatoVenda)
      .where(and(
        eq(fatoVenda.tenantId, tenantId),
        eq(fatoVenda.segmento, segmento),
        eq(fatoVenda.grupoId, grupoId),
        gte(fatoVenda.dataVenda, dataInicio),
        lte(fatoVenda.dataVenda, dataFim),
        locationIds ? inArray(fatoVenda.locationId, locationIds) : undefined,
      ))
      .groupBy(fatoVenda.subgrupoId)
      .orderBy(desc(sum(fatoVenda.vlrTotal)))

    const totalReceita = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    return reply.send({
      segmento,
      grupo_id: grupoId,
      subgrupos: rows.map(r => {
        const receita_bruta = n(r.receita_bruta)
        const cmv           = n(r.cmv)
        const desconto      = n(r.desconto)
        const receita_liq   = receita_bruta - desconto
        const margem_bruta  = receita_liq - cmv
        return {
          subgrupo_id:        r.subgrupo_id,
          subgrupo_descricao: r.subgrupo_descricao ?? `Subgrupo ${r.subgrupo_id}`,
          receita_bruta:      round2(receita_bruta),
          receita_liquida:    round2(receita_liq),
          cmv:                round2(cmv),
          margem_bruta:       round2(margem_bruta),
          margem_pct:         pct(margem_bruta, receita_liq),
          qtd_itens:          n(r.qtd_itens),
          participacao_pct:   pct(receita_bruta, totalReceita),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/drill/produtos
  // Drill-down de subgrupo → produtos individuais. Query em fato_venda.
  // Query params: data_inicio, data_fim, subgrupo_id (obrigatório), location_id?, limit? (default 50)
  // ---------------------------------------------------------------------
  app.get('/drill/produtos', async (req, reply) => {
    const tenantId = req.tenantId!
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let subgrupoId: number
    let limit = 50
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')

      const sid = parseInt((req.query as any).subgrupo_id)
      if (isNaN(sid)) {
        return reply.status(400).send({ error: 'Parâmetro "subgrupo_id" deve ser um número inteiro' })
      }
      subgrupoId = sid

      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 200) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        source_produto_id:  fatoVenda.sourceProdutoId,
        descricao_produto:  sql<string>`MAX(${fatoVenda.descricaoProduto})`,
        segmento:           sql<string | null>`MAX(${fatoVenda.segmento})`,
        receita_bruta:      sum(fatoVenda.vlrTotal).mapWith(Number),
        cmv: sql<number>`COALESCE(SUM(${fatoVenda.custoUnitario} * ${fatoVenda.qtdVenda}), 0)`.mapWith(Number),
        desconto:           sum(fatoVenda.descontoTotal).mapWith(Number),
        qtd_venda:          sum(fatoVenda.qtdVenda).mapWith(Number),
        qtd_itens:          sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(fatoVenda)
      .where(and(
        eq(fatoVenda.tenantId, tenantId),
        eq(fatoVenda.subgrupoId, subgrupoId),
        gte(fatoVenda.dataVenda, dataInicio),
        lte(fatoVenda.dataVenda, dataFim),
        locationIds ? inArray(fatoVenda.locationId, locationIds) : undefined,
      ))
      .groupBy(fatoVenda.sourceProdutoId)
      .orderBy(desc(sum(fatoVenda.vlrTotal)))
      .limit(limit)

    const totalReceita = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)

    return reply.send({
      subgrupo_id: subgrupoId,
      produtos: rows.map(r => {
        const receita_bruta = n(r.receita_bruta)
        const cmv           = n(r.cmv)
        const desconto      = n(r.desconto)
        const receita_liq   = receita_bruta - desconto
        const margem_bruta  = receita_liq - cmv
        return {
          source_produto_id:  r.source_produto_id,
          descricao_produto:  r.descricao_produto,
          segmento:           r.segmento,
          receita_bruta:      round2(receita_bruta),
          receita_liquida:    round2(receita_liq),
          cmv:                round2(cmv),
          margem_bruta:       round2(margem_bruta),
          margem_pct:         pct(margem_bruta, receita_liq),
          qtd_venda:          round2(n(r.qtd_venda)),
          qtd_itens:          n(r.qtd_itens),
          participacao_pct:   pct(receita_bruta, totalReceita),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/padrao-semanal
  // Heatmap 7 dias × 4 semanas — receita bruta agregada por dia-da-semana
  // e semana do período. Usa mv_vendas_diario (campo dia_semana já existe).
  // Query params: data_inicio, data_fim, location_id?
  // Resposta: { semanas: string[], data: number[][] }
  //   data[dayIndex][weekIndex]  dayIndex 0=Dom..6=Sáb
  // ---------------------------------------------------------------------
  app.get('/padrao-semanal', async (req, reply) => {
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
        dia_semana:   mv.diaSemana,
        semana_ano:   mv.semanaAno,
        receita_bruta: sum(mv.receitaBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.dataVenda, dataInicio),
        lte(mv.dataVenda, dataFim),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.diaSemana, mv.semanaAno)
      .orderBy(mv.semanaAno, mv.diaSemana)

    // Ordenar as semanas distintas presentes no período (máx 4)
    const semanasSet = [...new Set(rows.map(r => r.semana_ano))].sort((a, b) => a - b)
    const semanas = semanasSet.slice(0, 4)
    const semanaIndex = new Map(semanas.map((s, i) => [s, i]))

    // Montar matrix 7 × 4 (zeros)
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(4).fill(0))
    for (const r of rows) {
      const wIdx = semanaIndex.get(r.semana_ano)
      if (wIdx === undefined) continue
      const dIdx = r.dia_semana   // 0=Dom..6=Sáb (conforme canonical model)
      if (dIdx < 0 || dIdx > 6) continue
      matrix[dIdx]![wIdx] = round2(n(r.receita_bruta))
    }

    return reply.send({
      semanas: semanas.map(s => `S${semanas.indexOf(s) + 1}`),
      data: matrix,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/produto/:source_produto_id/evolucao
  // Série temporal de um produto individual.
  // Query params: data_inicio, data_fim, granularidade (dia|semana|mes), location_id?
  // Retorno: { produto: { source_produto_id, descricao, subgrupo, grupo }, serie: [...] }
  // ---------------------------------------------------------------------
  app.get('/produto/:source_produto_id/evolucao', async (req, reply) => {
    const tenantId = req.tenantId!
    const sourceProdutoId = (req.params as any).source_produto_id as string
    let dataInicio: string, dataFim: string, locationIds: string[] | undefined
    let granularidade: 'dia' | 'semana' | 'mes' = 'dia'
    try {
      ({ dataInicio, dataFim } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const gran = (req.query as any).granularidade
      if (gran === 'semana' || gran === 'mes') granularidade = gran
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Agrupa por período conforme granularidade
    const periodoExpr = granularidade === 'dia'
      ? sql<string>`TO_CHAR(${fatoVenda.dataVenda}, 'YYYY-MM-DD')`
      : granularidade === 'semana'
        ? sql<string>`TO_CHAR(DATE_TRUNC('week', ${fatoVenda.dataVenda}), 'YYYY-MM-DD')`
        : sql<string>`TO_CHAR(DATE_TRUNC('month', ${fatoVenda.dataVenda}), 'YYYY-MM')`

    const rows = await db
      .select({
        periodo:       periodoExpr,
        descricao:     sql<string>`MAX(${fatoVenda.descricaoProduto})`,
        subgrupo:      sql<string | null>`MAX(${fatoVenda.subgrupoDescricao})`,
        grupo:         sql<string | null>`MAX(${fatoVenda.grupoDescricao})`,
        receita_bruta: sum(fatoVenda.vlrTotal).mapWith(Number),
        cmv:           sql<number>`COALESCE(SUM(${fatoVenda.custoUnitario} * ${fatoVenda.qtdVenda}), 0)`.mapWith(Number),
        desconto:      sum(fatoVenda.descontoTotal).mapWith(Number),
        qtd_venda:     sum(fatoVenda.qtdVenda).mapWith(Number),
      })
      .from(fatoVenda)
      .where(and(
        eq(fatoVenda.tenantId, tenantId),
        eq(fatoVenda.sourceProdutoId, sourceProdutoId),
        gte(fatoVenda.dataVenda, dataInicio),
        lte(fatoVenda.dataVenda, dataFim),
        locationIds ? inArray(fatoVenda.locationId, locationIds) : undefined,
      ))
      .groupBy(periodoExpr)
      .orderBy(periodoExpr)

    if (rows.length === 0) {
      return reply.send({
        produto: { source_produto_id: sourceProdutoId, descricao: null, subgrupo: null, grupo: null },
        granularidade,
        serie: [],
      })
    }

    const first = rows[0]!
    const produto = {
      source_produto_id: sourceProdutoId,
      descricao: first.descricao,
      subgrupo:  first.subgrupo ?? null,
      grupo:     first.grupo    ?? null,
    }

    const serie = rows.map(r => {
      const receita_bruta = n(r.receita_bruta)
      const cmv           = n(r.cmv)
      const desconto      = n(r.desconto)
      const receita_liq   = receita_bruta - desconto
      const margem_bruta  = receita_liq - cmv
      const qtd_venda     = n(r.qtd_venda)
      return {
        periodo:       r.periodo,
        receita_bruta: round2(receita_bruta),
        margem_bruta:  round2(margem_bruta),
        margem_pct:    pct(margem_bruta, receita_liq),
        qtd_venda:     round2(qtd_venda),
        ticket_medio:  qtd_venda > 0 ? round2(receita_bruta / qtd_venda) : 0,
      }
    })

    return reply.send({ produto, granularidade, serie })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/vendas/produto/:source_produto_id/por-location
  // Top locations onde o produto mais vende no período.
  // Query params: data_inicio, data_fim, location_id?
  // Retorno: { produto: { source_produto_id, descricao }, locations: [...] }
  // ---------------------------------------------------------------------
  app.get('/produto/:source_produto_id/por-location', async (req, reply) => {
    const tenantId = req.tenantId!
    const sourceProdutoId = (req.params as any).source_produto_id as string
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
        location_id:   fatoVenda.locationId,
        location_nome: locations.nome,
        descricao:     sql<string>`MAX(${fatoVenda.descricaoProduto})`,
        receita_bruta: sum(fatoVenda.vlrTotal).mapWith(Number),
        cmv:           sql<number>`COALESCE(SUM(${fatoVenda.custoUnitario} * ${fatoVenda.qtdVenda}), 0)`.mapWith(Number),
        desconto:      sum(fatoVenda.descontoTotal).mapWith(Number),
        qtd_venda:     sum(fatoVenda.qtdVenda).mapWith(Number),
      })
      .from(fatoVenda)
      .innerJoin(locations, and(
        eq(locations.id, fatoVenda.locationId),
        eq(locations.tenantId, tenantId),
      ))
      .where(and(
        eq(fatoVenda.tenantId, tenantId),
        eq(fatoVenda.sourceProdutoId, sourceProdutoId),
        gte(fatoVenda.dataVenda, dataInicio),
        lte(fatoVenda.dataVenda, dataFim),
        locationIds ? inArray(fatoVenda.locationId, locationIds) : undefined,
      ))
      .groupBy(fatoVenda.locationId, locations.nome)
      .orderBy(desc(sum(fatoVenda.vlrTotal)))

    const totalReceita = rows.reduce((acc, r) => acc + n(r.receita_bruta), 0)
    const descricao = rows[0]?.descricao ?? null

    return reply.send({
      produto: { source_produto_id: sourceProdutoId, descricao },
      locations: rows.map(r => {
        const receita_bruta = n(r.receita_bruta)
        const cmv           = n(r.cmv)
        const desconto      = n(r.desconto)
        const receita_liq   = receita_bruta - desconto
        const margem_bruta  = receita_liq - cmv
        const qtd_venda     = n(r.qtd_venda)
        return {
          location_id:      r.location_id,
          location_nome:    r.location_nome,
          receita_bruta:    round2(receita_bruta),
          margem_bruta:     round2(margem_bruta),
          margem_pct:       pct(margem_bruta, receita_liq),
          qtd_venda:        round2(qtd_venda),
          participacao_pct: pct(receita_bruta, totalReceita),
        }
      }),
    })
  })
}

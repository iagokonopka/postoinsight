import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvSalesDaily as mv, factSale, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import { markDashboardFirstView } from '../lib/activation-event.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const SEGMENTS = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const
const GRANULARITIES = ['day', 'week', 'month'] as const

/**
 * Endpoints do Dashboard de Vendas — `analytics.mv_sales_daily`.
 * Specs: docs/specs/dashboard-vendas.md
 *
 * Toda query filtra por tenant_id derivado da sessão. Nunca aceita
 * tenant_id como parâmetro externo.
 */
export const salesRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/summary
  // ---------------------------------------------------------------------
  app.get('/summary', async (req, reply) => {
    const tenantId = req.tenantId!
    // Evento de ativação: primeira carga do painel por um usuário real do tenant.
    await markDashboardFirstView(tenantId, req.userId!, !!req.platformRole)
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segment:       mv.segment,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        discounts:     sum(mv.discounts).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
        total_quantity: sum(mv.totalQuantity).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segment)

    const totals = {
      gross_revenue: 0,
      discounts:     0,
      net_revenue:   0,
      cogs:          0,
      gross_margin:  0,
      item_count:    0,
    }
    for (const r of rows) {
      totals.gross_revenue += n(r.gross_revenue)
      totals.discounts     += n(r.discounts)
      totals.net_revenue   += n(r.net_revenue)
      totals.cogs          += n(r.cogs)
      totals.gross_margin  += n(r.gross_margin)
      totals.item_count    += n(r.item_count)
    }

    // Garante presença dos 4 segmentos (mesmo zerados)
    const by_segment = SEGMENTS.map(seg => {
      const r = rows.find(x => x.segment === seg)
      const gross_revenue = n(r?.gross_revenue)
      const net_revenue   = n(r?.net_revenue)
      const cogs          = n(r?.cogs)
      const gross_margin  = n(r?.gross_margin)
      return {
        segment: seg,
        gross_revenue: round2(gross_revenue),
        net_revenue:   round2(net_revenue),
        cogs:          round2(cogs),
        gross_margin:  round2(gross_margin),
        margin_pct:    pct(gross_margin, net_revenue),
        share_pct:     pct(gross_revenue, totals.gross_revenue),
      }
    })

    return reply.send({
      period: { start: startDate, end: endDate },
      locations: locationIds ?? 'all',
      totals: {
        gross_revenue: round2(totals.gross_revenue),
        discounts:     round2(totals.discounts),
        net_revenue:   round2(totals.net_revenue),
        cogs:          round2(totals.cogs),
        gross_margin:  round2(totals.gross_margin),
        margin_pct:    pct(totals.gross_margin, totals.net_revenue),
        item_count:    totals.item_count,
      },
      by_segment,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/evolution
  // ---------------------------------------------------------------------
  app.get('/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    let locationIds: string[] | undefined
    let segment: typeof SEGMENTS[number] | undefined
    let granularity: typeof GRANULARITIES[number]
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segment = parseEnum((req.query as any).segment, SEGMENTS, 'segment')
      granularity = parseEnum((req.query as any).granularity, GRANULARITIES, 'granularity', 'day')!
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Coluna de período conforme granularidade.
    const periodExpr =
      granularity === 'day'
        ? sql<string>`to_char(${mv.saleDate}, 'YYYY-MM-DD')`
        : granularity === 'month'
          ? sql<string>`${mv.yearMonth}`
          : sql<string>`${mv.yearMonth} || '-W' || lpad(${mv.weekOfYear}::text, 2, '0')`

    const rows = await db
      .select({
        period:        periodExpr.as('period'),
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        segment ? eq(mv.segment, segment) : undefined,
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    return reply.send({
      granularity,
      series: rows.map(r => {
        const gross_margin = n(r.gross_margin)
        const net_revenue  = n(r.net_revenue)
        return {
          period:        r.period,
          gross_revenue: round2(n(r.gross_revenue)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/segments
  // Igual ao /summary mas com item_count e total_quantity no by_segment.
  // ---------------------------------------------------------------------
  app.get('/segments', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segment:        mv.segment,
        gross_revenue:  sum(mv.grossRevenue).mapWith(Number),
        net_revenue:    sum(mv.netRevenue).mapWith(Number),
        cogs:           sum(mv.cogs).mapWith(Number),
        gross_margin:   sum(mv.grossMargin).mapWith(Number),
        item_count:     sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
        total_quantity: sum(mv.totalQuantity).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segment)

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    const by_segment = SEGMENTS.map(seg => {
      const r = rows.find(x => x.segment === seg)
      const gross_revenue = n(r?.gross_revenue)
      const net_revenue   = n(r?.net_revenue)
      const gross_margin  = n(r?.gross_margin)
      return {
        segment: seg,
        gross_revenue: round2(gross_revenue),
        net_revenue:   round2(net_revenue),
        cogs:          round2(n(r?.cogs)),
        gross_margin:  round2(gross_margin),
        margin_pct:    pct(gross_margin, net_revenue),
        share_pct:     pct(gross_revenue, totalRevenue),
        item_count:    n(r?.item_count),
        total_quantity: round2(n(r?.total_quantity)),
      }
    })

    return reply.send({
      period: { start: startDate, end: endDate },
      by_segment,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/groups
  // ---------------------------------------------------------------------
  app.get('/groups', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let segment: typeof SEGMENTS[number] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segment = parseEnum((req.query as any).segment, SEGMENTS, 'segment')
      if (!segment) {
        return reply.status(400).send({ error: 'Parâmetro "segment" é obrigatório' })
      }
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        group_id:      mv.groupId,
        group_name:    sql<string | null>`MAX(${mv.groupName})`,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, segment),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    const groups = rows
      .map(r => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        return {
          group_id:      r.group_id,
          group_name:    r.group_name,
          gross_revenue: round2(gross_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          share_pct:     pct(gross_revenue, totalRevenue),
        }
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)

    return reply.send({ segment, groups })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/top-products
  // Top N grupos por receita bruta — todos os segmentos.
  // Chamado pelo DashboardPage. Usa mv_sales_daily.
  // Query params: start_date, end_date, location_id?, limit? (default 10, max 50)
  // ---------------------------------------------------------------------
  app.get('/top-products', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let limit = 10
    let segment: typeof SEGMENTS[number] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segment = parseEnum((req.query as any).segment, SEGMENTS, 'segment')
      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 50) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segment:       mv.segment,
        group_id:      mv.groupId,
        group_name:    sql<string | null>`MAX(${mv.groupName})`,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        total_quantity: sum(mv.totalQuantity).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        segment ? eq(mv.segment, segment) : undefined,
      ))
      .groupBy(mv.segment, mv.groupId)
      .orderBy(desc(sum(mv.grossRevenue)))
      .limit(limit)

    const total = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    return reply.send({
      products: rows.map((r, i) => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        // Campos nomeados para bater com a interface TopProduct do DashboardPage:
        // product → nome do grupo, category → segmento
        return {
          rank:          i + 1,
          product:       r.group_name ?? String(r.group_id),
          category:      r.segment ?? '',
          group_id:      r.group_id,
          revenue:       round2(gross_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          share_pct:     pct(gross_revenue, total),
          quantity:      round2(n(r.total_quantity)),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/drill/subgroups
  // Drill-down de grupo → subgrupos. Query em fact_sale.
  // Query params: start_date, end_date, segment (obrigatório), group_id (obrigatório), location_id?
  // ---------------------------------------------------------------------
  app.get('/drill/subgroups', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let segment: string, groupId: number
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')

      const seg = (req.query as any).segment
      if (typeof seg !== 'string' || !seg.trim()) {
        return reply.status(400).send({ error: 'Parâmetro "segment" é obrigatório' })
      }
      segment = seg.trim()

      const gid = parseInt((req.query as any).group_id)
      if (isNaN(gid)) {
        return reply.status(400).send({ error: 'Parâmetro "group_id" deve ser um número inteiro' })
      }
      groupId = gid
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        subgroup_id:   factSale.subgroupId,
        subgroup_name: sql<string | null>`MAX(${factSale.subgroupName})`,
        gross_revenue: sum(factSale.totalValue).mapWith(Number),
        cogs: sql<number>`COALESCE(SUM(${factSale.unitCost} * ${factSale.quantity}), 0)`.mapWith(Number),
        discount:      sum(factSale.discountTotal).mapWith(Number),
        item_count:    sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(factSale)
      .where(and(
        eq(factSale.tenantId, tenantId),
        eq(factSale.segment, segment),
        eq(factSale.groupId, groupId),
        gte(factSale.saleDate, startDate),
        lte(factSale.saleDate, endDate),
        locationIds ? inArray(factSale.locationId, locationIds) : undefined,
      ))
      .groupBy(factSale.subgroupId)
      .orderBy(desc(sum(factSale.totalValue)))

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    return reply.send({
      segment,
      group_id: groupId,
      subgroups: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const discount      = n(r.discount)
        const net_revenue   = gross_revenue - discount
        const gross_margin  = net_revenue - cogs
        return {
          subgroup_id:   r.subgroup_id,
          subgroup_name: r.subgroup_name ?? `Subgrupo ${r.subgroup_id}`,
          gross_revenue: round2(gross_revenue),
          net_revenue:   round2(net_revenue),
          cogs:          round2(cogs),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          item_count:    n(r.item_count),
          share_pct:     pct(gross_revenue, totalRevenue),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/drill/products
  // Drill-down de subgrupo → produtos individuais. Query em fact_sale.
  // Query params: start_date, end_date, subgroup_id (obrigatório), location_id?, limit? (default 50)
  // ---------------------------------------------------------------------
  app.get('/drill/products', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let subgroupId: number
    let limit = 50
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')

      const sid = parseInt((req.query as any).subgroup_id)
      if (isNaN(sid)) {
        return reply.status(400).send({ error: 'Parâmetro "subgroup_id" deve ser um número inteiro' })
      }
      subgroupId = sid

      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 200) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        source_product_id: factSale.sourceProductId,
        product_name:      sql<string>`MAX(${factSale.productName})`,
        segment:           sql<string | null>`MAX(${factSale.segment})`,
        gross_revenue:     sum(factSale.totalValue).mapWith(Number),
        cogs: sql<number>`COALESCE(SUM(${factSale.unitCost} * ${factSale.quantity}), 0)`.mapWith(Number),
        discount:          sum(factSale.discountTotal).mapWith(Number),
        quantity:          sum(factSale.quantity).mapWith(Number),
        item_count:        sql<number>`COUNT(*)`.mapWith(Number),
      })
      .from(factSale)
      .where(and(
        eq(factSale.tenantId, tenantId),
        eq(factSale.subgroupId, subgroupId),
        gte(factSale.saleDate, startDate),
        lte(factSale.saleDate, endDate),
        locationIds ? inArray(factSale.locationId, locationIds) : undefined,
      ))
      .groupBy(factSale.sourceProductId)
      .orderBy(desc(sum(factSale.totalValue)))
      .limit(limit)

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    return reply.send({
      subgroup_id: subgroupId,
      products: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const discount      = n(r.discount)
        const net_revenue   = gross_revenue - discount
        const gross_margin  = net_revenue - cogs
        return {
          source_product_id: r.source_product_id,
          product_name:      r.product_name,
          segment:           r.segment,
          gross_revenue:     round2(gross_revenue),
          net_revenue:       round2(net_revenue),
          cogs:              round2(cogs),
          gross_margin:      round2(gross_margin),
          margin_pct:        pct(gross_margin, net_revenue),
          quantity:          round2(n(r.quantity)),
          item_count:        n(r.item_count),
          share_pct:         pct(gross_revenue, totalRevenue),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/weekly-pattern
  // Heatmap 7 dias × 4 semanas — receita bruta agregada por dia-da-semana
  // e semana do período. Usa mv_sales_daily (campo day_of_week já existe).
  // Query params: start_date, end_date, location_id?
  // Resposta: { weeks: string[], data: number[][] }
  //   data[dayIndex][weekIndex]  dayIndex 0=Dom..6=Sáb
  // ---------------------------------------------------------------------
  app.get('/weekly-pattern', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        day_of_week:   mv.dayOfWeek,
        week_of_year:  mv.weekOfYear,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.dayOfWeek, mv.weekOfYear)
      .orderBy(mv.weekOfYear, mv.dayOfWeek)

    // Ordenar as semanas distintas presentes no período (máx 4)
    const weeksSet = [...new Set(rows.map(r => r.week_of_year))].sort((a, b) => a - b)
    const weeks = weeksSet.slice(0, 4)
    const weekIndex = new Map(weeks.map((s, i) => [s, i]))

    // Montar matrix 7 × 4 (zeros)
    const matrix: number[][] = Array.from({ length: 7 }, () => Array(4).fill(0))
    for (const r of rows) {
      const wIdx = weekIndex.get(r.week_of_year)
      if (wIdx === undefined) continue
      const dIdx = r.day_of_week   // 0=Dom..6=Sáb (conforme canonical model)
      if (dIdx < 0 || dIdx > 6) continue
      matrix[dIdx]![wIdx] = round2(n(r.gross_revenue))
    }

    return reply.send({
      weeks: weeks.map(s => `S${weeks.indexOf(s) + 1}`),
      data: matrix,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/product/:source_product_id/evolution
  // Série temporal de um produto individual.
  // Query params: start_date, end_date, granularity (day|week|month), location_id?
  // Retorno: { product: { source_product_id, name, subgroup, group }, series: [...] }
  // ---------------------------------------------------------------------
  app.get('/product/:source_product_id/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    const sourceProductId = (req.params as any).source_product_id as string
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let granularity: 'day' | 'week' | 'month' = 'day'
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const gran = (req.query as any).granularity
      if (gran === 'week' || gran === 'month') granularity = gran
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Agrupa por período conforme granularidade
    const periodExpr = granularity === 'day'
      ? sql<string>`TO_CHAR(${factSale.saleDate}, 'YYYY-MM-DD')`
      : granularity === 'week'
        ? sql<string>`TO_CHAR(DATE_TRUNC('week', ${factSale.saleDate}), 'YYYY-MM-DD')`
        : sql<string>`TO_CHAR(DATE_TRUNC('month', ${factSale.saleDate}), 'YYYY-MM')`

    const rows = await db
      .select({
        period:        periodExpr,
        name:          sql<string>`MAX(${factSale.productName})`,
        subgroup:      sql<string | null>`MAX(${factSale.subgroupName})`,
        group:         sql<string | null>`MAX(${factSale.groupName})`,
        gross_revenue: sum(factSale.totalValue).mapWith(Number),
        cogs:          sql<number>`COALESCE(SUM(${factSale.unitCost} * ${factSale.quantity}), 0)`.mapWith(Number),
        discount:      sum(factSale.discountTotal).mapWith(Number),
        quantity:      sum(factSale.quantity).mapWith(Number),
      })
      .from(factSale)
      .where(and(
        eq(factSale.tenantId, tenantId),
        eq(factSale.sourceProductId, sourceProductId),
        gte(factSale.saleDate, startDate),
        lte(factSale.saleDate, endDate),
        locationIds ? inArray(factSale.locationId, locationIds) : undefined,
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    if (rows.length === 0) {
      return reply.send({
        product: { source_product_id: sourceProductId, name: null, subgroup: null, group: null },
        granularity,
        series: [],
      })
    }

    const first = rows[0]!
    const product = {
      source_product_id: sourceProductId,
      name:     first.name,
      subgroup: first.subgroup ?? null,
      group:    first.group    ?? null,
    }

    const series = rows.map(r => {
      const gross_revenue = n(r.gross_revenue)
      const cogs          = n(r.cogs)
      const discount      = n(r.discount)
      const net_revenue   = gross_revenue - discount
      const gross_margin  = net_revenue - cogs
      const quantity      = n(r.quantity)
      return {
        period:        r.period,
        gross_revenue: round2(gross_revenue),
        gross_margin:  round2(gross_margin),
        margin_pct:    pct(gross_margin, net_revenue),
        quantity:      round2(quantity),
        avg_ticket:    quantity > 0 ? round2(gross_revenue / quantity) : 0,
      }
    })

    return reply.send({ product, granularity, series })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/product/:source_product_id/by-location
  // Top locations onde o produto mais vende no período.
  // Query params: start_date, end_date, location_id?
  // Retorno: { product: { source_product_id, name }, locations: [...] }
  // ---------------------------------------------------------------------
  app.get('/product/:source_product_id/by-location', async (req, reply) => {
    const tenantId = req.tenantId!
    const sourceProductId = (req.params as any).source_product_id as string
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        location_id:   factSale.locationId,
        location_name: locations.name,
        name:          sql<string>`MAX(${factSale.productName})`,
        gross_revenue: sum(factSale.totalValue).mapWith(Number),
        cogs:          sql<number>`COALESCE(SUM(${factSale.unitCost} * ${factSale.quantity}), 0)`.mapWith(Number),
        discount:      sum(factSale.discountTotal).mapWith(Number),
        quantity:      sum(factSale.quantity).mapWith(Number),
      })
      .from(factSale)
      .innerJoin(locations, and(
        eq(locations.id, factSale.locationId),
        eq(locations.tenantId, tenantId),
      ))
      .where(and(
        eq(factSale.tenantId, tenantId),
        eq(factSale.sourceProductId, sourceProductId),
        gte(factSale.saleDate, startDate),
        lte(factSale.saleDate, endDate),
        locationIds ? inArray(factSale.locationId, locationIds) : undefined,
      ))
      .groupBy(factSale.locationId, locations.name)
      .orderBy(desc(sum(factSale.totalValue)))

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)
    const name = rows[0]?.name ?? null

    return reply.send({
      product: { source_product_id: sourceProductId, name },
      locations: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const discount      = n(r.discount)
        const net_revenue   = gross_revenue - discount
        const gross_margin  = net_revenue - cogs
        const quantity      = n(r.quantity)
        return {
          location_id:   r.location_id,
          location_name: r.location_name,
          gross_revenue: round2(gross_revenue),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          quantity:      round2(quantity),
          share_pct:     pct(gross_revenue, totalRevenue),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/sales/by-location
  // Receita, margem e participação por unidade no período selecionado.
  // Query params: start_date, end_date
  // Retorno: { locations: [...] }
  // ---------------------------------------------------------------------
  app.get('/by-location', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        location_id:   mv.locationId,
        location_name: locations.name,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        quantity:      sum(mv.totalQuantity).mapWith(Number),
      })
      .from(mv)
      .innerJoin(locations, and(
        eq(locations.id, mv.locationId),
        eq(locations.tenantId, tenantId),
      ))
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
      ))
      .groupBy(mv.locationId, locations.name)
      .orderBy(desc(sum(mv.grossRevenue)))

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    return reply.send({
      locations: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const discount      = gross_revenue - n(r.net_revenue)
        const net_revenue   = gross_revenue - discount
        const gross_margin  = net_revenue - cogs
        return {
          location_id:   r.location_id,
          location_name: r.location_name,
          gross_revenue: round2(gross_revenue),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          quantity:      round2(n(r.quantity)),
          share_pct:     pct(gross_revenue, totalRevenue),
        }
      }),
    })
  })
}

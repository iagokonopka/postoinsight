import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvConvenienceDaily as mv, factSale, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const STORE_SEGMENTS = ['conveniencia', 'lubrificantes', 'servicos'] as const
const GRANULARITIES = ['day', 'week', 'month'] as const

/**
 * Endpoints do Dashboard de Conveniência (loja) — `analytics.mv_convenience_daily`.
 * Specs: docs/specs/dashboard-conveniencia.md
 *
 * Cobre os 3 segmentos não-combustível: conveniencia, lubrificantes, servicos.
 */
export const convenienceRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/summary
  // ---------------------------------------------------------------------
  app.get('/summary', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    // Filtra apenas conveniência — lubrificantes e serviços têm páginas próprias
    const rows = await db
      .select({
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        discounts:     sum(mv.discounts).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, 'conveniencia'),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))

    const r = rows[0]
    const gross_revenue = n(r?.gross_revenue)
    const discounts     = n(r?.discounts)
    const net_revenue   = n(r?.net_revenue)
    const cogs          = n(r?.cogs)
    const gross_margin  = n(r?.gross_margin)
    const item_count    = n(r?.item_count)

    // Ticket médio: conta NFs distintas em fact_sale para o segmento conveniencia
    const invoiceRows = await db
      .select({ invoice_count: sql<number>`COUNT(DISTINCT ${factSale.invoiceNumber})`.mapWith(Number) })
      .from(factSale)
      .where(and(
        eq(factSale.tenantId, tenantId),
        eq(factSale.segment, 'conveniencia'),
        gte(factSale.saleDate, startDate),
        lte(factSale.saleDate, endDate),
        locationIds ? inArray(factSale.locationId, locationIds) : undefined,
      ))
    const invoice_count = n(invoiceRows[0]?.invoice_count)
    const avg_ticket = invoice_count > 0 ? round2(gross_revenue / invoice_count) : null

    return reply.send({
      period: { start: startDate, end: endDate },
      locations: locationIds ?? 'all',
      totals: {
        gross_revenue: round2(gross_revenue),
        discounts:     round2(discounts),
        net_revenue:   round2(net_revenue),
        cogs:          round2(cogs),
        gross_margin:  round2(gross_margin),
        margin_pct:    pct(gross_margin, net_revenue),
        item_count,
        invoice_count,
        avg_ticket,
      },
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/evolution
  // ---------------------------------------------------------------------
  app.get('/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    let locationIds: string[] | undefined
    let segment: typeof STORE_SEGMENTS[number] | undefined
    let granularity: typeof GRANULARITIES[number]
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      segment = parseEnum((req.query as any).segment, STORE_SEGMENTS, 'segment')
      granularity = parseEnum((req.query as any).granularity, GRANULARITIES, 'granularity', 'day')!
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

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
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        // default para 'conveniencia' — lubrificantes/serviços têm rotas próprias
        eq(mv.segment, segment ?? 'conveniencia'),
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    return reply.send({
      granularity,
      series: rows.map(r => ({
        period:        r.period,
        gross_revenue: round2(n(r.gross_revenue)),
        gross_margin:  round2(n(r.gross_margin)),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/categories
  // ---------------------------------------------------------------------
  app.get('/categories', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let segment: typeof STORE_SEGMENTS[number] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      // segment é opcional — default 'conveniencia'. Permite uso como scatter-data sem filtro obrigatório.
      segment = parseEnum((req.query as any).segment, STORE_SEGMENTS, 'segment') ?? 'conveniencia'
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        category_code: mv.categoryCode,
        category_name: sql<string | null>`MAX(${mv.categoryName})`,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        total_quantity: sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, segment),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.categoryCode)

    const total = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    const categories = rows
      .filter(r => n(r.gross_revenue) !== 0)
      .map(r => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        return {
          category_code: r.category_code,
          category_name: r.category_name,
          gross_revenue: round2(gross_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          share_pct:     pct(gross_revenue, total),
          total_quantity: n(r.total_quantity),
        }
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)

    return reply.send({ segment, categories })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/groups
  // ---------------------------------------------------------------------
  app.get('/groups', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let categoryCode: string
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const cat = (req.query as any).category_code
      if (typeof cat !== 'string' || !cat.trim()) {
        return reply.status(400).send({ error: 'Parâmetro "category_code" é obrigatório' })
      }
      categoryCode = cat.trim()
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
        eq(mv.categoryCode, categoryCode),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)

    const total = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

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
          share_pct:     pct(gross_revenue, total),
        }
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)

    return reply.send({ category_code: categoryCode, groups })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/top-groups
  // Top 10 grupos da conveniência por receita (excluindo lubrificantes/serviços)
  // ---------------------------------------------------------------------
  app.get('/top-groups', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    let limit = 10
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      const lim = parseInt((req.query as any).limit)
      if (!isNaN(lim) && lim > 0 && lim <= 50) limit = lim
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        group_id:      mv.groupId,
        group_name:    sql<string | null>`MAX(${mv.groupName})`,
        segment:       sql<string>`MAX(${mv.segment})`,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, 'conveniencia'),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)
      .orderBy(desc(sum(mv.grossRevenue)))
      .limit(limit)

    const total = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)
    const groupIds = rows.map(r => r.group_id).filter((id): id is number => id !== null)

    // Busca categorias de cada grupo para o Accordion aninhado
    const catRows = groupIds.length > 0
      ? await db
          .select({
            group_id:      mv.groupId,
            category_code: mv.categoryCode,
            category_name: sql<string | null>`MAX(${mv.categoryName})`,
            gross_revenue: sum(mv.grossRevenue).mapWith(Number),
            net_revenue:   sum(mv.netRevenue).mapWith(Number),
            cogs:          sum(mv.cogs).mapWith(Number),
            gross_margin:  sum(mv.grossMargin).mapWith(Number),
            item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
          })
          .from(mv)
          .where(and(
            eq(mv.tenantId, tenantId),
            eq(mv.segment, 'conveniencia'),
            inArray(mv.groupId, groupIds),
            gte(mv.saleDate, startDate),
            lte(mv.saleDate, endDate),
            locationIds ? inArray(mv.locationId, locationIds) : undefined,
          ))
          .groupBy(mv.groupId, mv.categoryCode)
          .orderBy(mv.groupId, desc(sum(mv.grossRevenue)))
      : []

    // Indexa categorias por group_id
    const catByGroup = new Map<number, object[]>()
    for (const c of catRows) {
      if (c.group_id === null) continue
      if (!catByGroup.has(c.group_id)) catByGroup.set(c.group_id, [])
      const rec = n(c.gross_revenue)
      const liq = n(c.net_revenue)
      const mb  = n(c.gross_margin)
      catByGroup.get(c.group_id)!.push({
        category_code: c.category_code,
        category_name: c.category_name,
        gross_revenue: round2(rec),
        cogs:          round2(n(c.cogs)),
        gross_margin:  round2(mb),
        margin_pct:    pct(mb, liq),
        item_count:    n(c.item_count),
      })
    }

    return reply.send({
      groups: rows.map((r, i) => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        return {
          rank:          i + 1,
          group_id:      r.group_id,
          group_name:    r.group_name ?? r.group_id,
          segment:       r.segment,
          gross_revenue: round2(gross_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          item_count:    n(r.item_count),
          share_pct:     pct(gross_revenue, total),
          categories:    catByGroup.get(r.group_id ?? -1) ?? [],
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/convenience/by-location
  // Receita, margem e participação por unidade no período selecionado.
  // Query params: start_date, end_date, segment? (conveniencia|lubrificantes|servicos)
  // Retorno: { locations: [...] }
  // ---------------------------------------------------------------------
  app.get('/by-location', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, segment: string | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      const seg = (req.query as any).segment
      segment = seg ? parseEnum(seg, STORE_SEGMENTS as unknown as string[], 'segment') : undefined
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
        segment ? eq(mv.segment, segment) : undefined,
      ))
      .groupBy(mv.locationId, locations.name)
      .orderBy(desc(sum(mv.grossRevenue)))

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    return reply.send({
      locations: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = net_revenue - cogs
        return {
          location_id:   r.location_id,
          location_name: r.location_name,
          gross_revenue: round2(gross_revenue),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          share_pct:     pct(gross_revenue, totalRevenue),
        }
      }),
    })
  })
}

import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvConvenienceDaily as mv, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const GRANULARITIES = ['day', 'week', 'month'] as const

// Filtro fixo: apenas lubrificantes
const SEG = 'lubrificantes'

/**
 * Endpoints do Dashboard de Lubrificantes — `analytics.mv_convenience_daily` filtrado por segment = 'lubrificantes'.
 * Espelha a estrutura de convenienceRoutes, mas restrito ao segmento lubrificantes.
 */
export const lubricantsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/lubricants/summary
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

    const rows = await db
      .select({
        group_id:      mv.groupId,
        group_name:    sql<string | null>`MAX(${mv.groupName})`,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, SEG),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)

    const totals = rows.reduce((acc, r) => {
      acc.gross_revenue += n(r.gross_revenue)
      acc.net_revenue   += n(r.net_revenue)
      acc.cogs          += n(r.cogs)
      acc.gross_margin  += n(r.gross_margin)
      acc.item_count    += n(r.item_count)
      return acc
    }, { gross_revenue: 0, net_revenue: 0, cogs: 0, gross_margin: 0, item_count: 0 })

    const by_group = rows
      .map(r => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        return {
          group_id:      r.group_id,
          group_name:    r.group_name,
          gross_revenue: round2(gross_revenue),
          net_revenue:   round2(net_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          item_count:    n(r.item_count),
          share_pct:     pct(gross_revenue, totals.gross_revenue),
        }
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)

    return reply.send({
      period: { start: startDate, end: endDate },
      locations: locationIds ?? 'all',
      totals: {
        gross_revenue: round2(totals.gross_revenue),
        net_revenue:   round2(totals.net_revenue),
        cogs:          round2(totals.cogs),
        gross_margin:  round2(totals.gross_margin),
        margin_pct:    pct(totals.gross_margin, totals.net_revenue),
        item_count:    totals.item_count,
      },
      by_group,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/lubricants/evolution
  // ---------------------------------------------------------------------
  app.get('/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    let locationIds: string[] | undefined
    let granularity: typeof GRANULARITIES[number]
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
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
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, SEG),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    return reply.send({
      granularity,
      series: rows.map(r => ({
        period:        r.period,
        gross_revenue: round2(n(r.gross_revenue)),
        gross_margin:  round2(n(r.gross_margin)),
        item_count:    n(r.item_count),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/lubricants/groups
  // Retorna grupos (ex: Óleos de Motor, Graxas) com KPIs agregados.
  // ---------------------------------------------------------------------
  app.get('/groups', async (req, reply) => {
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
        group_id:      mv.groupId,
        group_name:    sql<string | null>`MAX(${mv.groupName})`,
        category_code: mv.categoryCode,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
        item_count:    sql<number>`COALESCE(SUM(${mv.itemCount}), 0)`.mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, SEG),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId, mv.categoryCode)

    const total = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)

    const groups = rows
      .map(r => {
        const gross_revenue = n(r.gross_revenue)
        const net_revenue   = n(r.net_revenue)
        const gross_margin  = n(r.gross_margin)
        return {
          group_id:      r.group_id,
          group_name:    r.group_name,
          category_code: r.category_code,
          gross_revenue: round2(gross_revenue),
          net_revenue:   round2(net_revenue),
          cogs:          round2(n(r.cogs)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
          item_count:    n(r.item_count),
          share_pct:     pct(gross_revenue, total),
        }
      })
      .sort((a, b) => b.gross_revenue - a.gross_revenue)

    return reply.send({ groups })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/lubricants/by-location
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
      })
      .from(mv)
      .innerJoin(locations, and(
        eq(locations.id, mv.locationId),
        eq(locations.tenantId, tenantId),
      ))
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.segment, SEG),
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

import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvFuelDaily as mv, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseIntArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'

const GRANULARITIES = ['day', 'week', 'month'] as const

// Filtro fixo: apenas Arla 32 (category_code = 'ARL')
const ARL = 'ARL'

/**
 * Endpoints do Dashboard de Arla — `analytics.mv_fuel_daily` filtrado por category_code = 'ARL'.
 * Espelha a estrutura de fuelRoutes, mas restrito ao segmento Arla 32.
 */
export const arlaRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/arla/summary
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
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.categoryCode, ARL),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)

    const totals = rows.reduce((acc, r) => {
      acc.volume_liters += n(r.volume_liters)
      acc.gross_revenue += n(r.gross_revenue)
      acc.net_revenue   += n(r.net_revenue)
      acc.cogs          += n(r.cogs)
      acc.gross_margin  += n(r.gross_margin)
      return acc
    }, { volume_liters: 0, gross_revenue: 0, net_revenue: 0, cogs: 0, gross_margin: 0 })

    const by_product = rows
      .map(r => {
        const volume_liters = n(r.volume_liters)
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const gross_margin  = n(r.gross_margin)
        const net_revenue   = n(r.net_revenue)
        return {
          group_id:        r.group_id,
          group_name:      r.group_name,
          volume_liters:   round2(volume_liters),
          gross_revenue:   round2(gross_revenue),
          net_revenue:     round2(net_revenue),
          cogs:            round2(cogs),
          gross_margin:    round2(gross_margin),
          margin_pct:      pct(gross_margin, net_revenue),
          avg_price_liter: volume_liters > 0 ? round2(gross_revenue / volume_liters) : null,
          avg_cost_liter:  volume_liters > 0 && cogs > 0 ? round2(cogs / volume_liters) : null,
          volume_share_pct:  pct(volume_liters, totals.volume_liters),
          revenue_share_pct: pct(gross_revenue, totals.gross_revenue),
        }
      })
      .sort((a, b) => b.volume_liters - a.volume_liters)

    return reply.send({
      period: { start: startDate, end: endDate },
      locations: locationIds ?? 'all',
      totals: {
        volume_liters: round2(totals.volume_liters),
        gross_revenue: round2(totals.gross_revenue),
        net_revenue:   round2(totals.net_revenue),
        cogs:          round2(totals.cogs),
        gross_margin:  round2(totals.gross_margin),
        margin_pct:    pct(totals.gross_margin, totals.net_revenue),
      },
      by_product,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/arla/evolution
  // ---------------------------------------------------------------------
  app.get('/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    let locationIds: string[] | undefined
    let groupIds: number[] | undefined
    let granularity: typeof GRANULARITIES[number]
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
      groupIds    = parseIntArray((req.query as any).group_id, 'group_id')
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
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.categoryCode, ARL),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
        groupIds ? inArray(mv.groupId, groupIds) : undefined,
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    return reply.send({
      granularity,
      series: rows.map(r => ({
        period:        r.period,
        volume_liters: round2(n(r.volume_liters)),
        gross_revenue: round2(n(r.gross_revenue)),
        gross_margin:  round2(n(r.gross_margin)),
      })),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/arla/products
  // Retorna os grupos (produtos) de Arla com KPIs agregados.
  // ---------------------------------------------------------------------
  app.get('/products', async (req, reply) => {
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
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.categoryCode, ARL),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.groupId)

    const totalVolume  = rows.reduce((a, r) => a + n(r.volume_liters), 0)
    const totalRevenue = rows.reduce((a, r) => a + n(r.gross_revenue), 0)

    const products = rows
      .map(r => {
        const volume_liters = n(r.volume_liters)
        const gross_revenue = n(r.gross_revenue)
        const cogs          = n(r.cogs)
        const gross_margin  = n(r.gross_margin)
        const net_revenue   = n(r.net_revenue)
        return {
          group_id:        r.group_id,
          group_name:      r.group_name,
          volume_liters:   round2(volume_liters),
          gross_revenue:   round2(gross_revenue),
          net_revenue:     round2(net_revenue),
          cogs:            round2(cogs),
          gross_margin:    round2(gross_margin),
          margin_pct:      pct(gross_margin, net_revenue),
          avg_price_liter: volume_liters > 0 ? round2(gross_revenue / volume_liters) : null,
          avg_cost_liter:  volume_liters > 0 && cogs > 0 ? round2(cogs / volume_liters) : null,
          volume_share_pct:  pct(volume_liters, totalVolume),
          revenue_share_pct: pct(gross_revenue, totalRevenue),
        }
      })
      .sort((a, b) => b.volume_liters - a.volume_liters)

    return reply.send({ products })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/arla/by-location
  // Receita e volume de Arla 32 por unidade no período selecionado.
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
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
      })
      .from(mv)
      .innerJoin(locations, and(
        eq(locations.id, mv.locationId),
        eq(locations.tenantId, tenantId),
      ))
      .where(and(
        eq(mv.tenantId, tenantId),
        eq(mv.categoryCode, ARL),
        gte(mv.saleDate, startDate),
        lte(mv.saleDate, endDate),
      ))
      .groupBy(mv.locationId, locations.name)
      .orderBy(desc(sum(mv.grossRevenue)))

    const totalRevenue = rows.reduce((acc, r) => acc + n(r.gross_revenue), 0)
    const totalVolume  = rows.reduce((acc, r) => acc + n(r.volume_liters), 0)

    return reply.send({
      locations: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const volume_liters = n(r.volume_liters)
        return {
          location_id:      r.location_id,
          location_name:    r.location_name,
          gross_revenue:    round2(gross_revenue),
          volume_liters:    round2(volume_liters),
          share_pct:        pct(gross_revenue, totalRevenue),
          volume_share_pct: pct(volume_liters, totalVolume),
        }
      }),
    })
  })
}

import type { FastifyPluginAsync } from 'fastify'
import { and, eq, gte, lte, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvFuelDaily as mv, factSale, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseDateRange, parseUuidArray, parseIntArray, parseEnum, n, pct, round2,
} from '../lib/queryParsers.js'
import { loadProductClassification, classificationKey } from '../lib/productClassification.js'

const GRANULARITIES = ['day', 'week', 'month'] as const

/**
 * Endpoints do Dashboard de Combustível — `analytics.mv_fuel_daily`.
 * Specs: docs/specs/dashboard-combustivel.md
 */
export const fuelRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/fuel/summary
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
  // GET /api/v1/fuel/evolution
  // ---------------------------------------------------------------------
  app.get('/evolution', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string
    let locationIds: string[] | undefined
    let groupIds: number[] | undefined
    let granularity: typeof GRANULARITIES[number]
    const byProduct = (req.query as any).by_product === 'true'
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

    if (byProduct) {
      // Retorna uma série por grupo (produto combustível) — usado pelo gráfico multi-série da tela /fuel
      const rows = await db
        .select({
          period:        periodExpr.as('period'),
          group_id:      mv.groupId,
          group_name:    sql<string | null>`MAX(${mv.groupName})`,
          volume_liters: sum(mv.volumeLiters).mapWith(Number),
          gross_revenue: sum(mv.grossRevenue).mapWith(Number),
          gross_margin:  sum(mv.grossMargin).mapWith(Number),
        })
        .from(mv)
        .where(and(
          eq(mv.tenantId, tenantId),
          gte(mv.saleDate, startDate),
          lte(mv.saleDate, endDate),
          locationIds ? inArray(mv.locationId, locationIds) : undefined,
          groupIds ? inArray(mv.groupId, groupIds) : undefined,
        ))
        .groupBy(periodExpr, mv.groupId)
        .orderBy(periodExpr, mv.groupId)

      // Agrupar em { group_id → { group_name, series[] } }
      const productsMap = new Map<number, { group_id: number; group_name: string; series: object[] }>()
      for (const r of rows) {
        if (!productsMap.has(r.group_id)) {
          productsMap.set(r.group_id, {
            group_id: r.group_id,
            group_name: r.group_name ?? String(r.group_id),
            series: [],
          })
        }
        productsMap.get(r.group_id)!.series.push({
          period:        r.period,
          volume_liters: round2(n(r.volume_liters)),
          gross_revenue: round2(n(r.gross_revenue)),
          gross_margin:  round2(n(r.gross_margin)),
        })
      }

      return reply.send({
        granularity,
        by_product: true,
        products: Array.from(productsMap.values()),
      })
    }

    // Série consolidada (comportamento original)
    const rows = await db
      .select({
        period:        periodExpr.as('period'),
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
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
        groupIds ? inArray(mv.groupId, groupIds) : undefined,
      ))
      .groupBy(periodExpr)
      .orderBy(periodExpr)

    return reply.send({
      granularity,
      by_product: false,
      series: rows.map(r => {
        const gross_margin = n(r.gross_margin)
        const net_revenue  = n(r.net_revenue)
        return {
          period:        r.period,
          volume_liters: round2(n(r.volume_liters)),
          gross_revenue: round2(n(r.gross_revenue)),
          gross_margin:  round2(gross_margin),
          margin_pct:    pct(gross_margin, net_revenue),
        }
      }),
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/fuel/products
  // Reaproveita o mesmo agrupamento do /summary, mas retorna apenas o array.
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
  // GET /api/v1/fuel/subgroups
  // Breakdown "Por produto" via fact_sale, agregado por PRODUTO
  // (source_product_id) — não mais por subgrupo cru do ERP (que escondia
  // Diesel S-10 × S-500 sob "Diseis"). Aplica a curadoria de produto
  // (Plano 2b): custom_label, rollup por display_group, esconde visible=false.
  // Mantém a chave de resposta `subgroups` para compatibilidade do frontend.
  // Query params: start_date, end_date, location_id?
  // ---------------------------------------------------------------------
  app.get('/subgroups', async (req, reply) => {
    const tenantId = req.tenantId!
    let startDate: string, endDate: string, locationIds: string[] | undefined
    try {
      ({ startDate, endDate } = parseDateRange(req.query as Record<string, unknown>))
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const [rows, classMap] = await Promise.all([
      db
        .select({
          product_id:    factSale.sourceProductId,
          product_name:  sql<string | null>`MAX(${factSale.productName})`,
          subgroup_name: sql<string | null>`MAX(${factSale.subgroupName})`,
          gross_revenue: sum(factSale.totalValue).mapWith(Number),
          cogs: sql<number>`COALESCE(SUM(${factSale.unitCost} * ${factSale.quantity}), 0)`.mapWith(Number),
          discount:      sum(factSale.discountTotal).mapWith(Number),
          quantity:      sum(factSale.quantity).mapWith(Number),
        })
        .from(factSale)
        .where(and(
          eq(factSale.tenantId, tenantId),
          inArray(factSale.categoryCode, ['CB', 'ARL']),
          gte(factSale.saleDate, startDate),
          lte(factSale.saleDate, endDate),
          locationIds ? inArray(factSale.locationId, locationIds) : undefined,
        ))
        .groupBy(factSale.sourceProductId),
      loadProductClassification(tenantId),
    ])

    // Acumulador por "bucket" de display: display_group (rollup) ou o próprio produto.
    type Acc = { id: string; name: string; sort: number | null; gross: number; cogs: number; disc: number; qty: number }
    const buckets = new Map<string, Acc>()

    for (const r of rows) {
      const cls = classMap.get(classificationKey('product', r.product_id))
      if (cls && cls.visible === false) continue // esconde lixo/inativo

      const label = cls?.customLabel ?? r.product_name ?? r.subgroup_name ?? `Produto ${r.product_id}`
      // rollup: produtos com mesmo display_group somam numa barra só
      const bucketKey = cls?.displayGroup ?? `product:${r.product_id}`
      const bucketName = cls?.displayGroup ?? label

      const acc = buckets.get(bucketKey) ?? { id: bucketKey, name: bucketName, sort: cls?.sortOrder ?? null, gross: 0, cogs: 0, disc: 0, qty: 0 }
      acc.gross += n(r.gross_revenue)
      acc.cogs  += n(r.cogs)
      acc.disc  += n(r.discount)
      acc.qty   += n(r.quantity)
      if (acc.sort == null && cls?.sortOrder != null) acc.sort = cls.sortOrder
      buckets.set(bucketKey, acc)
    }

    const list = Array.from(buckets.values())
    const totalRevenue = list.reduce((acc, r) => acc + r.gross, 0)
    const totalVolume  = list.reduce((acc, r) => acc + r.qty, 0)

    const subgroups = list
      .map(b => {
        const gross_revenue = b.gross
        const cogs          = b.cogs
        const net_revenue   = gross_revenue - b.disc
        const gross_margin  = net_revenue - cogs
        const quantity      = b.qty
        return {
          subgroup_id:     b.id,
          subgroup_name:   b.name,
          sort_order:      b.sort,
          gross_revenue:   round2(gross_revenue),
          net_revenue:     round2(net_revenue),
          cogs:            round2(cogs),
          gross_margin:    round2(gross_margin),
          margin_pct:      pct(gross_margin, net_revenue),
          volume_liters:   round2(quantity),
          avg_price_liter: quantity > 0 ? round2(gross_revenue / quantity) : null,
          avg_cost_liter:  quantity > 0 && cogs > 0 ? round2(cogs / quantity) : null,
          revenue_share_pct: pct(gross_revenue, totalRevenue),
          volume_share_pct:  pct(quantity, totalVolume),
        }
      })
      // ordena por sort_order quando definido, senão por volume desc
      .sort((a, b2) => {
        if (a.sort_order != null && b2.sort_order != null) return a.sort_order - b2.sort_order
        if (a.sort_order != null) return -1
        if (b2.sort_order != null) return 1
        return b2.volume_liters - a.volume_liters
      })

    return reply.send({ subgroups })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/fuel/by-location
  // Receita, volume e participação por unidade no período selecionado.
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
        volume_liters: sum(mv.volumeLiters).mapWith(Number),
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
    const totalVolume  = rows.reduce((acc, r) => acc + n(r.volume_liters), 0)

    return reply.send({
      locations: rows.map(r => {
        const gross_revenue = n(r.gross_revenue)
        const volume_liters = n(r.volume_liters)
        const avg_price     = volume_liters > 0 ? round2(gross_revenue / volume_liters) : null
        return {
          location_id:       r.location_id,
          location_name:     r.location_name,
          gross_revenue:     round2(gross_revenue),
          volume_liters:     round2(volume_liters),
          avg_price:         avg_price,
          share_pct:         pct(gross_revenue, totalRevenue),
          volume_share_pct:  pct(volume_liters, totalVolume),
        }
      }),
    })
  })
}

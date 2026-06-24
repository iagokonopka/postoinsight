import type { FastifyPluginAsync } from 'fastify'
import { and, eq, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvIncomeStatementMonthly as mv, mvExpenseGroupMonthly as dg, expenseClassification as dc } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseUuidArray, parseYearMonthArray, n, pct, round2,
} from '../lib/queryParsers.js'

/** accounting_type (banco) → chave do bloco `expenses` no response do DRE. */
const TYPE_TO_BUCKET = {
  despesa_operacional: 'operating',
  despesa_financeira:  'financial',
  imposto:             'tax',
  investimento:        'investment',
  cmv:                 'cogs',
  nao_operacional:     'non_operating',
} as const
const BUCKETS = [
  'operating', 'financial', 'tax', 'investment', 'cogs', 'non_operating', 'unclassified',
] as const
type Bucket = typeof BUCKETS[number]

const SEGMENTS = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const

/**
 * Endpoints de DRE Mensal — `analytics.mv_income_statement_monthly`.
 * Specs: docs/specs/dre-mensal.md
 *
 * Linha consolidada (`_total`) é calculada na API — nunca armazenada.
 */
export const dreRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/dre/monthly
  // ---------------------------------------------------------------------
  app.get('/monthly', async (req, reply) => {
    const tenantId = req.tenantId!
    let months: string[]
    let locationIds: string[] | undefined
    try {
      months      = parseYearMonthArray((req.query as any).months, 'months')
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segment:       mv.segment,
        year_month:    mv.yearMonth,
        gross_revenue: sum(mv.grossRevenue).mapWith(Number),
        discounts:     sum(mv.discounts).mapWith(Number),
        net_revenue:   sum(mv.netRevenue).mapWith(Number),
        cogs:          sum(mv.cogs).mapWith(Number),
        gross_margin:  sum(mv.grossMargin).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        inArray(mv.yearMonth, months),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segment, mv.yearMonth)

    type SegLine = typeof SEGMENTS[number] | '_total'
    type Period = {
      gross_revenue: number
      discounts: number
      net_revenue: number
      cogs: number
      gross_margin: number
      margin_pct: number
    }

    function emptyPeriod(): Period {
      return { gross_revenue: 0, discounts: 0, net_revenue: 0, cogs: 0, gross_margin: 0, margin_pct: 0 }
    }

    // Inicializa estrutura: segmento → mês → métricas
    const linesMap = new Map<string, Record<string, Period>>()
    for (const seg of SEGMENTS) {
      const periods: Record<string, Period> = {}
      for (const m of months) periods[m] = emptyPeriod()
      linesMap.set(seg, periods)
    }
    const totalPeriods: Record<string, Period> = {}
    for (const m of months) totalPeriods[m] = emptyPeriod()

    for (const r of rows) {
      const seg = r.segment as string
      const segPeriods = linesMap.get(seg)
      if (!segPeriods) continue   // ignora segmentos não esperados
      const p = segPeriods[r.year_month]
      const t = totalPeriods[r.year_month]
      if (!p || !t) continue
      p.gross_revenue = n(r.gross_revenue)
      p.discounts     = n(r.discounts)
      p.net_revenue   = n(r.net_revenue)
      p.cogs          = n(r.cogs)
      p.gross_margin  = n(r.gross_margin)
      p.margin_pct    = pct(p.gross_margin, p.net_revenue)

      t.gross_revenue += p.gross_revenue
      t.discounts     += p.discounts
      t.net_revenue   += p.net_revenue
      t.cogs          += p.cogs
      t.gross_margin  += p.gross_margin
    }

    // Calcula margin_pct do total e arredonda valores monetários
    function finalizePeriods(map: Record<string, Period>) {
      const out: Record<string, Period> = {}
      for (const m of Object.keys(map)) {
        const p = map[m]!
        out[m] = {
          gross_revenue: round2(p.gross_revenue),
          discounts:     round2(p.discounts),
          net_revenue:   round2(p.net_revenue),
          cogs:          round2(p.cogs),
          gross_margin:  round2(p.gross_margin),
          margin_pct:    pct(p.gross_margin, p.net_revenue),
        }
      }
      return out
    }

    const lines: Array<{ segment: SegLine; periods: Record<string, Period> }> =
      SEGMENTS.map(seg => ({
        segment: seg,
        periods: finalizePeriods(linesMap.get(seg)!),
      }))
    lines.push({
      segment: '_total',
      periods: finalizePeriods(totalPeriods),
    })

    // -------------------------------------------------------------------
    // Despesas classificadas por tipo contábil (Plano 2a).
    // Override não-destrutivo aplicado em tempo de leitura: faz merge do mapa
    // de classificação do tenant (app.expense_classification) sobre os grupos
    // de mv_expense_group_monthly. Apenas `despesa_operacional` subtrai da
    // Margem Bruta → Resultado Operacional. Spec: docs/specs/admin-mapping.md
    // -------------------------------------------------------------------
    const expenseRows = await db
      .select({
        year_month: dg.yearMonth,
        code:       dg.financialGroupCode,
        name:       sql<string>`max(${dg.financialGroupName})`,
        amount:     sum(dg.totalExpenses).mapWith(Number),
      })
      .from(dg)
      .where(and(
        eq(dg.tenantId, tenantId),
        inArray(dg.yearMonth, months),
        locationIds ? inArray(dg.locationId, locationIds) : undefined,
      ))
      .groupBy(dg.yearMonth, dg.financialGroupCode)

    // Mapa de classificação do tenant: code → { type, label }
    const classRows = await db
      .select({ code: dc.financialGroupCode, accounting: dc.accountingType, customLabel: dc.customLabel })
      .from(dc)
      .where(eq(dc.tenantId, tenantId))
    const classMap = new Map(classRows.map(r => [r.code, r]))

    type GroupAmount = { label: string; code: string; amount: number }
    type BucketAgg = { total: number; by_group: GroupAmount[] }
    function emptyExpenses(): Record<Bucket, BucketAgg> {
      const out = {} as Record<Bucket, BucketAgg>
      for (const b of BUCKETS) out[b] = { total: 0, by_group: [] }
      return out
    }
    const expenses: Record<string, Record<Bucket, BucketAgg>> = {}
    for (const m of months) expenses[m] = emptyExpenses()

    for (const r of expenseRows) {
      const monthAgg = expenses[r.year_month]
      if (!monthAgg) continue
      const cls    = classMap.get(r.code)
      const bucket: Bucket = (cls && TYPE_TO_BUCKET[cls.accounting as keyof typeof TYPE_TO_BUCKET]) || 'unclassified'
      const amount = round2(n(r.amount))
      const label  = cls?.customLabel ?? r.name ?? '(sem grupo)'
      const agg    = monthAgg[bucket]
      agg.by_group.push({ label, code: r.code, amount })
      agg.total = round2(agg.total + amount)
    }
    for (const m of months) {
      for (const b of BUCKETS) expenses[m]![b].by_group.sort((a, c) => c.amount - a.amount)
    }

    // Resultado Operacional = Margem Bruta (consolidado) − Despesa Operacional
    const totalFinal = finalizePeriods(totalPeriods)
    type OperatingResult = {
      gross_margin: number
      operating_expenses: number
      operating_result: number
      operating_margin_pct: number
    }
    const operatingResult: Record<string, OperatingResult> = {}
    for (const m of months) {
      const grossMargin = totalFinal[m]?.gross_margin ?? 0
      const netRevenue  = totalFinal[m]?.net_revenue ?? 0
      const opExp       = expenses[m]!.operating.total
      const result      = round2(grossMargin - opExp)
      operatingResult[m] = {
        gross_margin:         grossMargin,
        operating_expenses:   opExp,
        operating_result:     result,
        operating_margin_pct: pct(result, netRevenue),
      }
    }

    return reply.send({
      months,
      locations: locationIds ?? 'all',
      lines,
      expenses,
      operating_result: operatingResult,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/dre/available-months
  // ---------------------------------------------------------------------
  app.get('/available-months', async (req, reply) => {
    const tenantId = req.tenantId!
    let locationIds: string[] | undefined
    try {
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .selectDistinct({ year_month: mv.yearMonth })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .orderBy(desc(mv.yearMonth))
      .limit(24)

    return reply.send({ months: rows.map(r => r.year_month) })
  })
}

import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useDreMensal, lastNMonths, toAnoMes, type DrePeriodo, type DespesaBucketKey } from '@/hooks/useDre'
import { useApp } from '@/context/AppContext'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { WaterfallChart, type WaterfallItem } from '@/components/charts/WaterfallChart'
import { MultiLineChart } from '@/components/charts/MultiLineChart'
import { DeltaTag } from '@/components/ui/KpiCard'
import { fCurrency, fPct, fMonthShort } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── DRE table row styles ─────────────────────────────────────────────────────

const ROW_NORMAL: React.CSSProperties = {
  fontSize: '13px',
}
const ROW_TOTAL: React.CSSProperties = {
  borderTop: '2px solid hsl(var(--border))',
  fontWeight: 600,
  background: 'hsl(var(--muted) / 0.4)',
}
const ROW_RESULT: React.CSSProperties = {
  borderTop: '2px solid hsl(var(--success) / 0.3)',
  background: 'hsl(var(--success-subtle))',
  fontWeight: 700,
  color: 'hsl(var(--success))',
}

const TD: React.CSSProperties = { padding: '12px 14px', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' }
const TD_FIRST: React.CSSProperties = { ...TD, paddingLeft: '20px' }
const TD_RIGHT: React.CSSProperties = { ...TD, textAlign: 'right' }

const SEG_COLORS: Record<string, string> = {
  combustivel:   CHART_COLORS.combustivel,
  lubrificantes: CHART_COLORS.lubrificantes,
  servicos:      CHART_COLORS.servicos,
  conveniencia:  CHART_COLORS.conveniencia,
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function DrePage() {
  const { dreYear, dreMonthIdx } = useApp()

  // 6 months ending at current DRE selection
  const meses = lastNMonths(dreYear, dreMonthIdx, 6)
  const curMes = toAnoMes(dreYear, dreMonthIdx)
  const prevMes = meses[meses.length - 2] // month before current

  const { data: dreData, isLoading } = useDreMensal(meses)

  // ── Helper: get total line ──
  const total = dreData?.linhas.find(l => l.segmento === '_total')

  // ── Current and prev month totals ──
  const cur  = total?.periodos[curMes]
  const prev = total?.periodos[prevMes]

  // ── KPI deltas (vs previous month) ──
  function delta(getter: (p: DrePeriodo) => number): number | undefined {
    if (!cur || !prev) return undefined
    const c = getter(cur), p = getter(prev)
    return p !== 0 ? ((c - p) / Math.abs(p)) * 100 : undefined
  }

  const deltaMargemPP = (cur && prev)
    ? cur.margem_pct - prev.margem_pct
    : undefined

  // ── Spark series (6 months) ──
  const sparkFor = (getter: (p: DrePeriodo) => number) =>
    meses.map(m => getter(total?.periodos[m] ?? { receita_bruta: 0, descontos: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0, margem_pct: 0 }))

  // ── Waterfall items for current month ──
  const waterfallItems: WaterfallItem[] = cur ? [
    { label: 'Receita Bruta', type: 'start', value: cur.receita_bruta },
    { label: '(−) Descontos', type: 'minus', value: cur.descontos },
    { label: '(−) CMV',       type: 'minus', value: cur.cmv },
    { label: 'Margem Bruta',  type: 'total', value: cur.margem_bruta },
  ] : []

  // ── Multi-line margem% por segmento ──
  const segmentos = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const
  const marginChartData = meses.map(m => {
    const row: Record<string, unknown> = { label: fMonthShort(m + '-01') }
    for (const seg of segmentos) {
      const p = dreData?.linhas.find(l => l.segmento === seg)?.periodos[m]
      row[seg] = p?.margem_pct ?? 0
    }
    return row
  })

  // ── DRE table: series headers ──
  const seriesLabels = meses.map(m => fMonthShort(m + '-01'))

  // ── Table row renderer ──
  const dreRows: {
    label: string
    getter: (p: DrePeriodo) => number
    style: React.CSSProperties
    prefix?: string
    isPercent?: boolean
  }[] = [
    { label: 'Receita Bruta',    getter: p => p.receita_bruta,   style: ROW_NORMAL },
    { label: '(−) Descontos',    getter: p => p.descontos,       style: ROW_NORMAL, prefix: '−' },
    { label: 'Receita Líquida',  getter: p => p.receita_liquida, style: ROW_TOTAL },
    { label: '(−) CMV',          getter: p => p.cmv,             style: ROW_NORMAL, prefix: '−' },
    { label: 'Margem Bruta',     getter: p => p.margem_bruta,    style: ROW_RESULT },
    { label: 'Margem %',         getter: p => p.margem_pct,      style: ROW_NORMAL, isPercent: true },
  ]

  // YTD sums (all months for money rows; '—' for pct)
  const ytd = (getter: (p: DrePeriodo) => number) =>
    meses.reduce((s, m) => s + getter(total?.periodos[m] ?? { receita_bruta:0, descontos:0, receita_liquida:0, cmv:0, margem_bruta:0, margem_pct:0 }), 0)

  return (
    <Page>
      <PageHeader
        title="DRE Mensal"
        subtitle="Demonstrativo de resultado por mês — receita, deduções, CMV e margem bruta."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Receita Bruta"
          value={cur ? fCurrency(cur.receita_bruta) : '—'}
          deltaMonth={delta(p => p.receita_bruta)}
          sparkData={sparkFor(p => p.receita_bruta)}
          sparkColor={CHART_COLORS.combustivel}
        />
        <KpiCard
          label="CMV"
          value={cur ? fCurrency(cur.cmv) : '—'}
          deltaMonth={delta(p => p.cmv)}
          sparkData={sparkFor(p => p.cmv)}
          sparkColor={CHART_COLORS.neg}
        />
        <KpiCard
          label="Margem Bruta"
          value={cur ? fCurrency(cur.margem_bruta) : '—'}
          deltaMonth={delta(p => p.margem_bruta)}
          sparkData={sparkFor(p => p.margem_bruta)}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Margem %"
          value={cur ? fPct(cur.margem_pct, 2) : '—'}
          deltaMonth={deltaMargemPP}
          deltaPP
          sparkData={sparkFor(p => p.margem_pct)}
          sparkColor={CHART_COLORS.combustivel}
        />
      </KpiGrid>

      {/* Waterfall + Margem% evolução */}
      <Row variant="1-1">
        <Card>
          <CardHeader title={`Waterfall — ${fMonthShort(curMes + '-01')}`} />
          <CardBody>
            <ChartBox size="tall">
              {isLoading
                ? <LoadingBox />
                : waterfallItems.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhum dado para o mês selecionado." />
                  : <WaterfallChart items={waterfallItems} />
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Margem % — últimos 6 meses" />
          <CardBody>
            <ChartBox size="tall">
              {isLoading
                ? <LoadingBox />
                : <MultiLineChart
                    data={marginChartData}
                    xKey="label"
                    yFormatter={v => v.toFixed(1) + '%'}
                    tooltipFormatter={v => fPct(v, 1)}
                    pointRadius={3}
                    series={segmentos.map(seg => ({
                      key: seg,
                      label: seg.charAt(0).toUpperCase() + seg.slice(1),
                      color: SEG_COLORS[seg],
                    }))}
                  />
              }
            </ChartBox>
          </CardBody>
        </Card>
      </Row>

      {/* DRE Table */}
      <Card>
        <CardHeader title="Detalhamento mês a mês" />
        {isLoading
          ? <CardBody><LoadingBox /></CardBody>
          : <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ ...TD_FIRST, textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                      Linha
                    </th>
                    {seriesLabels.map((lbl, i) => (
                      <th key={i} style={{ ...TD_RIGHT, fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                        {lbl}
                      </th>
                    ))}
                    <th style={{ ...TD_RIGHT, fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>δ</th>
                    <th style={{ ...TD_RIGHT, fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', paddingRight: '20px' }}>YTD</th>
                  </tr>
                </thead>
                <tbody>
                  {dreRows.map(row => {
                    const isResult = row.style === ROW_RESULT
                    // delta vs previous month
                    const curVal  = row.getter(cur  ?? { receita_bruta:0, descontos:0, receita_liquida:0, cmv:0, margem_bruta:0, margem_pct:0 })
                    const prevVal = row.getter(prev ?? { receita_bruta:0, descontos:0, receita_liquida:0, cmv:0, margem_bruta:0, margem_pct:0 })
                    const rowDelta = prev
                      ? row.isPercent
                        ? curVal - prevVal          // pp
                        : prevVal !== 0 ? ((curVal - prevVal) / Math.abs(prevVal)) * 100 : undefined
                      : undefined

                    return (
                      <tr key={row.label}>
                        <td style={{ ...TD_FIRST, ...row.style, textAlign: 'left', color: isResult ? 'hsl(var(--success))' : undefined }}>
                          {row.label}
                        </td>
                        {meses.map((m, _i) => {
                          const p = total?.periodos[m] ?? { receita_bruta:0, descontos:0, receita_liquida:0, cmv:0, margem_bruta:0, margem_pct:0 }
                          const val = row.getter(p)
                          const isCurrent = m === curMes
                          return (
                            <td key={m} style={{
                              ...TD_RIGHT,
                              ...row.style,
                              fontWeight: isCurrent ? 600 : undefined,
                              color: isResult ? 'hsl(var(--success))' : undefined,
                            }}>
                              {row.isPercent ? fPct(val, 1) : fCurrency(val)}
                            </td>
                          )
                        })}
                        {/* δ column */}
                        <td style={{ ...TD_RIGHT, ...row.style, color: isResult ? 'hsl(var(--success))' : undefined }}>
                          {rowDelta != null
                            ? <DeltaTag value={rowDelta} isPP={row.isPercent} />
                            : '—'
                          }
                        </td>
                        {/* YTD */}
                        <td style={{ ...TD_RIGHT, ...row.style, paddingRight: '20px', color: isResult ? 'hsl(var(--success))' : undefined }}>
                          {row.isPercent ? '—' : fCurrency(ytd(row.getter))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
        }
      </Card>

      {/* Resultado Operacional (Plano 2a — Margem Bruta − despesa operacional) */}
      <Card>
        <CardHeader title={`Resultado Operacional — ${fMonthShort(curMes + '-01')}`} />
        <CardBody>
          {isLoading
            ? <LoadingBox />
            : (() => {
                const ro = dreData?.resultado_operacional?.[curMes]
                const dp = dreData?.despesas?.[curMes]
                if (!ro) {
                  return <EmptyState title="Sem dados" description="Nenhum dado para o mês selecionado." />
                }
                const naoClass = dp?.nao_classificado.total ?? 0
                return (
                  <>
                    {naoClass > 0 && (
                      <div style={{
                        fontSize: '12px',
                        color: 'hsl(var(--warning))',
                        background: 'hsl(var(--warning-subtle))',
                        border: '1px solid hsl(var(--warning) / 0.3)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginBottom: '12px',
                      }}>
                        ⚠ Existem <strong>{fCurrency(naoClass)}</strong> em despesas não classificadas neste mês —
                        o Resultado Operacional pode estar incompleto.{' '}
                        <Link to="/configuracoes/mapeamento" style={{ color: 'hsl(var(--warning))', fontWeight: 600 }}>
                          Classificar agora →
                        </Link>
                      </div>
                    )}
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        <tr>
                          <td style={{ ...TD_FIRST, ...ROW_NORMAL, textAlign: 'left' }}>Margem Bruta</td>
                          <td style={{ ...TD_RIGHT, ...ROW_NORMAL, paddingRight: '20px' }}>{fCurrency(ro.margem_bruta)}</td>
                        </tr>
                        <tr>
                          <td style={{ ...TD_FIRST, ...ROW_NORMAL, textAlign: 'left' }}>(−) Despesa Operacional</td>
                          <td style={{ ...TD_RIGHT, ...ROW_NORMAL, paddingRight: '20px' }}>−{fCurrency(ro.despesa_operacional)}</td>
                        </tr>
                        <tr>
                          <td style={{ ...TD_FIRST, ...ROW_RESULT, textAlign: 'left', color: 'hsl(var(--success))' }}>(=) Resultado Operacional</td>
                          <td style={{ ...TD_RIGHT, ...ROW_RESULT, paddingRight: '20px', color: 'hsl(var(--success))' }}>{fCurrency(ro.resultado_operacional)}</td>
                        </tr>
                        <tr>
                          <td style={{ ...TD_FIRST, ...ROW_NORMAL, textAlign: 'left' }}>Margem Operacional %</td>
                          <td style={{ ...TD_RIGHT, ...ROW_NORMAL, paddingRight: '20px' }}>{fPct(ro.margem_operacional_pct, 2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </>
                )
              })()
          }
        </CardBody>
      </Card>

      {/* Despesas por tipo contábil (informativo — não entram no Resultado Operacional) */}
      <Card>
        <CardHeader title={`Despesas por tipo contábil — ${fMonthShort(curMes + '-01')}`} description="Tipos informativos abaixo não entram no Resultado Operacional." />
        <CardBody>
          {isLoading
            ? <LoadingBox />
            : (() => {
                const dp = dreData?.despesas?.[curMes]
                if (!dp) return <EmptyState title="Sem despesas" description="Nenhuma despesa para o mês selecionado." />
                const order: { key: DespesaBucketKey; label: string }[] = [
                  { key: 'operacional',      label: 'Despesa operacional (entra no resultado)' },
                  { key: 'financeira',       label: 'Despesa financeira' },
                  { key: 'imposto',          label: 'Impostos' },
                  { key: 'investimento',     label: 'Investimentos' },
                  { key: 'cmv',              label: 'CMV (compras — já no custo da venda)' },
                  { key: 'nao_operacional',  label: 'Não-operacional' },
                  { key: 'nao_classificado', label: 'Não classificado' },
                ]
                const visible = order.filter(o => dp[o.key].total > 0)
                if (visible.length === 0) return <EmptyState title="Sem despesas" description="Nenhuma despesa para o mês selecionado." />
                return (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <tbody>
                        {visible.map(o => {
                          const bucket = dp[o.key]
                          return (
                            <Fragment key={o.key}>
                              <tr style={{ background: 'hsl(var(--muted) / 0.4)' }}>
                                <td style={{ ...TD_FIRST, fontWeight: 600 }}>{o.label}</td>
                                <td style={{ ...TD_RIGHT, fontWeight: 600, paddingRight: '20px' }}>{fCurrency(bucket.total)}</td>
                              </tr>
                              {bucket.porGrupo.map(g => (
                                <tr key={o.key + g.codigo}>
                                  <td style={{ ...TD_FIRST, ...ROW_NORMAL, textAlign: 'left', paddingLeft: '36px', color: 'hsl(var(--muted-foreground))' }}>{g.label}</td>
                                  <td style={{ ...TD_RIGHT, ...ROW_NORMAL, paddingRight: '20px' }}>{fCurrency(g.valor)}</td>
                                </tr>
                              ))}
                            </Fragment>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )
              })()
          }
        </CardBody>
      </Card>
    </Page>
  )
}

function LoadingBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
      <Spinner size="lg" />
    </div>
  )
}

import { useState } from 'react'
import { Clock } from 'lucide-react'

import { useCombustivelResumo, useCombustivelResumoPrev, useCombustivelEvolucaoPorProduto, useCombustivelByLocation, useCombustivelSubgrupos } from '@/hooks/useCombustivel'
import { useArlaResumo, useArlaResumoPrev, useArlaByLocation } from '@/hooks/useArla'

import { Page, Card, CardHeader, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { SegControl } from '@/components/ui/SegControl'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { FuelLineChart, type FuelLinePoint } from '@/components/charts/FuelLineChart'
import { HBars, type HBarRow } from '@/components/charts/HBars'
import { TableWrap, Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { fCurrency, fCompact, fLiters, fInt, fPct, fDayMonth, fMonthShort } from '@/lib/format'

// ─── Métricas ─────────────────────────────────────────────────────────────────

type Metric = 'volume' | 'receita' | 'cmv' | 'margem'

const METRIC_OPTS: { value: Metric; label: string }[] = [
  { value: 'volume',  label: 'Volume' },
  { value: 'receita', label: 'Receita' },
  { value: 'cmv',     label: 'CMV' },
  { value: 'margem',  label: 'Margem bruta' },
]

// axis/valor por métrica
function axisFmt(metric: Metric) {
  if (metric === 'volume') return (v: number) => (v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + ' mi L' : Math.round(v / 1e3) + 'k L')
  return fCompact
}
function valueFmt(metric: Metric) {
  return metric === 'volume' ? fLiters : fCompact
}

export default function CombustivelPage() {
  const [metric, setMetric] = useState<Metric>('volume')

  const { data: resumo } = useCombustivelResumo()
  const { data: evo, isLoading: loadingEvo } = useCombustivelEvolucaoPorProduto('day')
  const { data: byLocation } = useCombustivelByLocation()
  const { data: resumoPrev } = useCombustivelResumoPrev()
  const { data: subgrupos, isLoading: loadingSub } = useCombustivelSubgrupos()
  const { data: arla } = useArlaResumo()
  const { data: arlaPrev } = useArlaResumoPrev()
  const { data: arlaByLocation } = useArlaByLocation()

  const pctChange = (cur?: number, prev?: number) => (cur != null && prev != null && prev !== 0) ? ((cur - prev) / prev) * 100 : undefined
  const isArla = (s?: string | null) => /arla/i.test(s ?? '')

  // ── Totais CB-only (combustível menos Arla) ──
  type CbTot = { volume_liters: number; gross_revenue: number; cogs: number; gross_margin: number; margin_pct: number }
  const cbOnly = (tot?: { volume_liters: number; gross_revenue: number; cogs: number; gross_margin: number }, a?: { volume_liters: number; gross_revenue: number; cogs: number; gross_margin: number }): CbTot | undefined => {
    if (!tot) return undefined
    const volume_liters = tot.volume_liters - (a?.volume_liters ?? 0)
    const gross_revenue = tot.gross_revenue - (a?.gross_revenue ?? 0)
    const cogs = tot.cogs - (a?.cogs ?? 0)
    const gross_margin = tot.gross_margin - (a?.gross_margin ?? 0)
    return { volume_liters, gross_revenue, cogs, gross_margin, margin_pct: gross_revenue > 0 ? (gross_margin / gross_revenue) * 100 : 0 }
  }
  const t  = cbOnly(resumo?.totals, arla?.totals)
  const tp = cbOnly(resumoPrev?.totals, arlaPrev?.totals)

  const fmtV = valueFmt(metric)
  const fmtA = axisFmt(metric)

  // ── Produtos reais de combustível (subgrupos), excluindo Arla ──
  const produtos = (subgrupos?.subgroups ?? []).filter(s => !isArla(s.subgroup_name))
  const prodVal = (p: { volume_liters: number; gross_revenue: number; cogs: number; gross_margin: number }) =>
    metric === 'volume' ? p.volume_liters : metric === 'receita' ? p.gross_revenue : metric === 'cmv' ? p.cogs : p.gross_margin

  // ── Evolução por período (CB-only: exclui série do grupo Arla) ──
  const evoProdutos = (evo?.products ?? []).filter(p => !isArla(p.group_name))
  const evoMap = new Map<string, number>()
  for (const prod of evoProdutos) {
    for (const pt of prod.series) {
      const val = metric === 'volume' ? pt.volume_liters
        : metric === 'receita' ? pt.gross_revenue
        : metric === 'cmv' ? (pt.gross_revenue - pt.gross_margin)
        : pt.gross_margin
      evoMap.set(pt.period, (evoMap.get(pt.period) ?? 0) + val)
    }
  }
  const evoData: FuelLinePoint[] = Array.from(evoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, value]) => ({ label: period.length === 10 ? fDayMonth(period) : fMonthShort(period), value }))

  // ── Spread por período (real, CB-only: margem ÷ volume por período) ──
  const spreadMap = new Map<string, { m: number; v: number }>()
  for (const prod of evoProdutos) {
    for (const pt of prod.series) {
      const agg = spreadMap.get(pt.period) ?? { m: 0, v: 0 }
      agg.m += pt.gross_margin
      agg.v += pt.volume_liters
      spreadMap.set(pt.period, agg)
    }
  }
  const spreadData: FuelLinePoint[] = Array.from(spreadMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { m, v }]) => ({ label: period.length === 10 ? fDayMonth(period) : fMonthShort(period), value: v > 0 ? m / v : 0 }))
  const spreadFmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',')

  // ── Por produto (barras) ──
  const prodBars: HBarRow[] = produtos
    .map(p => ({ name: p.subgroup_name, value: prodVal(p), label: fmtV(prodVal(p)) }))
    .sort((a, b) => b.value - a.value)

  // ── Por posto (barras), CB-only: subtrai Arla por location ──
  const arlaByLoc = new Map<string, { volume_liters: number; gross_revenue: number }>()
  for (const l of arlaByLocation?.locations ?? []) arlaByLoc.set(l.location_id, { volume_liters: l.volume_liters, gross_revenue: l.gross_revenue })
  const locBars: HBarRow[] = (byLocation?.locations ?? [])
    .map(l => {
      const a = arlaByLoc.get(l.location_id)
      const v = metric === 'volume' ? l.volume_liters - (a?.volume_liters ?? 0) : l.gross_revenue - (a?.gross_revenue ?? 0)
      return { name: l.location_name, value: v, label: metric === 'volume' ? fLiters(v) : fCompact(v) }
    })
    .sort((a, b) => b.value - a.value)

  // ── Tabela por produto ──
  const prodTable = [...produtos].sort((a, b) => b.volume_liters - a.volume_liters)
  const metricLabel = METRIC_OPTS.find(m => m.value === metric)!.label

  return (
    <Page>
      <PageHeader eyebrow="Combustível" title="O combustível está saudável?" />

      {/* KPIs — uniformes (CB-only, sem Arla) */}
      <KpiGrid cols={5}>
        <KpiCard label="Volume" value={t ? fLiters(t.volume_liters) : '—'} valueTitle={t ? fInt(t.volume_liters) + ' L' : undefined} delta={pctChange(t?.volume_liters, tp?.volume_liters)} />
        <KpiCard label="Receita" value={t ? fCompact(t.gross_revenue) : '—'} valueTitle={t ? fCurrency(t.gross_revenue) : undefined} delta={pctChange(t?.gross_revenue, tp?.gross_revenue)} />
        <KpiCard label="CMV" value={t ? fCompact(t.cogs) : '—'} valueTitle={t ? fCurrency(t.cogs) : undefined} delta={pctChange(t?.cogs, tp?.cogs)} />
        <KpiCard label="Margem bruta" value={t ? fCompact(t.gross_margin) : '—'} valueTitle={t ? fCurrency(t.gross_margin) : undefined} delta={pctChange(t?.gross_margin, tp?.gross_margin)} />
        <KpiCard label="Margem" value={t ? fPct(t.margin_pct, 1) : '—'} delta={t && tp ? t.margin_pct - tp.margin_pct : undefined} deltaPP />
      </KpiGrid>

      {/* Controles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Métrica</span>
          <SegControl options={METRIC_OPTS} value={metric} onChange={setMetric} />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}>Comparar com</span>
          <select
            disabled
            title="Comparação entre períodos — em breve"
            style={{
              height: 34, padding: '0 30px 0 13px', borderRadius: 9,
              border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
              color: 'hsl(var(--muted-foreground))', fontFamily: 'inherit', fontSize: 13,
              cursor: 'not-allowed', appearance: 'none', opacity: 0.7,
            }}
          >
            <option>Sem comparação</option>
          </select>
        </div>
      </div>

      {/* Evolução + Por produto */}
      <Row style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <Card>
          <CardHeader eyebrow="Evolução no período" title={`${metricLabel} por período`} />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {loadingEvo ? <LoadingBox /> : evoData.length === 0
              ? <EmptyState title="Sem dados" description="Nenhum registro no período." />
              : <FuelLineChart data={evoData} yFormatter={fmtA} tooltipFormatter={metric === 'volume' ? (v) => fInt(v) + ' L' : fCurrency} />}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow={metricLabel} title="Por produto" />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {loadingSub ? <LoadingBox /> : prodBars.length === 0
              ? <EmptyState title="Sem dados" description="Sem produtos no período." />
              : <HBars data={prodBars} />}
          </div>
        </Card>
      </Row>

      {/* Spread (real) + Por turno (gap horário) */}
      <Row style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <Card>
          <CardHeader eyebrow="Spread médio (R$/L)" title="Spread por período" />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {loadingEvo ? <LoadingBox /> : spreadData.length === 0
              ? <EmptyState title="Sem dados" description="Nenhum registro no período." />
              : <FuelLineChart data={spreadData} yFormatter={spreadFmt} tooltipFormatter={spreadFmt} />}
          </div>
        </Card>
        <Card>
          <CardHeader eyebrow={metricLabel} title="Por turno" />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            <EmptyState icon={<Clock size={20} />} title="Disponível em breve" description="Requer granularidade horária do ERP — ainda não disponível." />
          </div>
        </Card>
      </Row>

      {/* Tabela por produto + Por posto */}
      <Row style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <Card>
          <CardHeader eyebrow="Breakdown" title="Por produto" />
          {prodTable.length === 0 ? (
            <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}><EmptyState title="Sem dados" description="Sem produtos no período." /></div>
          ) : (
            <TableWrap>
              <Table>
                <Thead>
                  <Th first>Produto</Th>
                  <Th right>Volume</Th>
                  <Th right>Receita</Th>
                  <Th right>Margem</Th>
                  <Th right last>Spread</Th>
                </Thead>
                <Tbody>
                  {prodTable.map(p => {
                    const spread = p.avg_price_liter != null && p.avg_cost_liter != null ? p.avg_price_liter - p.avg_cost_liter : null
                    return (
                      <Tr key={p.subgroup_id}>
                        <Td first><b style={{ fontWeight: 550 }}>{p.subgroup_name}</b></Td>
                        <Td right>{fLiters(p.volume_liters)}</Td>
                        <Td right>{fCompact(p.gross_revenue)}</Td>
                        <Td right><b style={{ color: p.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(p.margin_pct, 1)}</b></Td>
                        <Td right last>{spread != null ? 'R$ ' + spread.toFixed(2).replace('.', ',') : '—'}</Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </TableWrap>
          )}
        </Card>
        <Card>
          <CardHeader eyebrow={metric === 'volume' ? 'Volume' : 'Receita'} title="Por posto" />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {locBars.length === 0
              ? <EmptyState title="Sem dados" description="Sem postos no período." />
              : <HBars data={locBars} />}
          </div>
        </Card>
      </Row>
    </Page>
  )
}

function LoadingBox() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}><Spinner size="lg" /></div>
}

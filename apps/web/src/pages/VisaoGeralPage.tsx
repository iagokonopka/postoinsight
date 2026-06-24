import { useState, type ReactNode } from 'react'

import { useVendasResumo, useVendasResumoPrev, useVendasEvolucao, useVendasByLocation } from '@/hooks/useVendas'
import { useCombustivelResumo, useCombustivelResumoPrev, useCombustivelByLocation } from '@/hooks/useCombustivel'
import { useApp } from '@/context/AppContext'

import { Page, Card, CardHeader, ChartLegend, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EvolutionChart, type EvolutionPoint } from '@/components/charts/EvolutionChart'
import { MixBar, type MixSlice } from '@/components/charts/MixBar'
import { HBars, type HBarRow } from '@/components/charts/HBars'
import { Sparkline } from '@/components/ui/Sparkline'
import { TableWrap, Table, Thead, Th, Tbody, Tr, Td } from '@/components/ui/Table'
import { fCurrency, fInt, fPct, fLiters, fCompact, fDayMonth, fMonthShort } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── Config de segmentos (cor + rótulo) ───────────────────────────────────────

const SEG_CONFIG: Record<string, { label: string; color: string }> = {
  combustivel:   { label: 'Combustível',  color: CHART_COLORS.combustivel },
  conveniencia:  { label: 'Conveniência', color: CHART_COLORS.conveniencia },
  servicos:      { label: 'Serviços',     color: CHART_COLORS.servicos },
  lubrificantes: { label: 'Lubrificantes', color: CHART_COLORS.lubrificantes },
}
const segLabel = (s: string) => SEG_CONFIG[s]?.label ?? s

type SortKey = 'name' | 'revenue' | 'margin' | 'volume'
type DrawerKpi = 'revenue' | 'margin'

export default function VisaoGeralPage() {
  const { locationId, setLocationId } = useApp()
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [drawerKpi, setDrawerKpi] = useState<DrawerKpi | null>(null)

  const { data: resumo, isLoading: loadingResumo } = useVendasResumo()
  const { data: evolucao, isLoading: loadingEvo } = useVendasEvolucao('day')
  const { data: byLocation } = useVendasByLocation()
  const { data: combResumo } = useCombustivelResumo()
  const { data: combByLocation } = useCombustivelByLocation()
  const { data: resumoPrev } = useVendasResumoPrev()
  const { data: combPrev } = useCombustivelResumoPrev()

  const t = resumo?.totals
  const tp = resumoPrev?.totals
  const pctChange = (cur?: number, prev?: number) => (cur != null && prev != null && prev !== 0) ? ((cur - prev) / prev) * 100 : undefined

  // ── Volume de combustível por posto (join) ──
  const volByLoc = new Map<string, number>()
  for (const l of combByLocation?.locations ?? []) volByLoc.set(l.location_id, l.volume_liters)

  // ── Postos (ranking) ──
  type LocationRow = { id: string; name: string; revenue: number; margin: number; volume: number; qty: number }
  const locationsRaw: LocationRow[] = (byLocation?.locations ?? []).map(l => ({
    id: l.location_id,
    name: l.location_name,
    revenue: l.gross_revenue,
    margin: l.margin_pct,
    volume: volByLoc.get(l.location_id) ?? 0,
    qty: l.quantity,
  }))
  const margins = locationsRaw.map(p => p.margin)
  const maxMargin = margins.length ? Math.max(...margins) : 0
  const minMargin = margins.length ? Math.min(...margins) : 0
  const avgMargin = margins.length ? margins.reduce((s, m) => s + m, 0) / margins.length : 0

  const locations = [...locationsRaw].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey]
    const cmp = typeof av === 'string' ? av.localeCompare(bv as string) : (av as number) - (bv as number)
    return sortDir === 'desc' ? -cmp : cmp
  })

  function toggleSort(key: SortKey) {
    if (key === sortKey) setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  // ── Evolução ──
  const evoData: EvolutionPoint[] = (evolucao?.series ?? []).map(p => ({
    label: p.period.length === 10 ? fDayMonth(p.period) : fMonthShort(p.period),
    receita: p.gross_revenue,
    margem: p.gross_margin,
  }))

  // ── Mix por segmento ──
  const mixData: MixSlice[] = (resumo?.by_segment ?? [])
    .map(s => ({ label: segLabel(s.segment), value: s.gross_revenue, color: SEG_CONFIG[s.segment]?.color ?? CHART_COLORS.neutral }))
    .sort((a, b) => b.value - a.value)

  // ── Insights ──
  const insights = deriveInsights(resumo?.by_segment ?? [], locationsRaw, t?.margin_pct ?? 0, avgMargin)

  // ── Drawer ──
  const drawerBars: HBarRow[] = drawerKpi
    ? [...locationsRaw]
        .map(p => {
          const v = drawerKpi === 'revenue' ? p.revenue : p.revenue * (p.margin / 100)
          return { name: p.name, value: v, label: fCompact(v) }
        })
        .sort((a, b) => b.value - a.value)
    : []
  const drawerSpark = (evolucao?.series ?? []).map(p => (drawerKpi === 'revenue' ? p.gross_revenue : p.gross_margin))
  const drawerValue = drawerKpi === 'revenue' ? t?.net_revenue : t?.gross_margin

  return (
    <Page>
      <PageHeader eyebrow="Visão Geral" title="Como vai a rede neste período?" />

      {/* KPIs — uniformes; 2 primeiros abrem drawer (hint "ABRIR") */}
      <KpiGrid cols={5}>
        <KpiCard label="Receita líquida" value={t ? fCompact(t.net_revenue) : '—'} valueTitle={t ? fCurrency(t.net_revenue) : undefined} delta={pctChange(t?.net_revenue, tp?.net_revenue)} onClick={() => setDrawerKpi('revenue')} />
        <KpiCard label="Margem bruta" value={t ? fCompact(t.gross_margin) : '—'} valueTitle={t ? fCurrency(t.gross_margin) : undefined} delta={pctChange(t?.gross_margin, tp?.gross_margin)} onClick={() => setDrawerKpi('margin')} />
        <KpiCard label="Margem bruta %" value={t ? fPct(t.margin_pct, 1) : '—'} delta={t && tp ? t.margin_pct - tp.margin_pct : undefined} deltaPP />
        <KpiCard label="Volume de combustível" value={combResumo ? fLiters(combResumo.totals.volume_liters) : '—'} valueTitle={combResumo ? fInt(combResumo.totals.volume_liters) + ' L' : undefined} delta={pctChange(combResumo?.totals.volume_liters, combPrev?.totals.volume_liters)} />
        <KpiCard label="Ticket médio" value="—" />
      </KpiGrid>

      {/* O que pede atenção */}
      <InsightsPanel insights={insights} />

      {/* Evolução + Mix */}
      <Row style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <Card>
          <CardHeader
            eyebrow="Evolução no período"
            title="Receita líquida & margem bruta"
            action={<ChartLegend items={[{ label: 'Receita', color: 'hsl(var(--foreground))' }, { label: 'Margem', color: 'hsl(var(--primary))' }]} />}
          />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {loadingEvo ? <LoadingBox /> : evoData.length === 0
              ? <EmptyState title="Sem dados" description="Nenhuma venda no período." />
              : <EvolutionChart data={evoData} yFormatter={fCompact} tooltipFormatter={fCurrency} />}
          </div>
        </Card>

        <Card>
          <CardHeader eyebrow="Por segmento" title="Mix de receita" />
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}>
            {loadingResumo ? <LoadingBox /> : mixData.length === 0
              ? <EmptyState title="Sem dados" description="Sem receita no período." />
              : <MixBar data={mixData} />}
          </div>
        </Card>
      </Row>

      {/* Postos da rede */}
      <Card>
        <CardHeader eyebrow="Ranking" title="Postos da rede" />
        {locationsRaw.length === 0 ? (
          <div style={{ padding: '0 var(--pad-card) var(--pad-card-y)' }}><EmptyState title="Sem dados" description="Nenhum posto no período." /></div>
        ) : (
          <TableWrap>
            <Table>
              <Thead>
                <SortableTh first label="Posto" col="name" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh right label="Receita líq." col="revenue" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh right label="Margem" col="margin" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <SortableTh right label="Volume" col="volume" active={sortKey} dir={sortDir} onSort={toggleSort} />
                <Th right last>Ticket médio</Th>
              </Thead>
              <Tbody>
                {locations.map(p => {
                  const flag = p.margin === maxMargin ? 'pos' : p.margin === minMargin ? 'neg' : ''
                  return (
                    <Tr key={p.id} clickable onClick={() => setLocationId(p.id === locationId ? null : p.id)}>
                      <Td first>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <span style={{ width: 3, height: 16, borderRadius: 3, flexShrink: 0, background: flag === 'pos' ? 'hsl(var(--success))' : flag === 'neg' ? 'hsl(var(--danger))' : 'transparent' }} />
                          <b style={{ fontWeight: 550 }}>{p.name}</b>
                        </span>
                      </Td>
                      <Td right>{fCompact(p.revenue)}</Td>
                      <Td right><b style={{ color: p.margin >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(p.margin, 1)}</b></Td>
                      <Td right>{p.volume > 0 ? fLiters(p.volume) : <span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span>}</Td>
                      <Td right last><span style={{ color: 'hsl(var(--muted-foreground))' }}>—</span></Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </TableWrap>
        )}
      </Card>

      {/* Drawer — decomposição do KPI */}
      <Drawer
        open={drawerKpi !== null}
        onClose={() => setDrawerKpi(null)}
        title={drawerKpi === 'revenue' ? 'Receita líquida' : 'Margem bruta'}
      >
        <div style={{ fontVariantNumeric: 'tabular-nums', fontSize: 34, fontWeight: 600, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', marginBottom: 24 }} className="mono">
          {drawerValue != null ? fCurrency(drawerValue) : '—'}
        </div>
        <div style={{ marginBottom: 26 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>Decomposição por posto</div>
          {drawerBars.length ? <HBars data={drawerBars} /> : <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Sem dados por posto.</div>}
        </div>
        <div style={{ marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: 14 }}>Evolução no período</div>
          {drawerSpark.length >= 2
            ? <div style={{ height: 96 }}><Sparkline data={drawerSpark} color="hsl(var(--primary))" /></div>
            : <div style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))' }}>Sem série no período.</div>}
        </div>
        <p style={{ fontSize: 13.5, lineHeight: 1.55, color: 'hsl(var(--muted-foreground))' }}>
          {drawerKpi === 'revenue'
            ? 'A receita líquida soma o que entrou em todos os segmentos, já descontados impostos e devoluções. Toque em um posto no ranking para isolar a leitura.'
            : 'A margem bruta é o que sobra depois do custo da mercadoria vendida — o termômetro de saúde antes das despesas fixas.'}
        </p>
      </Drawer>
    </Page>
  )
}

// ─── Sortable header ──────────────────────────────────────────────────────────

function SortableTh({ label, col, active, dir, onSort, first, right }: {
  label: string; col: SortKey; active: SortKey; dir: 'asc' | 'desc'; onSort: (c: SortKey) => void; first?: boolean; right?: boolean
}) {
  const on = active === col
  return (
    <Th first={first} right={right}>
      <button
        onClick={() => onSort(col)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', font: 'inherit',
          color: on ? 'hsl(var(--foreground))' : 'inherit',
          letterSpacing: 'inherit', textTransform: 'inherit', padding: 0,
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginLeft: right ? 'auto' : undefined,
        }}
      >
        {label}<span style={{ fontSize: 9, opacity: on ? 1 : 0 }}>{dir === 'desc' ? '▼' : '▲'}</span>
      </button>
    </Th>
  )
}

// ─── Insights "O que pede atenção" ───────────────────────────────────────────

type Severity = 'alerta' | 'positivo' | 'neutro'
interface Insight { sev: Severity; text: ReactNode; tag: string }

const SEV_STYLE: Record<Severity, { dot: string; tagBg: string; tagColor: string }> = {
  alerta:   { dot: 'hsl(var(--danger))',  tagBg: 'hsl(var(--danger-subtle))',  tagColor: 'hsl(var(--danger))' },
  positivo: { dot: 'hsl(var(--success))', tagBg: 'hsl(var(--success-subtle))', tagColor: 'hsl(var(--success))' },
  neutro:   { dot: 'hsl(var(--muted-foreground))', tagBg: 'hsl(var(--muted))', tagColor: 'hsl(var(--muted-foreground))' },
}

interface SegLike { segment: string; gross_revenue: number; margin_pct: number; share_pct: number }
interface LocationLike { name: string; revenue: number; margin: number }

function deriveInsights(segments: SegLike[], locations: LocationLike[], overallMargin: number, avgMargin: number): Insight[] {
  const out: Insight[] = []
  const withRevenue = segments.filter(s => s.gross_revenue > 0)

  const top = [...withRevenue].sort((a, b) => b.share_pct - a.share_pct)[0]
  if (top) out.push({ sev: 'positivo', tag: 'Mix', text: <><b>{segLabel(top.segment)}</b> responde por <b>{fPct(top.share_pct, 0)}</b> da receita do período.</> })

  if (locations.length > 1) {
    const worst = [...locations].sort((a, b) => a.margin - b.margin)[0]
    const best = [...locations].sort((a, b) => b.margin - a.margin)[0]
    const worstGap = avgMargin - worst.margin
    if (worstGap > 0.5) out.push({ sev: 'alerta', tag: 'Postos', text: <><b>{worst.name}</b> está com margem de <b>{fPct(worst.margin, 1)}</b> — {fPct(worstGap, 1)} abaixo da média da rede ({fPct(avgMargin, 1)}).</> })
    if (best.margin - avgMargin > 0.5) out.push({ sev: 'positivo', tag: 'Postos', text: <><b>{best.name}</b> lidera a rede em rentabilidade: margem <b>{fPct(best.margin, 1)}</b>.</> })
  }

  const worstSeg = [...withRevenue].sort((a, b) => a.margin_pct - b.margin_pct)[0]
  if (worstSeg && worstSeg.margin_pct < overallMargin) out.push({ sev: 'neutro', tag: 'Margem', text: <><b>{segLabel(worstSeg.segment)}</b> opera com a menor margem entre os segmentos ({fPct(worstSeg.margin_pct, 1)}).</> })

  return out
}

function InsightsPanel({ insights }: { insights: Insight[] }) {
  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: 'var(--pad-card-y) var(--pad-card) 12px' }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--foreground))' }}>O que pede atenção</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'hsl(var(--muted-foreground))', background: 'hsl(var(--muted))', padding: '2px 8px', borderRadius: 999 }}>
          {insights.length} {insights.length === 1 ? 'ponto' : 'pontos'}
        </span>
      </div>
      {insights.length === 0 ? (
        <div style={{ padding: '4px var(--pad-card) var(--pad-card-y)', fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>
          Sem alertas no período. (Insights automáticos do servidor — em breve.)
        </div>
      ) : insights.map((it, i) => {
        const st = SEV_STYLE[it.sev]
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 13, padding: '13px var(--pad-card)', borderTop: '1px solid hsl(var(--border))' }}>
            <span style={{ width: 9, height: 9, borderRadius: 999, marginTop: 5, background: st.dot, flexShrink: 0 }} />
            <div style={{ fontSize: 14, lineHeight: 1.5, color: 'hsl(var(--foreground))', flex: 1 }}>{it.text}</div>
            <span className="mono" style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 6, background: st.tagBg, color: st.tagColor, flexShrink: 0, marginTop: 1 }}>
              {it.tag}
            </span>
          </div>
        )
      })}
    </Card>
  )
}

function LoadingBox() {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}><Spinner size="lg" /></div>
}

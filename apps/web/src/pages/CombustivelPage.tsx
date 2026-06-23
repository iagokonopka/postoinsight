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
  const { data: evo, isLoading: loadingEvo } = useCombustivelEvolucaoPorProduto('dia')
  const { data: byLocation } = useCombustivelByLocation()
  const { data: resumoPrev } = useCombustivelResumoPrev()
  const { data: subgrupos, isLoading: loadingSub } = useCombustivelSubgrupos()
  const { data: arla } = useArlaResumo()
  const { data: arlaPrev } = useArlaResumoPrev()
  const { data: arlaByLocation } = useArlaByLocation()

  const pctChange = (cur?: number, prev?: number) => (cur != null && prev != null && prev !== 0) ? ((cur - prev) / prev) * 100 : undefined
  const isArla = (s?: string | null) => /arla/i.test(s ?? '')

  // ── Totais CB-only (combustível menos Arla) ──
  type CbTot = { volume_litros: number; receita_bruta: number; cmv: number; margem_bruta: number; margem_pct: number }
  const cbOnly = (tot?: { volume_litros: number; receita_bruta: number; cmv: number; margem_bruta: number }, a?: { volume_litros: number; receita_bruta: number; cmv: number; margem_bruta: number }): CbTot | undefined => {
    if (!tot) return undefined
    const volume_litros = tot.volume_litros - (a?.volume_litros ?? 0)
    const receita_bruta = tot.receita_bruta - (a?.receita_bruta ?? 0)
    const cmv = tot.cmv - (a?.cmv ?? 0)
    const margem_bruta = tot.margem_bruta - (a?.margem_bruta ?? 0)
    return { volume_litros, receita_bruta, cmv, margem_bruta, margem_pct: receita_bruta > 0 ? (margem_bruta / receita_bruta) * 100 : 0 }
  }
  const t  = cbOnly(resumo?.totais, arla?.totais)
  const tp = cbOnly(resumoPrev?.totais, arlaPrev?.totais)

  const fmtV = valueFmt(metric)
  const fmtA = axisFmt(metric)

  // ── Produtos reais de combustível (subgrupos), excluindo Arla ──
  const produtos = (subgrupos?.subgrupos ?? []).filter(s => !isArla(s.subgrupo_descricao))
  const prodVal = (p: { volume_litros: number; receita_bruta: number; cmv: number; margem_bruta: number }) =>
    metric === 'volume' ? p.volume_litros : metric === 'receita' ? p.receita_bruta : metric === 'cmv' ? p.cmv : p.margem_bruta

  // ── Evolução por período (CB-only: exclui série do grupo Arla) ──
  const evoProdutos = (evo?.produtos ?? []).filter(p => !isArla(p.grupo_descricao))
  const evoMap = new Map<string, number>()
  for (const prod of evoProdutos) {
    for (const pt of prod.serie) {
      const val = metric === 'volume' ? pt.volume_litros
        : metric === 'receita' ? pt.receita_bruta
        : metric === 'cmv' ? (pt.receita_bruta - pt.margem_bruta)
        : pt.margem_bruta
      evoMap.set(pt.periodo, (evoMap.get(pt.periodo) ?? 0) + val)
    }
  }
  const evoData: FuelLinePoint[] = Array.from(evoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, value]) => ({ label: periodo.length === 10 ? fDayMonth(periodo) : fMonthShort(periodo), value }))

  // ── Spread por período (real, CB-only: margem ÷ volume por período) ──
  const spreadMap = new Map<string, { m: number; v: number }>()
  for (const prod of evoProdutos) {
    for (const pt of prod.serie) {
      const agg = spreadMap.get(pt.periodo) ?? { m: 0, v: 0 }
      agg.m += pt.margem_bruta
      agg.v += pt.volume_litros
      spreadMap.set(pt.periodo, agg)
    }
  }
  const spreadData: FuelLinePoint[] = Array.from(spreadMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, { m, v }]) => ({ label: periodo.length === 10 ? fDayMonth(periodo) : fMonthShort(periodo), value: v > 0 ? m / v : 0 }))
  const spreadFmt = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',')

  // ── Por produto (barras) ──
  const prodBars: HBarRow[] = produtos
    .map(p => ({ name: p.subgrupo_descricao, value: prodVal(p), label: fmtV(prodVal(p)) }))
    .sort((a, b) => b.value - a.value)

  // ── Por posto (barras), CB-only: subtrai Arla por location ──
  const arlaByLoc = new Map<string, { volume_litros: number; receita_bruta: number }>()
  for (const l of arlaByLocation?.locations ?? []) arlaByLoc.set(l.location_id, { volume_litros: l.volume_litros, receita_bruta: l.receita_bruta })
  const locBars: HBarRow[] = (byLocation?.locations ?? [])
    .map(l => {
      const a = arlaByLoc.get(l.location_id)
      const v = metric === 'volume' ? l.volume_litros - (a?.volume_litros ?? 0) : l.receita_bruta - (a?.receita_bruta ?? 0)
      return { name: l.location_nome, value: v, label: metric === 'volume' ? fLiters(v) : fCompact(v) }
    })
    .sort((a, b) => b.value - a.value)

  // ── Tabela por produto ──
  const prodTable = [...produtos].sort((a, b) => b.volume_litros - a.volume_litros)
  const metricLabel = METRIC_OPTS.find(m => m.value === metric)!.label

  return (
    <Page>
      <PageHeader eyebrow="Combustível" title="O combustível está saudável?" />

      {/* KPIs — uniformes (CB-only, sem Arla) */}
      <KpiGrid cols={5}>
        <KpiCard label="Volume" value={t ? fLiters(t.volume_litros) : '—'} valueTitle={t ? fInt(t.volume_litros) + ' L' : undefined} delta={pctChange(t?.volume_litros, tp?.volume_litros)} />
        <KpiCard label="Receita" value={t ? fCompact(t.receita_bruta) : '—'} valueTitle={t ? fCurrency(t.receita_bruta) : undefined} delta={pctChange(t?.receita_bruta, tp?.receita_bruta)} />
        <KpiCard label="CMV" value={t ? fCompact(t.cmv) : '—'} valueTitle={t ? fCurrency(t.cmv) : undefined} delta={pctChange(t?.cmv, tp?.cmv)} />
        <KpiCard label="Margem bruta" value={t ? fCompact(t.margem_bruta) : '—'} valueTitle={t ? fCurrency(t.margem_bruta) : undefined} delta={pctChange(t?.margem_bruta, tp?.margem_bruta)} />
        <KpiCard label="Margem" value={t ? fPct(t.margem_pct, 1) : '—'} delta={t && tp ? t.margem_pct - tp.margem_pct : undefined} deltaPP />
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
                    const spread = p.preco_medio_litro != null && p.custo_medio_litro != null ? p.preco_medio_litro - p.custo_medio_litro : null
                    return (
                      <Tr key={p.subgrupo_id}>
                        <Td first><b style={{ fontWeight: 550 }}>{p.subgrupo_descricao}</b></Td>
                        <Td right>{fLiters(p.volume_litros)}</Td>
                        <Td right>{fCompact(p.receita_bruta)}</Td>
                        <Td right><b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(p.margem_pct, 1)}</b></Td>
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

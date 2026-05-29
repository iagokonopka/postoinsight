import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { Clock } from 'lucide-react'

import { useCombustivelResumo, useCombustivelEvolucaoPorProduto, useCombustivelByLocation } from '@/hooks/useCombustivel'
import type { CombustivelProduto } from '@/hooks/useCombustivel'
import type { DrillSubgrupo, DrillProduto } from '@/hooks/useVendas'
import { useApp } from '@/context/AppContext'
import { periodLabel, periodToRange, buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'

import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationBarChart } from '@/components/charts/LocationBarChart'
import { useLocations } from '@/hooks/useLocations'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import { Tfoot, TfootTd } from '@/components/ui/Table'
import { ExpandableTable, type ExpandableColumn, BarCell } from '@/components/ui/ExpandableTable'
import { fCurrency, fInt, fPct } from '@/lib/format'
import { Sparkline } from '@/components/ui/Sparkline'

// Recharts inline for multi-series area chart
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { fDayMonth, fMonthShort } from '@/lib/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROD_COLORS = ['#0073BB', '#EC7211', '#6B40C4', '#1D8102', '#0891b2', '#db2777']

type CombMode = 'volume' | 'receita'

// ─── Segment control ─────────────────────────────────────────────────────────

function SegControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'inline-flex', padding: '3px',
      background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px',
    }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            height: '28px', padding: '0 12px', border: 'none',
            background: value === opt.value ? 'hsl(var(--card))' : 'transparent',
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
            color: value === opt.value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            borderRadius: '5px', cursor: 'pointer',
            boxShadow: value === opt.value ? 'var(--shadow-sm)' : 'none',
            transition: 'background 0.12s, color 0.12s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CombustivelPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { period, locationId, setLocationId } = useApp()
  const [mode, setMode]           = useState<CombMode>('volume')
  const [includeArla, setArla]    = useState(false)

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo, isLoading: loadingResumo } = useCombustivelResumo()
  const { data: evoData, isLoading: loadingEvo }   = useCombustivelEvolucaoPorProduto('dia')
  const { data: byLocation, isLoading: loadingByLocation } = useCombustivelByLocation()

  const t = resumo?.totais

  // ── Produtos (sem/com Arla) ──
  // Arla: grupo_descricao contém 'Arla' ou 'arla'
  const produtos = (resumo?.por_produto ?? []).filter(p =>
    includeArla ? true : !/arla/i.test(p.grupo_descricao ?? '')
  )

  const totVol = produtos.reduce((s, p) => s + p.volume_litros, 0)
  const totRec = produtos.reduce((s, p) => s + p.receita_bruta, 0)

  // ── Evolution chart — pivot por produto ──
  const evoMap = new Map<string, Record<string, number>>()
  const produtoNames: string[] = []
  const produtoIds: number[] = []

  for (const prod of evoData?.produtos ?? []) {
    const name = prod.grupo_descricao
    if (!includeArla && /arla/i.test(name)) continue
    if (!produtoNames.includes(name)) {
      produtoNames.push(name)
      produtoIds.push(prod.grupo_id)
    }
    for (const ponto of prod.serie) {
      if (!evoMap.has(ponto.periodo)) evoMap.set(ponto.periodo, {})
      const row = evoMap.get(ponto.periodo)!
      row[name] = mode === 'volume' ? ponto.volume_litros : ponto.receita_bruta
    }
  }

  const chartData = Array.from(evoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, vals]) => ({
      label: periodo.length === 10 ? fDayMonth(periodo) : fMonthShort(periodo),
      ...vals,
    }))

  const yFmt = mode === 'volume'
    ? (v: number) => (v / 1000).toFixed(1) + 'k L'
    : (v: number) => 'R$ ' + (v / 1000).toFixed(0) + 'k'

  const ttFmt = mode === 'volume'
    ? (v: number) => fInt(v) + ' L'
    : fCurrency

  // ── Donut ──
  const donutData: DonutSlice[] = produtos.slice(0, 6).map((p, i) => ({
    label: p.grupo_descricao ?? `Produto ${p.grupo_id}`,
    value: mode === 'volume' ? p.volume_litros : p.receita_bruta,
    color: PROD_COLORS[i % PROD_COLORS.length],
  }))
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)
  const donutCenter = mode === 'volume'
    ? fInt(donutTotal) + ' L'
    : fCurrency(donutTotal)

  // ── Spark series per product ──
  function sparkSeries(grupoId: number): number[] {
    const prod = evoData?.produtos.find(p => p.grupo_id === grupoId)
    if (!prod) return []
    return prod.serie.map(p => mode === 'volume' ? p.volume_litros : p.receita_bruta)
  }

  const evoDesc = `${mode === 'volume' ? 'Volume' : 'Receita'} por produto · ${periodLabel(period).toLowerCase()}`

  // ── Base params helper (imperative) ────────────────────────────────────────
  function getBaseParams() {
    const { data_inicio, data_fim } = periodToRange(period)
    return { data_inicio, data_fim, location_id: locationId ?? undefined }
  }

  // ── Fetch subgrupos for a grupo (level 1) ──────────────────────────────────
  const fetchSubgrupos = async (grupo: CombustivelProduto): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, grupo_id: String(grupo.grupo_id), segmento: 'combustivel' })
    const data = await queryClient.fetchQuery<{ segmento: string; grupo_id: number; subgrupos: DrillSubgrupo[] }>({
      queryKey: ['vendas', 'drill', 'subgrupos', params, grupo.grupo_id, 'combustivel'],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/vendas/drill/subgrupos${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgrupos
  }

  // ── Fetch produtos for a subgrupo (level 2 — leaves) ─────────────────────
  const fetchProdutos = async (sub: DrillSubgrupo): Promise<DrillProduto[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, subgrupo_id: String(sub.subgrupo_id) })
    const data = await queryClient.fetchQuery<{ subgrupo_id: number; produtos: DrillProduto[] }>({
      queryKey: ['vendas', 'drill', 'produtos', params, sub.subgrupo_id],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/vendas/drill/produtos${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.produtos
  }

  // ── Column definitions ────────────────────────────────────────────────────

  const recMax = produtos[0]?.receita_bruta ?? 1

  // L0 — combustível grupo columns
  const grupoColumns: ExpandableColumn<CombustivelProduto>[] = [
    {
      key: 'grupo_descricao',
      header: 'Produto',
      first: true,
      render: (p) => p.grupo_descricao ?? `Produto ${p.grupo_id}`,
    },
    { key: 'volume_litros',       header: 'Volume (L)', right: true, render: (p) => fInt(p.volume_litros) },
    { key: 'participacao_volume', header: 'Part.%',     right: true, render: (p) => fPct(p.participacao_volume_pct, 1) },
    { key: 'receita_bruta',       header: 'Receita',    right: true, render: (p) => fCurrency(p.receita_bruta) },
    {
      key: 'margem_pct',
      header: 'Margem %',
      right: true,
      render: (p) => (
        <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(p.margem_pct, 1)}
        </b>
      ),
    },
    {
      key: 'preco_medio_litro',
      header: 'Preço/L',
      right: true,
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.preco_medio_litro != null ? p.preco_medio_litro.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
    },
    {
      key: 'custo_medio_litro',
      header: 'Custo/L',
      right: true,
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.custo_medio_litro != null ? p.custo_medio_litro.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
    },
    {
      key: 'tendencia',
      header: 'Tendência',
      right: true,
      last: true,
      render: (p) => {
        const spark = sparkSeries(p.grupo_id)
        const trend = spark.length >= 2
          ? (spark[spark.length - 1] - spark[0]) / Math.max(spark[0], 1)
          : 0
        const trendColor = trend > 0.02 ? '#16a34a' : trend < -0.02 ? '#dc2626' : '#64748b'
        const trendArrow = trend > 0.02 ? '↑' : trend < -0.02 ? '↓' : '→'
        const trendPct   = (Math.abs(trend) * 100).toFixed(1).replace('.', ',') + '%'
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
            {spark.length >= 2 && (
              <div style={{ width: '72px', height: '22px', flexShrink: 0 }}>
                <Sparkline data={spark} color={trendColor} width="100%" height="100%" />
              </div>
            )}
            <span style={{ fontSize: '11px', fontWeight: 600, color: trendColor, minWidth: '42px', textAlign: 'right' }}>
              {trendArrow} {trendPct}
            </span>
          </div>
        )
      },
    },
  ]

  // L1 — subgrupo columns
  const subgrupoColumns: ExpandableColumn<DrillSubgrupo>[] = [
    {
      key: 'subgrupo_descricao',
      header: 'Subgrupo',
      first: true,
      render: (row) => row.subgrupo_descricao,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.receita_bruta}
          max={recMax}
          label={fPct(row.participacao_pct, 1)}
        />
      ),
    },
    { key: 'qtd_itens',     header: 'Qtd',         right: true, render: (row) => fInt(row.qtd_itens) },
    { key: 'receita_bruta', header: 'Receita',      right: true, render: (row) => fCurrency(row.receita_bruta) },
    { key: 'cmv',           header: 'CMV',          right: true, render: (row) => fCurrency(row.cmv) },
    { key: 'margem_bruta',  header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.margem_bruta) },
    {
      key: 'margem_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margem_pct, 1)}
        </b>
      ),
    },
  ]

  // L2 — produto columns (leaves)
  const produtoColumns: ExpandableColumn<DrillProduto>[] = [
    {
      key: 'descricao_produto',
      header: 'Produto',
      first: true,
      render: (row) => row.descricao_produto,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.receita_bruta}
          max={recMax}
          label={fPct(row.participacao_pct, 1)}
        />
      ),
    },
    { key: 'qtd_venda',     header: 'Qtd',         right: true, render: (row) => fInt(row.qtd_venda) },
    { key: 'receita_bruta', header: 'Receita',      right: true, render: (row) => fCurrency(row.receita_bruta) },
    { key: 'cmv',           header: 'CMV',          right: true, render: (row) => fCurrency(row.cmv) },
    { key: 'margem_bruta',  header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.margem_bruta) },
    {
      key: 'margem_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margem_pct, 1)}
        </b>
      ),
    },
  ]

  return (
    <Page>
      <PageHeader
        title="Combustível"
        subtitle="Volumes, receitas e margens por produto."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <SegControl
              options={[{ value: 'volume', label: 'Volume' }, { value: 'receita', label: 'Receita' }]}
              value={mode}
              onChange={setMode}
            />
            <SegControl
              options={[{ value: 'false', label: 'Sem Arla 32' }, { value: 'true', label: 'Com Arla 32' }]}
              value={String(includeArla)}
              onChange={v => setArla(v === 'true')}
            />
          </div>
        }
      />

      {/* KPIs */}
      <KpiGrid cols={5}>
        <KpiCard
          label="Volume Total"
          value={t ? fInt(t.volume_litros) + ' L' : '—'}
          sparkColor="#0073BB"
        />
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkColor="#0073BB"
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cmv) : '—'}
          sparkColor="#dc2626"
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.margem_bruta) : '—'}
          sparkColor="#16a34a"
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(t.margem_pct, 2) : '—'}
          deltaPP
          sparkColor="#0073BB"
        />
      </KpiGrid>

      {/* Evolução + Donut [+ Por Unidade quando multi-location] */}
      <Row style={{ gridTemplateColumns: showComparison ? '3fr 2fr 2fr' : '3fr 2fr' }}>
        <Card>
          <CardHeader title="Evolução por produto" description={evoDesc} />
          <CardBody>
            <ChartBox size="tall">
              {loadingEvo
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhum registro no período." />
                  : <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                          {produtoNames.map((_, i) => (
                            <linearGradient key={i} id={`cg${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor={PROD_COLORS[i % PROD_COLORS.length]} stopOpacity={0.5} />
                              <stop offset="100%" stopColor={PROD_COLORS[i % PROD_COLORS.length]} stopOpacity={0.05} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tickFormatter={yFmt} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
                        <Tooltip content={<ChartTooltip formatter={ttFmt} />} />
                        <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} iconType="circle" iconSize={8} />
                        {produtoNames.map((name, i) => (
                          <Area
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={PROD_COLORS[i % PROD_COLORS.length]}
                            fill={`url(#cg${i})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mix de Combustível" />
          <CardBody>
            {loadingResumo
              ? <LoadingBox />
              : <DonutChart
                  data={donutData}
                  centerLabel="Total"
                  centerValue={donutCenter}
                  tooltipFormatter={mode === 'volume' ? v => fInt(v) + ' L' : fCurrency}
                />
            }
          </CardBody>
        </Card>

        {showComparison && (
          <LocationBarChart
            locations={byLocation?.locations}
            loading={loadingByLocation}
            onLocationClick={(id) => setLocationId(id === locationId ? null : id)}
            selectedLocationId={locationId}
          />
        )}
      </Row>

      {/* Breakdown + Ranking bicos */}
      <Row variant="2-1">
        <Card>
          <CardHeader title="Breakdown por produto" />
          {loadingResumo
            ? <CardBody><LoadingBox /></CardBody>
            : <ExpandableTable<CombustivelProduto, DrillSubgrupo, DrillProduto>
                columns={grupoColumns}
                rows={produtos}
                rowKey="grupo_id"
                rowColor={(_row, i) => PROD_COLORS[i % PROD_COLORS.length]}
                getChildren={fetchSubgrupos}
                childColumns={subgrupoColumns}
                childRowKey="subgrupo_id"
                getGrandchildren={fetchProdutos}
                grandchildColumns={produtoColumns}
                grandchildRowKey="source_produto_id"
                onGrandchildClick={(gc) => navigate(`/produto/${encodeURIComponent(gc.source_produto_id)}`)}
                footer={
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd right>{fInt(totVol)}</TfootTd>
                    <TfootTd right>100%</TfootTd>
                    <TfootTd right>{fCurrency(totRec)}</TfootTd>
                    <TfootTd right>
                      <b>{t ? fPct(t.margem_pct, 1) : '—'}</b>
                    </TfootTd>
                    <TfootTd right last colSpan={3} />
                  </Tfoot>
                }
              />
          }
        </Card>

        <Card>
          <CardHeader title="Ranking de Bicos" />
          <CardBody>
            <EmptyState
              icon={<Clock size={20} />}
              title="Disponível em breve"
              description="Vai destacar bombistas com performance acima e abaixo da média da rede."
            />
          </CardBody>
        </Card>
      </Row>
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

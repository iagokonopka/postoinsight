import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useConvResumo, useConvEvolucao, useConvCategorias, useConvenienciaByLocation } from '@/hooks/useConveniencia'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationBarChart } from '@/components/charts/LocationBarChart'
import { useLocations } from '@/hooks/useLocations'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import { ScatterQuadrants, type ScatterPoint } from '@/components/charts/ScatterQuadrants'
import { Tfoot, TfootTd } from '@/components/ui/Table'
import {
  ExpandableTable,
  type ExpandableColumn,
  BarCell,
} from '@/components/ui/ExpandableTable'
import { fCurrency, fInt, fPct, fDayMonth } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'
import { useApp } from '@/context/AppContext'
import { periodToRange, buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'
import type { ConvCategoria, ConvGrupo } from '@/hooks/useConveniencia'
import type { DrillSubgrupo, DrillProduto } from '@/hooks/useVendas'

// ─── Paleta de categorias ─────────────────────────────────────────────────────

const CAT_COLORS = [
  CHART_COLORS.conveniencia,
  CHART_COLORS.s2,
  CHART_COLORS.lubrificantes,
  CHART_COLORS.arla,
  CHART_COLORS.servicos,
  CHART_COLORS.s6,
  '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
]

// ─── Segment control ─────────────────────────────────────────────────────────

type ConvView = 'conveniencia' | 'servicos' | 'lubrificantes'

const VIEW_OPTIONS = [
  { value: 'conveniencia'  as ConvView, label: 'Conveniência' },
  { value: 'servicos'      as ConvView, label: 'Serviços' },
  { value: 'lubrificantes' as ConvView, label: 'Lubrificantes' },
]

const VIEW_COLOR: Record<ConvView, string> = {
  conveniencia:  CHART_COLORS.conveniencia,
  servicos:      CHART_COLORS.servicos,
  lubrificantes: CHART_COLORS.lubrificantes,
}

const VIEW_LABEL: Record<ConvView, string> = {
  conveniencia:  'Receita Conveniência',
  servicos:      'Receita Serviços',
  lubrificantes: 'Receita Lubrificantes',
}

function SegControl({ value, onChange }: { value: ConvView; onChange: (v: ConvView) => void }) {
  return (
    <div style={{ display: 'inline-flex', padding: '3px', background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px' }}>
      {VIEW_OPTIONS.map(opt => (
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

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ConvenienciaPage() {
  const navigate = useNavigate()
  const { period, locationId, setLocationId } = useApp()
  const queryClient = useQueryClient()

  const [view, setView] = useState<ConvView>('conveniencia')

  const accentColor = VIEW_COLOR[view]

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo } = useConvResumo()
  const { data: evo,  isLoading: loadingE } = useConvEvolucao(view, 'day')
  const { data: cats, isLoading: loadingC } = useConvCategorias(view)
  const { data: byLocation, isLoading: loadingByLocation } = useConvenienciaByLocation(view)

  const t = resumo?.totals
  const categorias = cats?.categories ?? []
  const recMax = categorias[0]?.gross_revenue ?? 1

  // ── Base params helper (imperative — not a hook) ──────────────────────────
  function getBaseParams() {
    const { start_date, end_date } = periodToRange(period)
    return { start_date, end_date, location_id: locationId ?? undefined }
  }

  // ── Imperative fetch for grupos (level 2) ─────────────────────────────────
  const fetchGrupos = async (cat: ConvCategoria): Promise<ConvGrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, category_code: cat.category_code })
    const data = await queryClient.fetchQuery<{ groups: ConvGrupo[] }>({
      queryKey: ['convenience', 'groups', params, cat.category_code],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/convenience/groups${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.groups
  }

  // ── Imperative fetch for subgrupos (level 3) ──────────────────────────────
  const fetchSubgrupos = async (grupo: ConvGrupo): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, group_id: String(grupo.group_id), segment: view })
    const data = await queryClient.fetchQuery<{ segment: string; group_id: number; subgroups: DrillSubgrupo[] }>({
      queryKey: ['sales', 'drill', 'subgroups', params, grupo.group_id, view],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/sales/drill/subgroups${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgroups
  }

  // ── Imperative fetch for produtos (level 4 — leaves) ─────────────────────
  const fetchProdutos = async (sub: DrillSubgrupo): Promise<DrillProduto[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, subgroup_id: String(sub.subgroup_id) })
    const data = await queryClient.fetchQuery<{ subgroup_id: number; products: DrillProduto[] }>({
      queryKey: ['sales', 'drill', 'products', params, sub.subgroup_id],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/sales/drill/products${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.products
  }

  // ── Column definitions ────────────────────────────────────────────────────

  const catColumns: ExpandableColumn<ConvCategoria>[] = [
    {
      key: 'category_name',
      header: 'Categoria',
      first: true,
      render: (row) => row.category_name ?? row.category_code,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.gross_revenue}
          max={recMax}
          label={fPct(row.share_pct, 1)}
        />
      ),
    },
    { key: 'total_quantity', header: 'Qtd',          right: true, render: (row) => fInt(row.total_quantity) },
    { key: 'gross_revenue',  header: 'Receita',       right: true, render: (row) => fCurrency(row.gross_revenue) },
    { key: 'cogs',           header: 'CMV',           right: true, render: (row) => fCurrency(row.cogs) },
    { key: 'gross_margin',   header: 'Margem Bruta',  right: true, render: (row) => fCurrency(row.gross_margin) },
    {
      key: 'margin_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margin_pct, 1)}
        </b>
      ),
    },
  ]

  // Child columns (grupos): same shape minus the color dot — we reuse catColumns definition
  const grupoColumns: ExpandableColumn<ConvGrupo>[] = [
    {
      key: 'group_name',
      header: 'Grupo',
      first: true,
      render: (row) => row.group_name ?? `Grupo ${row.group_id}`,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.gross_revenue}
          max={recMax}
          label={fPct(row.share_pct, 1)}
        />
      ),
    },
    { key: 'qtd',           header: 'Qtd',         right: true, render: () => '—' },
    { key: 'gross_revenue', header: 'Receita',      right: true, render: (row) => fCurrency(row.gross_revenue) },
    { key: 'cogs',          header: 'CMV',          right: true, render: (row) => fCurrency(row.cogs) },
    { key: 'gross_margin',  header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.gross_margin) },
    {
      key: 'margin_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margin_pct, 1)}
        </b>
      ),
    },
  ]

  const subgrupoColumns: ExpandableColumn<DrillSubgrupo>[] = [
    {
      key: 'subgroup_name',
      header: 'Subgrupo',
      first: true,
      render: (row) => row.subgroup_name,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.gross_revenue}
          max={recMax}
          label={fPct(row.share_pct, 1)}
        />
      ),
    },
    { key: 'item_count',    header: 'Qtd',         right: true, render: (row) => fInt(row.item_count) },
    { key: 'gross_revenue', header: 'Receita',      right: true, render: (row) => fCurrency(row.gross_revenue) },
    { key: 'cogs',          header: 'CMV',          right: true, render: (row) => fCurrency(row.cogs) },
    { key: 'gross_margin',  header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.gross_margin) },
    {
      key: 'margin_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margin_pct, 1)}
        </b>
      ),
    },
  ]

  const produtoColumns: ExpandableColumn<DrillProduto>[] = [
    {
      key: 'product_name',
      header: 'Produto',
      first: true,
      render: (row) => row.product_name,
    },
    {
      key: 'peso',
      header: 'Peso',
      render: (row) => (
        <BarCell
          value={row.gross_revenue}
          max={recMax}
          label={fPct(row.share_pct, 1)}
        />
      ),
    },
    { key: 'quantity',      header: 'Qtd',         right: true, render: (row) => fInt(row.quantity) },
    { key: 'gross_revenue', header: 'Receita',      right: true, render: (row) => fCurrency(row.gross_revenue) },
    { key: 'cogs',          header: 'CMV',          right: true, render: (row) => fCurrency(row.cogs) },
    { key: 'gross_margin',  header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.gross_margin) },
    {
      key: 'margin_pct',
      header: 'Margem %',
      right: true,
      last: true,
      render: (row) => (
        <b style={{ color: row.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(row.margin_pct, 1)}
        </b>
      ),
    },
  ]

  // ── Chart data ────────────────────────────────────────────────────────────

  const chartData = (evo?.series ?? []).map(p => ({
    label:       p.period.length === 10 ? fDayMonth(p.period) : p.period,
    receita:     p.gross_revenue,
    margemBruta: p.gross_margin,
  }))

  const donutData: DonutSlice[] = categorias.slice(0, 8).map((c, i) => ({
    label: c.category_name ?? c.category_code,
    value: c.gross_revenue,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  const scatterData: ScatterPoint[] = categorias.map((c, i) => ({
    name:    c.category_name ?? c.category_code,
    qtd:     c.total_quantity,
    margem:  c.margin_pct,
    receita: c.gross_revenue,
    color:   CAT_COLORS[i % CAT_COLORS.length],
  }))

  const sparkRec = evo?.series.map(p => p.gross_revenue) ?? []
  const sparkMg  = evo?.series.map(p => p.gross_margin) ?? []

  return (
    <Page>
      <PageHeader
        title="Conveniência & Serviços"
        subtitle="Loja, lubrificantes e serviços — período selecionado."
        actions={<SegControl value={view} onChange={setView} />}
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label={VIEW_LABEL[view]}
          value={t ? fCurrency(t.gross_revenue) : '—'}
          sparkData={sparkRec}
          sparkColor={accentColor}
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.gross_margin) : '—'}
          sparkData={sparkMg}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(t.margin_pct, 2) : '—'}
          deltaPP
          sparkData={[]}
          sparkColor={accentColor}
        />
        <KpiCard
          label="Ticket Médio"
          value={t?.avg_ticket != null ? fCurrency(t.avg_ticket) : '—'}
          sparkColor={accentColor}
        />
      </KpiGrid>

      {/* Evolução + Donut [+ Por Unidade quando multi-location] */}
      <Row style={{ gridTemplateColumns: showComparison ? '3fr 2fr 2fr' : '3fr 2fr' }}>
        <Card>
          <CardHeader title="Receita × Margem Bruta" />
          <CardBody>
            <ChartBox>
              {loadingE
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhuma venda no período." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      series={[
                        { key: 'receita',     label: 'Receita',      color: accentColor,       type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,  type: 'area', yAxisId: 'left' },
                      ]}
                      tooltipFormatter={fCurrency}
                    />
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mix da Loja" />
          <CardBody>
            {loadingC
              ? <LoadingBox />
              : <DonutChart
                  data={donutData}
                  centerLabel="Total"
                  centerValue={fCurrency(donutData.reduce((s, d) => s + d.value, 0))}
                  tooltipFormatter={fCurrency}
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

      {/* Scatter */}
      <Card>
        <CardHeader
          title="Matriz de Categorias"
          description="Quadrantes: Qtd vendida × Margem % — tamanho da bolha = receita"
        />
        <CardBody>
          <ChartBox size="tall">
            {loadingC
              ? <LoadingBox />
              : scatterData.length === 0
                ? <EmptyState title="Sem dados" description="Nenhuma categoria no período." />
                : <ScatterQuadrants data={scatterData} />
            }
          </ChartBox>
        </CardBody>
      </Card>

      {/* Tabela expandável de categorias → grupos → subgrupos → produtos */}
      <Card>
        <CardHeader title="Breakdown por categoria" />
        {loadingC
          ? <CardBody><LoadingBox /></CardBody>
          : categorias.length === 0
            ? <CardBody><EmptyState title="Sem dados" /></CardBody>
            : <ExpandableTable<ConvCategoria, ConvGrupo, DrillSubgrupo, DrillProduto>
                key={view}
                columns={catColumns}
                rows={categorias}
                rowKey="category_code"
                rowColor={(_row, i) => CAT_COLORS[i % CAT_COLORS.length]}
                getChildren={fetchGrupos}
                childColumns={grupoColumns}
                childRowKey="group_id"
                getGrandchildren={fetchSubgrupos}
                grandchildColumns={subgrupoColumns}
                grandchildRowKey="subgroup_id"
                getLeaves={fetchProdutos}
                leafColumns={produtoColumns}
                leafRowKey="source_product_id"
                onLeafClick={(leaf) => navigate(`/produto/${encodeURIComponent(leaf.source_product_id)}`)}
                footer={
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd />
                    <TfootTd right>{t ? fInt(t.item_count) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.gross_revenue) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cogs) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.gross_margin) : '—'}</TfootTd>
                    <TfootTd right last><b>{t ? fPct(t.margin_pct, 1) : '—'}</b></TfootTd>
                  </Tfoot>
                }
              />
        }
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

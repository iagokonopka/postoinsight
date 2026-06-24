import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLubrificantesResumo, useLubrificantesEvolucao, useLubrificantesByLocation } from '@/hooks/useLubrificantes'
import { useConvCategorias } from '@/hooks/useConveniencia'
import type { ConvCategoria, ConvGrupo } from '@/hooks/useConveniencia'
import type { DrillSubgrupo, DrillProduto } from '@/hooks/useVendas'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationBarChart } from '@/components/charts/LocationBarChart'
import { useLocations } from '@/hooks/useLocations'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { CHART_COLORS } from '@/lib/chart-colors'
import { fCurrency, fInt, fPct, fDayMonth } from '@/lib/format'
import { useApp } from '@/context/AppContext'
import { periodToRange, buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'
import { Tfoot, TfootTd } from '@/components/ui/Table'
import {
  ExpandableTable,
  type ExpandableColumn,
  BarCell,
} from '@/components/ui/ExpandableTable'

// ─── Color palette ────────────────────────────────────────────────────────────

const LUB_COLORS = [
  CHART_COLORS.lubrificantes,
  CHART_COLORS.s2,
  CHART_COLORS.conveniencia,
  '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#0ea5e9',
]

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function LubrificantesPage() {
  const navigate = useNavigate()
  const { period, locationId, setLocationId } = useApp()
  const queryClient = useQueryClient()

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo } = useLubrificantesResumo()
  const { data: evo,        isLoading: loadingE }          = useLubrificantesEvolucao('day')
  const { data: cats,       isLoading: loadingC }          = useConvCategorias('lubrificantes')
  const { data: byLocation, isLoading: loadingByLocation } = useLubrificantesByLocation()

  const t      = resumo?.totals
  const recMax = cats?.categories[0]?.gross_revenue ?? 1

  const chartData = (evo?.series ?? []).map(p => ({
    label:       p.period.length === 10 ? fDayMonth(p.period) : p.period,
    receita:     p.gross_revenue,
    margemBruta: p.gross_margin,
  }))

  const sparkRec = evo?.series.map(p => p.gross_revenue) ?? []
  const sparkMg  = evo?.series.map(p => p.gross_margin) ?? []

  // ── Base params helper (imperative) ────────────────────────────────────────
  function getBaseParams() {
    const { start_date, end_date } = periodToRange(period)
    return { start_date, end_date, location_id: locationId ?? undefined }
  }

  // ── Fetch grupos for a categoria (level 1) ─────────────────────────────────
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

  // ── Fetch subgrupos for a grupo (level 2) ──────────────────────────────────
  const fetchSubgrupos = async (grupo: ConvGrupo): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, group_id: String(grupo.group_id), segment: 'lubrificantes' })
    const data = await queryClient.fetchQuery<{ segment: string; group_id: number; subgroups: DrillSubgrupo[] }>({
      queryKey: ['sales', 'drill', 'subgroups', params, grupo.group_id, 'lubrificantes'],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/sales/drill/subgroups${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgroups
  }

  // ── Fetch produtos for a subgrupo (level 3 — leaves) ─────────────────────
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
    { key: 'total_quantity', header: 'Qtd',         right: true, render: (row) => fInt(row.total_quantity) },
    { key: 'gross_revenue',  header: 'Receita',      right: true, render: (row) => fCurrency(row.gross_revenue) },
    { key: 'cogs',           header: 'CMV',          right: true, render: (row) => fCurrency(row.cogs) },
    { key: 'gross_margin',   header: 'Margem Bruta', right: true, render: (row) => fCurrency(row.gross_margin) },
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

  return (
    <Page>
      <PageHeader
        title="Lubrificantes"
        subtitle="Receita, margem e grupos de lubrificantes — período selecionado."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.gross_revenue) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.lubrificantes}
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cogs) : '—'}
          sparkColor={CHART_COLORS.neg}
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
          sparkData={evo?.series.map(p => (p.gross_revenue > 0 ? (p.gross_margin / p.gross_revenue) * 100 : 0)) ?? []}
          sparkColor={CHART_COLORS.lubrificantes}
        />
      </KpiGrid>

      {/* Evolução [+ Por Unidade quando multi-location] */}
      <Row style={{ gridTemplateColumns: showComparison ? '3fr 2fr' : '1fr' }}>
        <Card>
          <CardHeader title="Evolução — Receita & Margem" description="Lubrificantes · período selecionado" />
          <CardBody>
            <ChartBox>
              {loadingE
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhum registro de lubrificantes no período." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      series={[
                        { key: 'receita',     label: 'Receita',      color: CHART_COLORS.lubrificantes, type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,           type: 'area', yAxisId: 'left' },
                      ]}
                      tooltipFormatter={fCurrency}
                    />
              }
            </ChartBox>
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

      {/* Tabela expandável categoria → grupos → subgrupos → produtos */}
      <Card>
        <CardHeader title="Breakdown por categoria" />
        {loadingC
          ? <CardBody><LoadingBox /></CardBody>
          : (cats?.categories ?? []).length === 0
            ? <CardBody><EmptyState title="Sem dados" description="Nenhuma categoria de lubrificantes no período." /></CardBody>
            : <ExpandableTable<ConvCategoria, ConvGrupo, DrillSubgrupo, DrillProduto>
                columns={catColumns}
                rows={cats?.categories ?? []}
                rowKey="category_code"
                rowColor={(_r, i) => LUB_COLORS[i % LUB_COLORS.length]}
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

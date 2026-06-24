import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useArlaResumo, useArlaEvolucao, useArlaByLocation } from '@/hooks/useArla'
import type { ArlaProduto } from '@/hooks/useArla'
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
import { fCurrency, fInt, fPct, fLiters, fDayMonth } from '@/lib/format'
import { useApp } from '@/context/AppContext'
import { periodToRange, buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'
import { Tfoot, TfootTd } from '@/components/ui/Table'
import { ExpandableTable, type ExpandableColumn, BarCell } from '@/components/ui/ExpandableTable'

export default function ArlaPage() {
  const navigate = useNavigate()
  const { period, locationId, setLocationId } = useApp()
  const queryClient = useQueryClient()

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo, isLoading: loadingR } = useArlaResumo()
  const { data: byLocation, isLoading: loadingByLocation } = useArlaByLocation()
  const { data: evo,    isLoading: loadingE } = useArlaEvolucao('day')

  const t = resumo?.totals
  const produtos = resumo?.by_product ?? []
  const recMax = produtos[0]?.gross_revenue ?? 1

  // Chart data
  const chartData = (evo?.series ?? []).map(p => ({
    label:       p.period.length === 10 ? fDayMonth(p.period) : p.period,
    volume:      p.volume_liters,
    receita:     p.gross_revenue,
    margemBruta: p.gross_margin,
  }))

  // Spark from evolução
  const sparkVol = evo?.series.map(p => p.volume_liters) ?? []
  const sparkRec = evo?.series.map(p => p.gross_revenue) ?? []
  const sparkMg  = evo?.series.map(p => p.gross_margin) ?? []

  // ── Base params helper (imperative) ────────────────────────────────────────
  function getBaseParams() {
    const { start_date, end_date } = periodToRange(period)
    return { start_date, end_date, location_id: locationId ?? undefined }
  }

  // ── Fetch subgrupos for a grupo (level 1) ──────────────────────────────────
  const fetchSubgrupos = async (grupo: ArlaProduto): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, group_id: String(grupo.group_id), segment: 'combustivel' })
    const data = await queryClient.fetchQuery<{ segment: string; group_id: number; subgroups: DrillSubgrupo[] }>({
      queryKey: ['sales', 'drill', 'subgroups', params, grupo.group_id, 'combustivel'],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/sales/drill/subgroups${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgroups
  }

  // ── Fetch produtos for a subgrupo (level 2 — leaves) ─────────────────────
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

  // L0 — Arla-specific columns (keep volume, preco/L, custo/L)
  const arlaColumns: ExpandableColumn<ArlaProduto>[] = [
    {
      key: 'group_name',
      header: 'Produto',
      first: true,
      render: (p) => p.group_name ?? `Produto ${p.group_id}`,
    },
    { key: 'volume_liters',     header: 'Volume (L)',    right: true, render: (p) => fInt(p.volume_liters) },
    { key: 'volume_share_pct',  header: 'Part.%',        right: true, render: (p) => fPct(p.volume_share_pct, 1) },
    { key: 'gross_revenue',     header: 'Receita',       right: true, render: (p) => fCurrency(p.gross_revenue) },
    { key: 'cogs',              header: 'CMV',           right: true, render: (p) => fCurrency(p.cogs) },
    { key: 'gross_margin',      header: 'Margem Bruta',  right: true, render: (p) => fCurrency(p.gross_margin) },
    {
      key: 'margin_pct',
      header: 'Margem %',
      right: true,
      render: (p) => (
        <b style={{ color: p.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
          {fPct(p.margin_pct, 1)}
        </b>
      ),
    },
    {
      key: 'avg_price_liter',
      header: 'Preço/L',
      right: true,
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.avg_price_liter != null ? p.avg_price_liter.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
    },
    {
      key: 'avg_cost_liter',
      header: 'Custo/L',
      right: true,
      last: true,
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.avg_cost_liter != null ? p.avg_cost_liter.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
    },
  ]

  // L1 — subgrupo columns
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

  // L2 — produto columns (leaves)
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
        title="Arla 32"
        subtitle="Volume, receita e margem do fluido Arla 32."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Volume Total"
          value={t ? fLiters(t.volume_liters) : '—'}
          sparkData={sparkVol}
          sparkColor={CHART_COLORS.arla}
        />
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.gross_revenue) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.arla}
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
          sparkColor={CHART_COLORS.arla}
        />
      </KpiGrid>

      {/* Evolução [+ Por Unidade quando multi-location] */}
      <Row style={{ gridTemplateColumns: showComparison ? '3fr 2fr' : '1fr' }}>
        <Card>
          <CardHeader title="Evolução — Volume & Receita" description="Arla 32 · período selecionado" />
          <CardBody>
            <ChartBox>
              {loadingE
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhum registro de Arla 32 no período." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      series={[
                        { key: 'receita',     label: 'Receita',      color: CHART_COLORS.arla, type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,  type: 'area', yAxisId: 'left' },
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

      {/* Tabela expandável grupo → subgrupo → produto */}
      <Card>
        <CardHeader title="Breakdown por produto" />
        {loadingR
          ? <CardBody><LoadingBox /></CardBody>
          : produtos.length === 0
            ? <CardBody><EmptyState title="Sem dados" description="Nenhum produto Arla 32 no período." /></CardBody>
            : <ExpandableTable<ArlaProduto, DrillSubgrupo, DrillProduto>
                columns={arlaColumns}
                rows={produtos}
                rowKey="group_id"
                rowColor={() => CHART_COLORS.arla}
                getChildren={fetchSubgrupos}
                childColumns={subgrupoColumns}
                childRowKey="subgroup_id"
                getGrandchildren={fetchProdutos}
                grandchildColumns={produtoColumns}
                grandchildRowKey="source_product_id"
                onGrandchildClick={(gc) => navigate('/produto/' + encodeURIComponent(gc.source_product_id))}
                footer={
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd right>{t ? fInt(t.volume_liters) : '—'}</TfootTd>
                    <TfootTd right>100%</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.gross_revenue) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cogs) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.gross_margin) : '—'}</TfootTd>
                    <TfootTd right><b>{t ? fPct(t.margin_pct, 1) : '—'}</b></TfootTd>
                    <TfootTd right last colSpan={2} />
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

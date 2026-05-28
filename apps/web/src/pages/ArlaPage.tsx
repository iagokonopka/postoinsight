import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useArlaResumo, useArlaEvolucao, useArlaByLocation } from '@/hooks/useArla'
import type { ArlaProduto } from '@/hooks/useArla'
import type { DrillSubgrupo, DrillProduto } from '@/hooks/useVendas'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid} from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationComparisonPanel } from '@/components/LocationComparisonPanel'
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
  const { period, locationId } = useApp()
  const queryClient = useQueryClient()

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo, isLoading: loadingR } = useArlaResumo()
  const { data: byLocation, isLoading: loadingByLocation } = useArlaByLocation()
  const { data: evo,    isLoading: loadingE } = useArlaEvolucao('dia')

  const t = resumo?.totais
  const produtos = resumo?.por_produto ?? []
  const recMax = produtos[0]?.receita_bruta ?? 1

  // Chart data
  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    volume:      p.volume_litros,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  // Spark from evolução
  const sparkVol = evo?.serie.map(p => p.volume_litros) ?? []
  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

  // ── Base params helper (imperative) ────────────────────────────────────────
  function getBaseParams() {
    const { data_inicio, data_fim } = periodToRange(period)
    return { data_inicio, data_fim, location_id: locationId ?? undefined }
  }

  // ── Fetch subgrupos for a grupo (level 1) ──────────────────────────────────
  const fetchSubgrupos = async (grupo: ArlaProduto): Promise<DrillSubgrupo[]> => {
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

  // L0 — Arla-specific columns (keep volume, preco/L, custo/L)
  const arlaColumns: ExpandableColumn<ArlaProduto>[] = [
    {
      key: 'grupo_descricao',
      header: 'Produto',
      first: true,
      render: (p) => p.grupo_descricao ?? `Produto ${p.grupo_id}`,
    },
    { key: 'volume_litros',           header: 'Volume (L)',    right: true, render: (p) => fInt(p.volume_litros) },
    { key: 'participacao_volume_pct', header: 'Part.%',        right: true, render: (p) => fPct(p.participacao_volume_pct, 1) },
    { key: 'receita_bruta',           header: 'Receita',       right: true, render: (p) => fCurrency(p.receita_bruta) },
    { key: 'cmv',                     header: 'CMV',           right: true, render: (p) => fCurrency(p.cmv) },
    { key: 'margem_bruta',            header: 'Margem Bruta',  right: true, render: (p) => fCurrency(p.margem_bruta) },
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
      last: true,
      render: (p) => (
        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
          {p.custo_medio_litro != null ? p.custo_medio_litro.toFixed(2).replace('.', ',') : '—'}
        </span>
      ),
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
        title="Arla 32"
        subtitle="Volume, receita e margem do fluido Arla 32."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Volume Total"
          value={t ? fLiters(t.volume_litros) : '—'}
          sparkData={sparkVol}
          sparkColor={CHART_COLORS.arla}
        />
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.arla}
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.margem_bruta) : '—'}
          sparkData={sparkMg}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(t.margem_pct, 2) : '—'}
          deltaPP
          sparkData={evo?.serie.map(p => p.margem_pct) ?? []}
          sparkColor={CHART_COLORS.arla}
        />
      </KpiGrid>

      {/* Evolução */}
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
                rowKey="grupo_id"
                rowColor={() => CHART_COLORS.arla}
                getChildren={fetchSubgrupos}
                childColumns={subgrupoColumns}
                childRowKey="subgrupo_id"
                getGrandchildren={fetchProdutos}
                grandchildColumns={produtoColumns}
                grandchildRowKey="source_produto_id"
                onGrandchildClick={(gc) => navigate('/produto/' + encodeURIComponent(gc.source_produto_id))}
                footer={
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd right>{t ? fInt(t.volume_litros) : '—'}</TfootTd>
                    <TfootTd right>100%</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.receita_bruta) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cmv) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.margem_bruta) : '—'}</TfootTd>
                    <TfootTd right><b>{t ? fPct(t.margem_pct, 1) : '—'}</b></TfootTd>
                    <TfootTd right last colSpan={2} />
                  </Tfoot>
                }
              />
        }
      </Card>

      {/* Comparativo de Unidades */}
      {showComparison && (
        <LocationComparisonPanel
          locations={byLocation?.locations}
          loading={loadingByLocation}
          description="Receita de Arla 32 por unidade no período selecionado"
          secondaryMetric={{ key: 'volume_litros', label: 'Volume (L)', format: (v) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} L` }}
        />
      )}
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
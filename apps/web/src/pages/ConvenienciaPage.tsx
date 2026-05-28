import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useConvResumo, useConvEvolucao, useConvCategorias, useConvenienciaByLocation } from '@/hooks/useConveniencia'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationComparisonPanel } from '@/components/LocationComparisonPanel'
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
  const { period, locationId } = useApp()
  const queryClient = useQueryClient()

  const [view, setView] = useState<ConvView>('conveniencia')

  const accentColor = VIEW_COLOR[view]

  const { data: allLocations } = useLocations()
  const showComparison = locationId === null && (allLocations?.length ?? 0) > 1

  const { data: resumo } = useConvResumo()
  const { data: evo,  isLoading: loadingE } = useConvEvolucao(view, 'dia')
  const { data: cats, isLoading: loadingC } = useConvCategorias(view)
  const { data: byLocation, isLoading: loadingByLocation } = useConvenienciaByLocation(view)

  const t = resumo?.totais
  const categorias = cats?.categorias ?? []
  const recMax = categorias[0]?.receita_bruta ?? 1

  // ── Base params helper (imperative — not a hook) ──────────────────────────
  function getBaseParams() {
    const { data_inicio, data_fim } = periodToRange(period)
    return { data_inicio, data_fim, location_id: locationId ?? undefined }
  }

  // ── Imperative fetch for grupos (level 2) ─────────────────────────────────
  const fetchGrupos = async (cat: ConvCategoria): Promise<ConvGrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, categoria_codigo: cat.categoria_codigo })
    const data = await queryClient.fetchQuery<{ grupos: ConvGrupo[] }>({
      queryKey: ['conv', 'grupos', params, cat.categoria_codigo],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/conveniencia/grupos${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.grupos
  }

  // ── Imperative fetch for subgrupos (level 3) ──────────────────────────────
  const fetchSubgrupos = async (grupo: ConvGrupo): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, grupo_id: String(grupo.grupo_id), segmento: view })
    const data = await queryClient.fetchQuery<{ segmento: string; grupo_id: number; subgrupos: DrillSubgrupo[] }>({
      queryKey: ['vendas', 'drill', 'subgrupos', params, grupo.grupo_id, view],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/vendas/drill/subgrupos${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgrupos
  }

  // ── Imperative fetch for produtos (level 4 — leaves) ─────────────────────
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

  const catColumns: ExpandableColumn<ConvCategoria>[] = [
    {
      key: 'categoria_descricao',
      header: 'Categoria',
      first: true,
      render: (row) => row.categoria_descricao ?? row.categoria_codigo,
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
    { key: 'qtd_total',     header: 'Qtd',          right: true, render: (row) => fInt(row.qtd_total) },
    { key: 'receita_bruta', header: 'Receita',       right: true, render: (row) => fCurrency(row.receita_bruta) },
    { key: 'cmv',           header: 'CMV',           right: true, render: (row) => fCurrency(row.cmv) },
    { key: 'margem_bruta',  header: 'Margem Bruta',  right: true, render: (row) => fCurrency(row.margem_bruta) },
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

  // Child columns (grupos): same shape minus the color dot — we reuse catColumns definition
  const grupoColumns: ExpandableColumn<ConvGrupo>[] = [
    {
      key: 'grupo_descricao',
      header: 'Grupo',
      first: true,
      render: (row) => row.grupo_descricao ?? `Grupo ${row.grupo_id}`,
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
    { key: 'qtd',           header: 'Qtd',         right: true, render: () => '—' },
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

  // ── Chart data ────────────────────────────────────────────────────────────

  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  const donutData: DonutSlice[] = categorias.slice(0, 8).map((c, i) => ({
    label: c.categoria_descricao ?? c.categoria_codigo,
    value: c.receita_bruta,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  const scatterData: ScatterPoint[] = categorias.map((c, i) => ({
    name:    c.categoria_descricao ?? c.categoria_codigo,
    qtd:     c.qtd_total,
    margem:  c.margem_pct,
    receita: c.receita_bruta,
    color:   CAT_COLORS[i % CAT_COLORS.length],
  }))

  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

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
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={accentColor}
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
          sparkData={[]}
          sparkColor={accentColor}
        />
        <KpiCard
          label="Ticket Médio"
          value={t?.ticket_medio != null ? fCurrency(t.ticket_medio) : '—'}
          sparkColor={accentColor}
        />
      </KpiGrid>

      {/* Evolução + Donut */}
      <Row variant="3-2">
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
                rowKey="categoria_codigo"
                rowColor={(_row, i) => CAT_COLORS[i % CAT_COLORS.length]}
                getChildren={fetchGrupos}
                childColumns={grupoColumns}
                childRowKey="grupo_id"
                getGrandchildren={fetchSubgrupos}
                grandchildColumns={subgrupoColumns}
                grandchildRowKey="subgrupo_id"
                getLeaves={fetchProdutos}
                leafColumns={produtoColumns}
                leafRowKey="source_produto_id"
                onLeafClick={(leaf) => navigate(`/produto/${encodeURIComponent(leaf.source_produto_id)}`)}
                footer={
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd />
                    <TfootTd right>{t ? fInt(t.qtd_itens) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.receita_bruta) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cmv) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.margem_bruta) : '—'}</TfootTd>
                    <TfootTd right last><b>{t ? fPct(t.margem_pct, 1) : '—'}</b></TfootTd>
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
          description={`Receita de ${VIEW_LABEL[view].toLowerCase()} por unidade no período selecionado`}
          secondaryMetric={{ key: 'margem_pct', label: 'Margem %', format: (v) => fPct(v, 1) }}
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
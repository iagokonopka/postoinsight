import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useLubrificantesResumo, useLubrificantesEvolucao } from '@/hooks/useLubrificantes'
import { useConvCategorias } from '@/hooks/useConveniencia'
import type { ConvCategoria, ConvGrupo } from '@/hooks/useConveniencia'
import type { DrillSubgrupo, DrillProduto } from '@/hooks/useVendas'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
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
  const { period, locationId } = useApp()
  const queryClient = useQueryClient()

  const { data: resumo, isLoading: loadingR } = useLubrificantesResumo()
  const { data: evo,    isLoading: loadingE } = useLubrificantesEvolucao('dia')
  const { data: cats,  isLoading: loadingC } = useConvCategorias('lubrificantes')

  const t      = resumo?.totais
  const recMax = cats?.categorias[0]?.receita_bruta ?? 1

  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

  // ── Base params helper (imperative) ────────────────────────────────────────
  function getBaseParams() {
    const { data_inicio, data_fim } = periodToRange(period)
    return { data_inicio, data_fim, location_id: locationId ?? undefined }
  }

  // ── Fetch grupos for a categoria (level 1) ─────────────────────────────────
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

  // ── Fetch subgrupos for a grupo (level 2) ──────────────────────────────────
  const fetchSubgrupos = async (grupo: ConvGrupo): Promise<DrillSubgrupo[]> => {
    const params = getBaseParams()
    const qs = buildQS({ ...params, grupo_id: String(grupo.grupo_id), segmento: 'lubrificantes' })
    const data = await queryClient.fetchQuery<{ segmento: string; grupo_id: number; subgrupos: DrillSubgrupo[] }>({
      queryKey: ['vendas', 'drill', 'subgrupos', params, grupo.grupo_id, 'lubrificantes'],
      queryFn: () =>
        fetch(apiUrl(`/api/v1/vendas/drill/subgrupos${qs}`), { credentials: 'include' })
          .then(r => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json() }),
    })
    return data.subgrupos
  }

  // ── Fetch produtos for a subgrupo (level 3 — leaves) ─────────────────────
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
    { key: 'qtd_total',     header: 'Qtd',         right: true, render: (row) => fInt(row.qtd_total) },
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
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.lubrificantes}
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cmv) : '—'}
          sparkColor={CHART_COLORS.neg}
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
          sparkColor={CHART_COLORS.lubrificantes}
        />
      </KpiGrid>

      {/* Evolução */}
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

      {/* Tabela expandável categoria → grupos → subgrupos → produtos */}
      <Card>
        <CardHeader title="Breakdown por categoria" />
        {loadingC
          ? <CardBody><LoadingBox /></CardBody>
          : (cats?.categorias ?? []).length === 0
            ? <CardBody><EmptyState title="Sem dados" description="Nenhuma categoria de lubrificantes no período." /></CardBody>
            : <ExpandableTable<ConvCategoria, ConvGrupo, DrillSubgrupo, DrillProduto>
                columns={catColumns}
                rows={cats?.categorias ?? []}
                rowKey="categoria_codigo"
                rowColor={(_r, i) => LUB_COLORS[i % LUB_COLORS.length]}
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
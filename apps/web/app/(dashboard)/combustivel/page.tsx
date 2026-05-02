import { Suspense } from 'react'
import { apiFetch, buildQuery } from '@/lib/api'
import { KpiCard, KpiCardSkeleton } from '@/components/KpiCard'
import { DataTable, type Column } from '@/components/DataTable'
import {
  PeriodoSelector,
  resolvePeriodo,
  type PeriodoPreset,
} from '@/components/PeriodoSelector'
import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

export const metadata = { title: 'Combustível — PostoInsight' }
export const dynamic = 'force-dynamic'

type ResumoResponse = {
  totais: {
    volume_total: number
    receita_bruta: number
    cmv: number
    margem_bruta: number
    margem_pct: number
  }
}

type ProdutoRow = {
  produto: string
  volume: number
  receita_bruta: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
}

type ProdutosResponse = { produtos: ProdutoRow[] }

export default function CombustivelPage({
  searchParams,
}: {
  searchParams?: { periodo?: PeriodoPreset }
}) {
  const periodo = resolvePeriodo(searchParams?.periodo)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--space-4)',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-subtle)',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Análise / Combustível
          </div>
          <h1 style={{ margin: '4px 0 0', fontSize: 'var(--text-heading)', fontWeight: 600 }}>
            Dashboard de Combustível
          </h1>
        </div>
        <PeriodoSelector basePath="/combustivel" current={periodo.preset} />
      </header>

      <Suspense fallback={<KpiSkeletonGrid />}>
        <Section dataInicio={periodo.data_inicio} dataFim={periodo.data_fim} />
      </Suspense>
    </div>
  )
}

async function Section({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) {
  const qs = buildQuery({ data_inicio: dataInicio, data_fim: dataFim })

  const results = await Promise.allSettled([
    apiFetch<ResumoResponse>(`/api/v1/combustivel/resumo${qs}`),
    apiFetch<ProdutosResponse>(`/api/v1/combustivel/produtos${qs}`),
  ])

  const errors = results
    .map((r, i) => (r.status === 'rejected' ? `[${i}] ${(r.reason as Error).message}` : null))
    .filter(Boolean)

  if (errors.length === 2) {
    return <ErrorBanner message={errors.join(' · ')} />
  }

  const resumo = results[0].status === 'fulfilled' ? results[0].value : null
  const produtos = results[1].status === 'fulfilled' ? results[1].value : null
  const totais = resumo?.totais

  const cols: Column<ProdutoRow>[] = [
    { key: 'produto', header: 'Produto' },
    {
      key: 'volume',
      header: 'Volume (L)',
      align: 'right',
      render: (r) => formatNumber(r.volume),
    },
    {
      key: 'receita_bruta',
      header: 'Receita',
      align: 'right',
      render: (r) => formatCurrency(r.receita_bruta),
    },
    { key: 'cmv', header: 'CMV', align: 'right', render: (r) => formatCurrency(r.cmv) },
    {
      key: 'margem_bruta',
      header: 'Margem',
      align: 'right',
      render: (r) => formatCurrency(r.margem_bruta),
    },
    {
      key: 'margem_pct',
      header: 'Margem %',
      align: 'right',
      render: (r) => formatPercent(r.margem_pct),
    },
    {
      key: 'participacao_pct',
      header: 'Part.',
      align: 'right',
      render: (r) => formatPercent(r.participacao_pct),
    },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {errors.length > 0 && <ErrorBanner message={errors.join(' · ')} />}

      <div
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <KpiCard label="Volume Total (L)" value={totais?.volume_total ?? null} format="number" />
        <KpiCard label="Receita Bruta" value={totais?.receita_bruta ?? null} format="currency" />
        <KpiCard label="CMV" value={totais?.cmv ?? null} format="currency" />
        <KpiCard label="Margem Bruta" value={totais?.margem_bruta ?? null} format="currency" />
        <KpiCard label="Margem %" value={totais?.margem_pct ?? null} format="percent" />
      </div>

      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 600 }}>
          Breakdown por produto
        </h3>
        <DataTable
          columns={cols}
          rows={produtos?.produtos ?? []}
          emptyMessage="Nenhuma venda de combustível no período."
        />
      </section>
    </div>
  )
}

function KpiSkeletonGrid() {
  return (
    <div
      style={{
        display: 'grid',
        gap: 'var(--space-4)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
      }}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <KpiCardSkeleton key={i} />
      ))}
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div
      role="alert"
      style={{
        padding: 'var(--space-5)',
        background: 'var(--color-warning-subtle)',
        color: 'var(--color-warning)',
        border: '1px solid var(--color-warning)',
        borderRadius: 'var(--radius-md)',
      }}
    >
      <strong>Erro ao carregar dados.</strong>
      <div style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>{message}</div>
    </div>
  )
}

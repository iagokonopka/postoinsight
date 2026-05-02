import { Suspense } from 'react'
import { apiFetch, buildQuery } from '@/lib/api'
import { KpiCard, KpiCardSkeleton } from '@/components/KpiCard'
import { SegmentoBreakdown, type SegmentoRow } from '@/components/SegmentoBreakdown'
import {
  PeriodoSelector,
  resolvePeriodo,
  type PeriodoPreset,
} from '@/components/PeriodoSelector'

export const metadata = { title: 'Dashboard de Vendas — PostoInsight' }
export const dynamic = 'force-dynamic'

type ResumoResponse = {
  periodo: { inicio: string; fim: string }
  totais: {
    receita_bruta: number
    descontos: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
    qtd_itens?: number
  }
  por_segmento: SegmentoRow[]
}

export default function VendasPage({
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
            Análise / Vendas
          </div>
          <h1
            style={{
              margin: '4px 0 0',
              fontSize: 'var(--text-heading)',
              fontWeight: 600,
            }}
          >
            Dashboard de Vendas
          </h1>
        </div>
        <PeriodoSelector basePath="/dashboard" current={periodo.preset} />
      </header>

      <Suspense fallback={<KpiGridSkeleton />}>
        <ResumoSection
          dataInicio={periodo.data_inicio}
          dataFim={periodo.data_fim}
        />
      </Suspense>
    </div>
  )
}

async function ResumoSection({
  dataInicio,
  dataFim,
}: {
  dataInicio: string
  dataFim: string
}) {
  let resumo: ResumoResponse | null = null
  let error: string | null = null

  try {
    resumo = await apiFetch<ResumoResponse>(
      `/api/v1/vendas/resumo${buildQuery({
        data_inicio: dataInicio,
        data_fim: dataFim,
      })}`,
    )
  } catch (e) {
    error = e instanceof Error ? e.message : 'Erro ao carregar dados'
  }

  if (error) {
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
        <strong>Não foi possível carregar os dados.</strong>
        <div style={{ fontSize: 'var(--text-sm)', marginTop: 4 }}>
          {error}. Verifique se a API está disponível em{' '}
          <code>NEXT_PUBLIC_API_URL</code> e se o endpoint{' '}
          <code>/api/v1/vendas/resumo</code> está implementado (Backend Task #1).
        </div>
      </div>
    )
  }

  if (!resumo) return null

  const totais = resumo.totais

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div
        style={{
          display: 'grid',
          gap: 'var(--space-4)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        }}
      >
        <KpiCard label="Receita Bruta" value={totais.receita_bruta} format="currency" />
        <KpiCard label="CMV" value={totais.cmv} format="currency" />
        <KpiCard label="Margem Bruta" value={totais.margem_bruta} format="currency" />
        <KpiCard
          label="Margem %"
          value={totais.receita_liquida > 0 ? totais.margem_pct : null}
          format="percent"
        />
        <KpiCard label="Qtd Itens" value={totais.qtd_itens ?? null} format="number" />
      </div>

      <div
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
        }}
      >
        <h3
          style={{
            margin: '0 0 var(--space-3)',
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
          }}
        >
          Evolução
        </h3>
        <p
          style={{
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
            margin: 0,
          }}
        >
          Gráfico de evolução temporal será adicionado ao consumir{' '}
          <code>/api/v1/vendas/evolucao</code>.
        </p>
      </div>

      <SegmentoBreakdown rows={resumo.por_segmento ?? []} />
    </div>
  )
}

function KpiGridSkeleton() {
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

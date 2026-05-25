// TanStack Query hooks for /api/v1/vendas/*
import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/context/AppContext'
import { periodToRange, buildQS } from '@/lib/periods'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

function useBaseParams() {
  const { period, locationId } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  return { data_inicio, data_fim, location_id: locationId ?? undefined }
}

// ─── /api/v1/vendas/resumo ────────────────────────────────────────────────────

export interface VendasResumo {
  periodo: { inicio: string; fim: string }
  totais: {
    receita_bruta: number
    descontos: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
    qtd_itens: number
  }
  por_segmento: {
    segmento: string
    receita_bruta: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
    participacao_pct: number
  }[]
}

export function useVendasResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<VendasResumo>({
    queryKey: ['vendas', 'resumo', params],
    queryFn: () => get(`/api/v1/vendas/resumo${qs}`),
  })
}

// ─── /api/v1/vendas/evolucao ──────────────────────────────────────────────────

export interface EvolucaoPonto {
  periodo: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
}

export function useVendasEvolucao(granularidade: 'dia' | 'semana' | 'mes' = 'dia') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade })
  return useQuery<{ granularidade: string; serie: EvolucaoPonto[] }>({
    queryKey: ['vendas', 'evolucao', params, granularidade],
    queryFn: () => get(`/api/v1/vendas/evolucao${qs}`),
  })
}

// ─── /api/v1/vendas/top-produtos ─────────────────────────────────────────────

export interface TopProduto {
  rank: number
  produto: string
  categoria: string
  grupo_id: number
  receita: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
  qtd: number
}

export function useTopProdutos(limit = 10) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, limit: String(limit) })
  return useQuery<{ produtos: TopProduto[] }>({
    queryKey: ['vendas', 'top-produtos', params, limit],
    queryFn: () => get(`/api/v1/vendas/top-produtos${qs}`),
  })
}

// ─── /api/v1/vendas/padrao-semanal ───────────────────────────────────────────

export interface PadraoSemanal {
  semanas: string[]
  data: number[][]
}

export function usePadraoSemanal() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<PadraoSemanal>({
    queryKey: ['vendas', 'padrao-semanal', params],
    queryFn: () => get(`/api/v1/vendas/padrao-semanal${qs}`),
  })
}

// ─── /api/v1/vendas/drill/subgrupos ──────────────────────────────────────────

export interface DrillSubgrupo {
  subgrupo_id: number
  subgrupo_descricao: string
  receita_bruta: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  qtd_itens: number
  participacao_pct: number
}

export function useDrillSubgrupos(grupoId: number | null, segmento: string) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, grupo_id: grupoId != null ? String(grupoId) : undefined, segmento })
  return useQuery<{ segmento: string; grupo_id: number; subgrupos: DrillSubgrupo[] }>({
    queryKey: ['vendas', 'drill', 'subgrupos', params, grupoId, segmento],
    queryFn: () => get(`/api/v1/vendas/drill/subgrupos${qs}`),
    enabled: grupoId != null,
  })
}

// ─── /api/v1/vendas/drill/produtos ───────────────────────────────────────────

export interface DrillProduto {
  source_produto_id: string
  descricao_produto: string
  segmento: string | null
  receita_bruta: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  qtd_venda: number
  qtd_itens: number
  participacao_pct: number
}

export function useDrillProdutos(subgrupoId: number | null) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, subgrupo_id: subgrupoId != null ? String(subgrupoId) : undefined })
  return useQuery<{ subgrupo_id: number; produtos: DrillProduto[] }>({
    queryKey: ['vendas', 'drill', 'produtos', params, subgrupoId],
    queryFn: () => get(`/api/v1/vendas/drill/produtos${qs}`),
    enabled: subgrupoId != null,
  })
}

// ─── /api/v1/vendas/produto/:id/evolucao ─────────────────────────────────────

export interface ProdutoEvolucaoPonto {
  periodo: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
  qtd_venda: number
  ticket_medio: number
}

export interface ProdutoInfo {
  source_produto_id: string
  descricao: string | null
  subgrupo: string | null
  grupo: string | null
}

export function useProdutoEvolucao(
  sourceProdutoId: string | null,
  granularidade: 'dia' | 'semana' | 'mes' = 'dia',
) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade })
  return useQuery<{ produto: ProdutoInfo; granularidade: string; serie: ProdutoEvolucaoPonto[] }>({
    queryKey: ['vendas', 'produto', 'evolucao', params, sourceProdutoId, granularidade],
    queryFn: () => get(`/api/v1/vendas/produto/${encodeURIComponent(sourceProdutoId!)}/evolucao${qs}`),
    enabled: sourceProdutoId != null,
  })
}

// ─── /api/v1/vendas/produto/:id/por-location ─────────────────────────────────

export interface ProdutoLocation {
  location_id: string
  location_nome: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
  qtd_venda: number
  participacao_pct: number
}

export function useProdutoPorLocation(sourceProdutoId: string | null) {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<{ produto: { source_produto_id: string; descricao: string | null }; locations: ProdutoLocation[] }>({
    queryKey: ['vendas', 'produto', 'por-location', params, sourceProdutoId],
    queryFn: () => get(`/api/v1/vendas/produto/${encodeURIComponent(sourceProdutoId!)}/por-location${qs}`),
    enabled: sourceProdutoId != null,
  })
}

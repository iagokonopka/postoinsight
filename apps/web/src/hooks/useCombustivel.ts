import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/context/AppContext'
import { periodToRange, previousRange, buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url), { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

function useBaseParams() {
  const { period, locationId } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  return { data_inicio, data_fim, location_id: locationId ?? undefined }
}

// ─── /api/v1/combustivel/resumo ───────────────────────────────────────────────

export interface CombustivelProduto {
  grupo_id: number
  grupo_descricao: string | null
  volume_litros: number
  receita_bruta: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  preco_medio_litro: number | null
  custo_medio_litro: number | null
  participacao_volume_pct: number
  participacao_receita_pct: number
}

export interface CombustivelResumo {
  totais: {
    volume_litros: number
    receita_bruta: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
  }
  por_produto: CombustivelProduto[]
}

export function useCombustivelResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<CombustivelResumo>({
    queryKey: ['combustivel', 'resumo', params],
    queryFn: () => get(`/api/v1/combustivel/resumo${qs}`),
  })
}

/** Resumo do período anterior — para deltas dos KPIs. */
export function useCombustivelResumoPrev() {
  const { period, locationId } = useApp()
  const { data_inicio, data_fim } = previousRange(period)
  const params = { data_inicio, data_fim, location_id: locationId ?? undefined }
  const qs = buildQS(params)
  return useQuery<CombustivelResumo>({
    queryKey: ['combustivel', 'resumo', 'prev', params],
    queryFn: () => get(`/api/v1/combustivel/resumo${qs}`),
  })
}

// ─── /api/v1/combustivel/evolucao?por_produto=true ────────────────────────────

export interface CombEvolucaoProduto {
  grupo_id: number
  grupo_descricao: string
  serie: {
    periodo: string
    volume_litros: number
    receita_bruta: number
    margem_bruta: number
  }[]
}

export function useCombustivelEvolucaoPorProduto(granularidade: 'dia' | 'semana' | 'mes' = 'dia') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade, por_produto: 'true' })
  return useQuery<{ granularidade: string; por_produto: true; produtos: CombEvolucaoProduto[] }>({
    queryKey: ['combustivel', 'evolucao', 'por_produto', params, granularidade],
    queryFn: () => get(`/api/v1/combustivel/evolucao${qs}`),
  })
}

// ─── /api/v1/combustivel/subgrupos ───────────────────────────────────────────
// Nível subgrupo = produtos reais (Gasolina Comum, Diesel S10, Etanol, …).
// Inclui CB e ARL; o frontend filtra Arla (descrição ~ /arla/i) na aba Combustível.

export interface CombustivelSubgrupo {
  subgrupo_id: number
  subgrupo_descricao: string
  volume_litros: number
  receita_bruta: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  preco_medio_litro: number | null
  custo_medio_litro: number | null
  participacao_volume_pct: number
  participacao_receita_pct: number
}

export function useCombustivelSubgrupos() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<{ subgrupos: CombustivelSubgrupo[] }>({
    queryKey: ['combustivel', 'subgrupos', params],
    queryFn: () => get(`/api/v1/combustivel/subgrupos${qs}`),
  })
}

// ─── /api/v1/combustivel/by-location ─────────────────────────────────────────

export interface CombustivelByLocation {
  location_id: string
  location_nome: string
  receita_bruta: number
  volume_litros: number
  preco_medio: number | null
  participacao_pct: number
  participacao_volume_pct: number
  [key: string]: unknown
}

export function useCombustivelByLocation() {
  const { period } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  const params = { data_inicio, data_fim }
  const qs = buildQS(params)
  return useQuery<{ locations: CombustivelByLocation[] }>({
    queryKey: ['combustivel', 'by-location', params],
    queryFn: () => get(`/api/v1/combustivel/by-location${qs}`),
  })
}

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

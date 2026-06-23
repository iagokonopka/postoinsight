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

export interface ArlaProduto {
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

export interface ArlaResumo {
  totais: {
    volume_litros: number
    receita_bruta: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
  }
  por_produto: ArlaProduto[]
}

export function useArlaResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<ArlaResumo>({
    queryKey: ['arla', 'resumo', params],
    queryFn: () => get(`/api/v1/arla/resumo${qs}`),
  })
}

/** Resumo Arla do período anterior — para descontar dos deltas CB-only. */
export function useArlaResumoPrev() {
  const { period, locationId } = useApp()
  const { data_inicio, data_fim } = previousRange(period)
  const params = { data_inicio, data_fim, location_id: locationId ?? undefined }
  const qs = buildQS(params)
  return useQuery<ArlaResumo>({
    queryKey: ['arla', 'resumo', 'prev', params],
    queryFn: () => get(`/api/v1/arla/resumo${qs}`),
  })
}

export interface ArlaEvolucaoPonto {
  periodo: string
  volume_litros: number
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
}

export function useArlaEvolucao(granularidade: 'dia' | 'semana' | 'mes' = 'dia') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade })
  return useQuery<{ serie: ArlaEvolucaoPonto[] }>({
    queryKey: ['arla', 'evolucao', params, granularidade],
    queryFn: () => get(`/api/v1/arla/evolucao${qs}`),
  })
}

// ─── /api/v1/arla/by-location ─────────────────────────────────────────────────

export interface ArlaByLocation {
  location_id: string
  location_nome: string
  receita_bruta: number
  volume_litros: number
  participacao_pct: number
  participacao_volume_pct: number
  [key: string]: unknown
}

export function useArlaByLocation() {
  const { period } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  const params = { data_inicio, data_fim }
  const qs = buildQS(params)
  return useQuery<{ locations: ArlaByLocation[] }>({
    queryKey: ['arla', 'by-location', params],
    queryFn: () => get(`/api/v1/arla/by-location${qs}`),
  })
}

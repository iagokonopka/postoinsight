import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/context/AppContext'
import { periodToRange, buildQS } from '@/lib/periods'
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

export interface LubrificantesGrupo {
  grupo_id: number
  grupo_descricao: string | null
  receita_bruta: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  qtd_itens: number
  participacao_pct: number
}

export interface LubrificantesResumo {
  totais: {
    receita_bruta: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
    qtd_itens: number
  }
  por_grupo: LubrificantesGrupo[]
}

export function useLubrificantesResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<LubrificantesResumo>({
    queryKey: ['lubrificantes', 'resumo', params],
    queryFn: () => get(`/api/v1/lubrificantes/resumo${qs}`),
  })
}

export interface LubEvolucaoPonto {
  periodo: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
}

export function useLubrificantesEvolucao(granularidade: 'dia' | 'semana' | 'mes' = 'dia') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade })
  return useQuery<{ serie: LubEvolucaoPonto[] }>({
    queryKey: ['lubrificantes', 'evolucao', params, granularidade],
    queryFn: () => get(`/api/v1/lubrificantes/evolucao${qs}`),
  })
}

// ─── /api/v1/lubrificantes/by-location ───────────────────────────────────────

export interface LubrificantesByLocation {
  location_id: string
  location_nome: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
}

export function useLubrificantesByLocation() {
  const { period } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  const params = { data_inicio, data_fim }
  const qs = buildQS(params)
  return useQuery<{ locations: LubrificantesByLocation[] }>({
    queryKey: ['lubrificantes', 'by-location', params],
    queryFn: () => get(`/api/v1/lubrificantes/by-location${qs}`),
  })
}

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

// ─── /resumo ─────────────────────────────────────────────────────────────────

export interface ConvResumo {
  totais: {
    receita_bruta: number
    descontos: number
    receita_liquida: number
    cmv: number
    margem_bruta: number
    margem_pct: number
    qtd_itens: number
    nf_count: number
    ticket_medio: number | null
  }
}

export function useConvResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<ConvResumo>({
    queryKey: ['conv', 'resumo', params],
    queryFn: () => get(`/api/v1/conveniencia/resumo${qs}`),
  })
}

// ─── /evolucao ────────────────────────────────────────────────────────────────

export interface ConvEvolucaoPonto {
  periodo: string
  receita_bruta: number
  margem_bruta: number
}

export function useConvEvolucao(segmento?: string, granularidade: 'dia' | 'semana' | 'mes' = 'dia') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularidade, segmento })
  return useQuery<{ serie: ConvEvolucaoPonto[] }>({
    queryKey: ['conv', 'evolucao', params, segmento, granularidade],
    queryFn: () => get(`/api/v1/conveniencia/evolucao${qs}`),
  })
}

// ─── /categorias ─────────────────────────────────────────────────────────────

export interface ConvCategoria {
  categoria_codigo: string
  categoria_descricao: string | null
  receita_bruta: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
  qtd_total: number
}

export function useConvCategorias(segmento?: string) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, segmento })
  return useQuery<{ categorias: ConvCategoria[] }>({
    queryKey: ['conv', 'categorias', params, segmento],
    queryFn: () => get(`/api/v1/conveniencia/categorias${qs}`),
  })
}

// ─── /grupos (drill-down — fetched on demand) ─────────────────────────────────

export interface ConvGrupo {
  grupo_id: number
  grupo_descricao: string | null
  receita_bruta: number
  cmv: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
}

export function useConvGrupos(categoriaCodigo: string | null) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, categoria_codigo: categoriaCodigo ?? undefined })
  return useQuery<{ grupos: ConvGrupo[] }>({
    queryKey: ['conv', 'grupos', params, categoriaCodigo],
    queryFn:  () => get(`/api/v1/conveniencia/grupos${qs}`),
    enabled:  !!categoriaCodigo,
  })
}

// ─── /api/v1/conveniencia/by-location ────────────────────────────────────────

export interface ConvByLocation {
  location_id: string
  location_nome: string
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
}

export function useConvenienciaByLocation(segmento?: string) {
  const { period } = useApp()
  const { data_inicio, data_fim } = periodToRange(period)
  const params = { data_inicio, data_fim, segmento }
  const qs = buildQS(params)
  return useQuery<{ locations: ConvByLocation[] }>({
    queryKey: ['conv', 'by-location', params],
    queryFn: () => get(`/api/v1/conveniencia/by-location${qs}`),
  })
}

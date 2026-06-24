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
  const { start_date, end_date } = periodToRange(period)
  return { start_date, end_date, location_id: locationId ?? undefined }
}

// ─── /summary ─────────────────────────────────────────────────────────────────

export interface ConvResumo {
  totals: {
    gross_revenue: number
    discounts: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
    item_count: number
    invoice_count: number
    avg_ticket: number | null
  }
}

export function useConvResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<ConvResumo>({
    queryKey: ['convenience', 'summary', params],
    queryFn: () => get(`/api/v1/convenience/summary${qs}`),
  })
}

// ─── /evolution ────────────────────────────────────────────────────────────────

export interface ConvEvolucaoPonto {
  period: string
  gross_revenue: number
  gross_margin: number
}

export function useConvEvolucao(segment?: string, granularity: 'day' | 'week' | 'month' = 'day') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity, segment })
  return useQuery<{ series: ConvEvolucaoPonto[] }>({
    queryKey: ['convenience', 'evolution', params, segment, granularity],
    queryFn: () => get(`/api/v1/convenience/evolution${qs}`),
  })
}

// ─── /categories ─────────────────────────────────────────────────────────────

export interface ConvCategoria {
  category_code: string
  category_name: string | null
  gross_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  share_pct: number
  total_quantity: number
}

export function useConvCategorias(segment?: string) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, segment })
  return useQuery<{ categories: ConvCategoria[] }>({
    queryKey: ['convenience', 'categories', params, segment],
    queryFn: () => get(`/api/v1/convenience/categories${qs}`),
  })
}

// ─── /groups (drill-down — fetched on demand) ─────────────────────────────────

export interface ConvGrupo {
  group_id: number
  group_name: string | null
  gross_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  share_pct: number
}

export function useConvGrupos(categoriaCodigo: string | null) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, category_code: categoriaCodigo ?? undefined })
  return useQuery<{ groups: ConvGrupo[] }>({
    queryKey: ['convenience', 'groups', params, categoriaCodigo],
    queryFn:  () => get(`/api/v1/convenience/groups${qs}`),
    enabled:  !!categoriaCodigo,
  })
}

// ─── /api/v1/convenience/by-location ─────────────────────────────────────────

export interface ConvByLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
  share_pct: number
  [key: string]: unknown
}

export function useConvenienciaByLocation(segment?: string) {
  const { period } = useApp()
  const { start_date, end_date } = periodToRange(period)
  const params = { start_date, end_date, segment }
  const qs = buildQS(params)
  return useQuery<{ locations: ConvByLocation[] }>({
    queryKey: ['convenience', 'by-location', params],
    queryFn: () => get(`/api/v1/convenience/by-location${qs}`),
  })
}

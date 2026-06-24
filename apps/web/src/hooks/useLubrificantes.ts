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

export interface LubrificantesGrupo {
  group_id: number
  group_name: string | null
  gross_revenue: number
  net_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  item_count: number
  share_pct: number
}

export interface LubrificantesResumo {
  totals: {
    gross_revenue: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
    item_count: number
  }
  by_group: LubrificantesGrupo[]
}

export function useLubrificantesResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<LubrificantesResumo>({
    queryKey: ['lubricants', 'summary', params],
    queryFn: () => get(`/api/v1/lubricants/summary${qs}`),
  })
}

export interface LubEvolucaoPonto {
  period: string
  gross_revenue: number
  gross_margin: number
  item_count: number
}

export function useLubrificantesEvolucao(granularity: 'day' | 'week' | 'month' = 'day') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity })
  return useQuery<{ series: LubEvolucaoPonto[] }>({
    queryKey: ['lubricants', 'evolution', params, granularity],
    queryFn: () => get(`/api/v1/lubricants/evolution${qs}`),
  })
}

// ─── /api/v1/lubricants/by-location ──────────────────────────────────────────

export interface LubrificantesByLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
  share_pct: number
}

export function useLubrificantesByLocation() {
  const { period } = useApp()
  const { start_date, end_date } = periodToRange(period)
  const params = { start_date, end_date }
  const qs = buildQS(params)
  return useQuery<{ locations: LubrificantesByLocation[] }>({
    queryKey: ['lubricants', 'by-location', params],
    queryFn: () => get(`/api/v1/lubricants/by-location${qs}`),
  })
}

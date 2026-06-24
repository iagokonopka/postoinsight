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
  const { start_date, end_date } = periodToRange(period)
  return { start_date, end_date, location_id: locationId ?? undefined }
}

export interface ArlaProduto {
  group_id: number
  group_name: string | null
  volume_liters: number
  gross_revenue: number
  net_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  avg_price_liter: number | null
  avg_cost_liter: number | null
  volume_share_pct: number
  revenue_share_pct: number
}

export interface ArlaResumo {
  totals: {
    volume_liters: number
    gross_revenue: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
  }
  by_product: ArlaProduto[]
}

export function useArlaResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<ArlaResumo>({
    queryKey: ['arla', 'summary', params],
    queryFn: () => get(`/api/v1/arla/summary${qs}`),
  })
}

/** Resumo Arla do período anterior — para descontar dos deltas CB-only. */
export function useArlaResumoPrev() {
  const { period, locationId } = useApp()
  const { start_date, end_date } = previousRange(period)
  const params = { start_date, end_date, location_id: locationId ?? undefined }
  const qs = buildQS(params)
  return useQuery<ArlaResumo>({
    queryKey: ['arla', 'summary', 'prev', params],
    queryFn: () => get(`/api/v1/arla/summary${qs}`),
  })
}

export interface ArlaEvolucaoPonto {
  period: string
  volume_liters: number
  gross_revenue: number
  gross_margin: number
}

export function useArlaEvolucao(granularity: 'day' | 'week' | 'month' = 'day') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity })
  return useQuery<{ series: ArlaEvolucaoPonto[] }>({
    queryKey: ['arla', 'evolution', params, granularity],
    queryFn: () => get(`/api/v1/arla/evolution${qs}`),
  })
}

// ─── /api/v1/arla/by-location ─────────────────────────────────────────────────

export interface ArlaByLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  volume_liters: number
  share_pct: number
  volume_share_pct: number
  [key: string]: unknown
}

export function useArlaByLocation() {
  const { period } = useApp()
  const { start_date, end_date } = periodToRange(period)
  const params = { start_date, end_date }
  const qs = buildQS(params)
  return useQuery<{ locations: ArlaByLocation[] }>({
    queryKey: ['arla', 'by-location', params],
    queryFn: () => get(`/api/v1/arla/by-location${qs}`),
  })
}

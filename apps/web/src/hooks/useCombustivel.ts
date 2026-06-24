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

// ─── /api/v1/fuel/summary ─────────────────────────────────────────────────────

export interface CombustivelProduto {
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

export interface CombustivelResumo {
  totals: {
    volume_liters: number
    gross_revenue: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
  }
  by_product: CombustivelProduto[]
}

export function useCombustivelResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<CombustivelResumo>({
    queryKey: ['fuel', 'summary', params],
    queryFn: () => get(`/api/v1/fuel/summary${qs}`),
  })
}

/** Resumo do período anterior — para deltas dos KPIs. */
export function useCombustivelResumoPrev() {
  const { period, locationId } = useApp()
  const { start_date, end_date } = previousRange(period)
  const params = { start_date, end_date, location_id: locationId ?? undefined }
  const qs = buildQS(params)
  return useQuery<CombustivelResumo>({
    queryKey: ['fuel', 'summary', 'prev', params],
    queryFn: () => get(`/api/v1/fuel/summary${qs}`),
  })
}

// ─── /api/v1/fuel/evolution?by_product=true ───────────────────────────────────

export interface CombEvolucaoProduto {
  group_id: number
  group_name: string
  series: {
    period: string
    volume_liters: number
    gross_revenue: number
    gross_margin: number
  }[]
}

export function useCombustivelEvolucaoPorProduto(granularity: 'day' | 'week' | 'month' = 'day') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity, by_product: 'true' })
  return useQuery<{ granularity: string; by_product: true; products: CombEvolucaoProduto[] }>({
    queryKey: ['fuel', 'evolution', 'by_product', params, granularity],
    queryFn: () => get(`/api/v1/fuel/evolution${qs}`),
  })
}

// ─── /api/v1/fuel/subgroups ──────────────────────────────────────────────────
// Nível subgrupo = produtos reais (Gasolina Comum, Diesel S10, Etanol, …).
// Inclui CB e ARL; o frontend filtra Arla (descrição ~ /arla/i) na aba Combustível.

export interface CombustivelSubgrupo {
  subgroup_id: number
  subgroup_name: string
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

export function useCombustivelSubgrupos() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<{ subgroups: CombustivelSubgrupo[] }>({
    queryKey: ['fuel', 'subgroups', params],
    queryFn: () => get(`/api/v1/fuel/subgroups${qs}`),
  })
}

// ─── /api/v1/fuel/by-location ────────────────────────────────────────────────

export interface CombustivelByLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  volume_liters: number
  avg_price: number | null
  share_pct: number
  volume_share_pct: number
  [key: string]: unknown
}

export function useCombustivelByLocation() {
  const { period } = useApp()
  const { start_date, end_date } = periodToRange(period)
  const params = { start_date, end_date }
  const qs = buildQS(params)
  return useQuery<{ locations: CombustivelByLocation[] }>({
    queryKey: ['fuel', 'by-location', params],
    queryFn: () => get(`/api/v1/fuel/by-location${qs}`),
  })
}

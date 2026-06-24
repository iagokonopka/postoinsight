// TanStack Query hooks for /api/v1/sales/*
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

// ─── /api/v1/sales/summary ────────────────────────────────────────────────────

export interface VendasResumo {
  period: { start: string; end: string }
  totals: {
    gross_revenue: number
    discounts: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
    item_count: number
  }
  by_segment: {
    segment: string
    gross_revenue: number
    net_revenue: number
    cogs: number
    gross_margin: number
    margin_pct: number
    share_pct: number
  }[]
}

export function useVendasResumo() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<VendasResumo>({
    queryKey: ['sales', 'summary', params],
    queryFn: () => get(`/api/v1/sales/summary${qs}`),
  })
}

/** Resumo do período anterior — para deltas dos KPIs. */
export function useVendasResumoPrev() {
  const { period, locationId } = useApp()
  const { start_date, end_date } = previousRange(period)
  const params = { start_date, end_date, location_id: locationId ?? undefined }
  const qs = buildQS(params)
  return useQuery<VendasResumo>({
    queryKey: ['sales', 'summary', 'prev', params],
    queryFn: () => get(`/api/v1/sales/summary${qs}`),
  })
}

// ─── /api/v1/sales/evolution ──────────────────────────────────────────────────

export interface EvolucaoPonto {
  period: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
}

export function useVendasEvolucao(granularity: 'day' | 'week' | 'month' = 'day') {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity })
  return useQuery<{ granularity: string; series: EvolucaoPonto[] }>({
    queryKey: ['sales', 'evolution', params, granularity],
    queryFn: () => get(`/api/v1/sales/evolution${qs}`),
  })
}

// ─── /api/v1/sales/top-products ──────────────────────────────────────────────

export interface TopProduto {
  rank: number
  product: string
  category: string
  group_id: number
  revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  share_pct: number
  quantity: number
}

export function useTopProdutos(limit = 10) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, limit: String(limit) })
  return useQuery<{ products: TopProduto[] }>({
    queryKey: ['sales', 'top-products', params, limit],
    queryFn: () => get(`/api/v1/sales/top-products${qs}`),
  })
}

// ─── /api/v1/sales/weekly-pattern ────────────────────────────────────────────

export interface PadraoSemanal {
  weeks: string[]
  data: number[][]
}

export function usePadraoSemanal() {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<PadraoSemanal>({
    queryKey: ['sales', 'weekly-pattern', params],
    queryFn: () => get(`/api/v1/sales/weekly-pattern${qs}`),
  })
}

// ─── /api/v1/sales/drill/subgroups ───────────────────────────────────────────

export interface DrillSubgrupo {
  subgroup_id: number
  subgroup_name: string
  gross_revenue: number
  net_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  item_count: number
  share_pct: number
}

export function useDrillSubgrupos(grupoId: number | null, segment: string) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, group_id: grupoId != null ? String(grupoId) : undefined, segment })
  return useQuery<{ segment: string; group_id: number; subgroups: DrillSubgrupo[] }>({
    queryKey: ['sales', 'drill', 'subgroups', params, grupoId, segment],
    queryFn: () => get(`/api/v1/sales/drill/subgroups${qs}`),
    enabled: grupoId != null,
  })
}

// ─── /api/v1/sales/drill/products ────────────────────────────────────────────

export interface DrillProduto {
  source_product_id: string
  product_name: string
  segment: string | null
  gross_revenue: number
  net_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
  quantity: number
  item_count: number
  share_pct: number
}

export function useDrillProdutos(subgrupoId: number | null) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, subgroup_id: subgrupoId != null ? String(subgrupoId) : undefined })
  return useQuery<{ subgroup_id: number; products: DrillProduto[] }>({
    queryKey: ['sales', 'drill', 'products', params, subgrupoId],
    queryFn: () => get(`/api/v1/sales/drill/products${qs}`),
    enabled: subgrupoId != null,
  })
}

// ─── /api/v1/sales/product/:id/evolution ─────────────────────────────────────

export interface ProdutoEvolucaoPonto {
  period: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
  quantity: number
  avg_ticket: number
}

export interface ProdutoInfo {
  source_product_id: string
  name: string | null
  subgroup: string | null
  group: string | null
}

export function useProdutoEvolucao(
  sourceProdutoId: string | null,
  granularity: 'day' | 'week' | 'month' = 'day',
) {
  const params = useBaseParams()
  const qs = buildQS({ ...params, granularity })
  return useQuery<{ product: ProdutoInfo; granularity: string; series: ProdutoEvolucaoPonto[] }>({
    queryKey: ['sales', 'product', 'evolution', params, sourceProdutoId, granularity],
    queryFn: () => get(`/api/v1/sales/product/${encodeURIComponent(sourceProdutoId!)}/evolution${qs}`),
    enabled: sourceProdutoId != null,
  })
}

// ─── /api/v1/sales/product/:id/by-location ───────────────────────────────────

export interface ProdutoLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
  quantity: number
  share_pct: number
}

// ─── /api/v1/sales/by-location ───────────────────────────────────────────────

export interface VendasByLocation {
  location_id: string
  location_name: string
  gross_revenue: number
  gross_margin: number
  margin_pct: number
  quantity: number
  share_pct: number
  [key: string]: unknown
}

export function useVendasByLocation() {
  const { period } = useApp()
  const { start_date, end_date } = periodToRange(period)
  const params = { start_date, end_date }
  const qs = buildQS(params)
  return useQuery<{ locations: VendasByLocation[] }>({
    queryKey: ['sales', 'by-location', params],
    queryFn: () => get(`/api/v1/sales/by-location${qs}`),
  })
}

export function useProdutoPorLocation(sourceProdutoId: string | null) {
  const params = useBaseParams()
  const qs = buildQS(params)
  return useQuery<{ product: { source_product_id: string; name: string | null }; locations: ProdutoLocation[] }>({
    queryKey: ['sales', 'product', 'by-location', params, sourceProdutoId],
    queryFn: () => get(`/api/v1/sales/product/${encodeURIComponent(sourceProdutoId!)}/by-location${qs}`),
    enabled: sourceProdutoId != null,
  })
}

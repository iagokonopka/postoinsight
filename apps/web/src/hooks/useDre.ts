import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/context/AppContext'
import { buildQS } from '@/lib/periods'
import { apiUrl } from '@/lib/api'

async function get<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url), { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

// Formats year+monthIdx → 'YYYY-MM' string
export function toAnoMes(year: number, monthIdx: number): string {
  return `${year}-${String(monthIdx + 1).padStart(2, '0')}`
}

// Returns last N months ending at (year, monthIdx), inclusive, as 'YYYY-MM[]'
export function lastNMonths(year: number, monthIdx: number, n: number): string[] {
  const result: string[] = []
  let y = year, m = monthIdx
  for (let i = 0; i < n; i++) {
    result.unshift(toAnoMes(y, m))
    m--
    if (m < 0) { m = 11; y-- }
  }
  return result
}

export interface DrePeriodo {
  gross_revenue: number
  discounts: number
  net_revenue: number
  cogs: number
  gross_margin: number
  margin_pct: number
}

export interface DreLinhaAPI {
  segment: 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia' | '_total'
  periods: Record<string, DrePeriodo>
}

export interface DespesaGrupoItem {
  label: string
  code: string
  amount: number
}

export interface DespesaBucket {
  total: number
  by_group: DespesaGrupoItem[]
}

/** Baldes de despesa por tipo contábil (Plano 2a). */
export type DespesaBucketKey =
  | 'operating' | 'financial' | 'tax' | 'investment'
  | 'cogs' | 'non_operating' | 'unclassified'

export type DespesaBuckets = Record<DespesaBucketKey, DespesaBucket>

export interface ResultadoOperacional {
  gross_margin: number
  operating_expenses: number
  operating_result: number
  operating_margin_pct: number
}

export interface DreMensal {
  months: string[]
  lines: DreLinhaAPI[]
  /** Despesas classificadas por tipo contábil (Plano 2a). */
  expenses?: Record<string, DespesaBuckets>
  /** Resultado Operacional = Margem Bruta − operating_expenses (Plano 2a). */
  operating_result?: Record<string, ResultadoOperacional>
}

export function useDreMensal(meses: string[]) {
  const { locationId } = useApp()
  const qs = buildQS({
    months: meses.join(','),
    location_id: locationId ?? undefined,
  })
  return useQuery<DreMensal>({
    queryKey: ['dre', 'monthly', meses, locationId],
    queryFn: () => get(`/api/v1/dre/monthly${qs}`),
    enabled: meses.length > 0,
  })
}

export function useDreMesesDisponiveis() {
  const { locationId } = useApp()
  const qs = buildQS({ location_id: locationId ?? undefined })
  return useQuery<{ months: string[] }>({
    queryKey: ['dre', 'available-months', locationId],
    queryFn: () => get(`/api/v1/dre/available-months${qs}`),
    staleTime: 5 * 60 * 1000,
  })
}

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
  receita_bruta: number
  descontos: number
  receita_liquida: number
  cmv: number
  margem_bruta: number
  margem_pct: number
}

export interface DreLinhaAPI {
  segmento: 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia' | '_total'
  periodos: Record<string, DrePeriodo>
}

export interface DespesaGrupoItem {
  label: string
  codigo: string
  valor: number
}

export interface DespesaBucket {
  total: number
  porGrupo: DespesaGrupoItem[]
}

/** Baldes de despesa por tipo contábil (Plano 2a). */
export type DespesaBucketKey =
  | 'operacional' | 'financeira' | 'imposto' | 'investimento'
  | 'cmv' | 'nao_operacional' | 'nao_classificado'

export type DespesaBuckets = Record<DespesaBucketKey, DespesaBucket>

export interface ResultadoOperacional {
  margem_bruta: number
  despesa_operacional: number
  resultado_operacional: number
  margem_operacional_pct: number
}

export interface DreMensal {
  meses: string[]
  linhas: DreLinhaAPI[]
  /** Despesas classificadas por tipo contábil (Plano 2a). */
  despesas?: Record<string, DespesaBuckets>
  /** Resultado Operacional = Margem Bruta − despesa_operacional (Plano 2a). */
  resultado_operacional?: Record<string, ResultadoOperacional>
}

export function useDreMensal(meses: string[]) {
  const { locationId } = useApp()
  const qs = buildQS({
    meses: meses.join(','),
    location_id: locationId ?? undefined,
  })
  return useQuery<DreMensal>({
    queryKey: ['dre', 'mensal', meses, locationId],
    queryFn: () => get(`/api/v1/dre/mensal${qs}`),
    enabled: meses.length > 0,
  })
}

export function useDreMesesDisponiveis() {
  const { locationId } = useApp()
  const qs = buildQS({ location_id: locationId ?? undefined })
  return useQuery<{ meses: string[] }>({
    queryKey: ['dre', 'meses-disponiveis', locationId],
    queryFn: () => get(`/api/v1/dre/meses-disponiveis${qs}`),
    staleTime: 5 * 60 * 1000,
  })
}

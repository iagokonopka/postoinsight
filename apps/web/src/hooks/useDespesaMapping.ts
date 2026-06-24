import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUrl } from '@/lib/api'

// Espelha o enum de apps/api / packages/shared (accounting_type).
// Valores persistidos — mantidos em português (ADR-018, exceção de valores enum).
export type AccountingType =
  | 'despesa_operacional'
  | 'despesa_financeira'
  | 'imposto'
  | 'investimento'
  | 'cmv'
  | 'nao_operacional'

export const ACCOUNTING_TYPE_LABELS: Record<AccountingType, string> = {
  despesa_operacional: 'Despesa operacional',
  despesa_financeira:  'Despesa financeira',
  imposto:             'Imposto',
  investimento:        'Investimento',
  cmv:                 'CMV (compra de mercadoria)',
  nao_operacional:     'Não-operacional',
}

/** Apenas este tipo subtrai da Margem Bruta no Resultado Operacional. */
export const OPERATIONAL_TYPE: AccountingType = 'despesa_operacional'

export interface DespesaGrupoRow {
  financial_group_code: string
  financial_group_name: string | null
  total: number
  entry_count: number
  pct: number
  accounting_type: AccountingType | null
  custom_label: string | null
  label: string
}

export interface DespesaGruposResponse {
  grand_total: number
  groups: DespesaGrupoRow[]
  summary: {
    classified: number
    unclassified: number
    classified_amount: number
    classified_pct_value: number
  }
}

export interface ClassificacaoItem {
  financial_group_code: string
  accounting_type: AccountingType
  custom_label?: string | null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url), { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

export function useDespesaGrupos() {
  return useQuery<DespesaGruposResponse>({
    queryKey: ['admin', 'expense-groups'],
    queryFn: () => getJson('/api/v1/admin/expense-groups'),
    staleTime: 60 * 1000,
  })
}

export function useDespesaClassificacaoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: ClassificacaoItem[]) => {
      const res = await fetch(apiUrl('/api/v1/admin/expense-classification'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `API error ${res.status}`)
      }
      return res.json() as Promise<{ ok: boolean; upserted: number }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'expense-groups'] })
      qc.invalidateQueries({ queryKey: ['dre'] })
    },
  })
}

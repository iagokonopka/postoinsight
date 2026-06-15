import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUrl } from '@/lib/api'

// Espelha o enum de apps/api / packages/shared (accounting_type).
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
  grupo_financeiro_codigo: string
  grupo_financeiro_descricao: string | null
  total: number
  qtd_lancamentos: number
  pct: number
  accounting_type: AccountingType | null
  custom_label: string | null
  label: string
}

export interface DespesaGruposResponse {
  total_geral: number
  grupos: DespesaGrupoRow[]
  resumo: {
    classificados: number
    nao_classificados: number
    valor_classificado: number
    pct_classificado_valor: number
  }
}

export interface ClassificacaoItem {
  grupo_financeiro_codigo: string
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
    queryKey: ['admin', 'despesa-grupos'],
    queryFn: () => getJson('/api/v1/admin/despesa-grupos'),
    staleTime: 60 * 1000,
  })
}

export function useDespesaClassificacaoMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itens: ClassificacaoItem[]) => {
      const res = await fetch(apiUrl('/api/v1/admin/despesa-classificacao'), {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itens }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? `API error ${res.status}`)
      }
      return res.json() as Promise<{ ok: boolean; upserted: number }>
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'despesa-grupos'] })
      qc.invalidateQueries({ queryKey: ['dre'] })
    },
  })
}

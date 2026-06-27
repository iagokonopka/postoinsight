import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiUrl } from '@/lib/api'

// Valores de segmento — persistidos em português (ADR-018, exceção de valores enum).
export type Segment = 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia'

export const SEGMENT_LABELS: Record<Segment, string> = {
  combustivel:   'Combustível',
  conveniencia:  'Conveniência',
  lubrificantes: 'Lubrificantes',
  servicos:      'Serviços',
}

export interface ProductNode {
  classification_key: string
  segment: string
  source_code: string
  erp_label: string
  context: string | null
  revenue: number
  pct: number
  cum_pct: number
  segment_override: Segment | null
  display_group: string | null
  custom_label: string | null
  visible: boolean
  sort_order: number | null
  label: string
}

export interface ProductGroupsResponse {
  total_revenue: number
  nodes: ProductNode[]
  summary: {
    classified: number
    unclassified: number
    pct_classified_revenue: number
  }
}

export interface ProductClassificationItem {
  classification_key: string
  segment_override?: Segment | null
  display_group?: string | null
  custom_label?: string | null
  visible?: boolean
  sort_order?: number | null
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(apiUrl(url), { credentials: 'include' })
  if (!res.ok) throw new Error(`API error ${res.status}: ${url}`)
  return res.json()
}

/** segment opcional: 'combustivel' | 'conveniencia' | ... (default: todos) */
export function useProductGroups(segment?: string) {
  const qs = segment ? `?segment=${encodeURIComponent(segment)}` : ''
  return useQuery<ProductGroupsResponse>({
    queryKey: ['admin', 'product-groups', segment ?? 'all'],
    queryFn: () => getJson(`/api/v1/admin/product-groups${qs}`),
    staleTime: 60 * 1000,
  })
}

export function useProductClassificationMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (items: ProductClassificationItem[]) => {
      const res = await fetch(apiUrl('/api/v1/admin/product-classification'), {
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
      qc.invalidateQueries({ queryKey: ['admin', 'product-groups'] })
      qc.invalidateQueries({ queryKey: ['combustivel'] })
      qc.invalidateQueries({ queryKey: ['conveniencia'] })
    },
  })
}

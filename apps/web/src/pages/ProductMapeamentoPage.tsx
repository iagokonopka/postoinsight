import { useMemo, useState } from 'react'
import { useToast } from '@/components/ui/Toast'
import { Card, CardBody } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fCurrency, fPct } from '@/lib/format'
import {
  useProductGroups,
  useProductClassificationMutation,
  SEGMENT_LABELS,
  type Segment,
  type ProductClassificationItem,
} from '@/hooks/useProductMapping'

const SEGMENT_OPTIONS = Object.entries(SEGMENT_LABELS) as [Segment, string][]

const TD: React.CSSProperties = { padding: '10px 14px', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' }
const TH: React.CSSProperties = { ...TD, fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }
const INPUT: React.CSSProperties = {
  height: '32px', padding: '0 8px', borderRadius: '6px',
  border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'inherit',
}

interface EditState {
  custom_label: string
  display_group: string
  segment_override: Segment | null
  visible: boolean
}

const FILTERS: { value: string; label: string }[] = [
  { value: 'combustivel', label: 'Combustível' },
  { value: 'conveniencia', label: 'Conveniência' },
]

// Painel de curadoria de produtos (Plano 2b). Embutido como aba em Configurações.
export function ProductMapeamentoPanel() {
  const toast = useToast()
  const [segment, setSegment] = useState<string>('combustivel')
  const { data, isLoading } = useProductGroups(segment)
  const mutation = useProductClassificationMutation()

  const [edits, setEdits] = useState<Record<string, EditState>>({})

  function setEdit(key: string, patch: Partial<EditState>, base: EditState) {
    setEdits(prev => ({ ...prev, [key]: { ...base, ...(prev[key] ?? {}), ...patch } }))
  }

  const nodes = data?.nodes ?? []
  const summary = data?.summary

  const dirtyItems: ProductClassificationItem[] = useMemo(() => {
    const out: ProductClassificationItem[] = []
    for (const node of nodes) {
      const e = edits[node.classification_key]
      if (!e) continue
      const changed =
        (e.custom_label || '') !== (node.custom_label || '') ||
        (e.display_group || '') !== (node.display_group || '') ||
        (e.segment_override || null) !== (node.segment_override || null) ||
        e.visible !== node.visible
      if (changed) {
        out.push({
          classification_key: node.classification_key,
          custom_label: e.custom_label || null,
          display_group: e.display_group || null,
          segment_override: e.segment_override || null,
          visible: e.visible,
        })
      }
    }
    return out
  }, [edits, nodes])

  async function handleSave() {
    if (dirtyItems.length === 0) return
    try {
      const res = await mutation.mutateAsync(dirtyItems)
      toast.success(`${res.upserted} produto(s) classificado(s)`)
      setEdits({})
    } catch (err) {
      toast.info(`Erro ao salvar: ${(err as Error).message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-row)' }}>
      <Card>
        <CardBody style={{ padding: 'var(--pad-card)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          {/* Filtro de segmento */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setSegment(f.value)}
                style={{
                  ...INPUT, cursor: 'pointer',
                  background: segment === f.value ? 'hsl(var(--primary))' : 'hsl(var(--card))',
                  color: segment === f.value ? 'hsl(var(--primary-foreground))' : 'hsl(var(--foreground))',
                  fontWeight: segment === f.value ? 600 : 400,
                }}
              >{f.label}</button>
            ))}
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Classificado (por valor)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
              {summary ? fPct(summary.pct_classified_revenue, 1) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Nós classificados</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {summary ? `${summary.classified}/${summary.classified + summary.unclassified}` : '—'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={handleSave} loading={mutation.isPending} disabled={dirtyItems.length === 0}>
            Salvar {dirtyItems.length > 0 ? `(${dirtyItems.length})` : ''}
          </Button>
        </CardBody>
      </Card>

      <Card>
        {isLoading
          ? <CardBody><div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Spinner size="lg" /></div></CardBody>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ ...TH, textAlign: 'left' }}>Produto / grupo (ERP)</th>
                    <th style={{ ...TH, textAlign: 'right' }}>Receita</th>
                    <th style={{ ...TH, textAlign: 'right' }}>%</th>
                    <th style={{ ...TH, textAlign: 'left' }}>Rótulo custom</th>
                    <th style={{ ...TH, textAlign: 'left' }}>Grupo de display</th>
                    <th style={{ ...TH, textAlign: 'left' }}>Segmento</th>
                    <th style={{ ...TH, textAlign: 'center' }}>Visível</th>
                  </tr>
                </thead>
                <tbody>
                  {nodes.map(node => {
                    const base: EditState = {
                      custom_label: node.custom_label ?? '',
                      display_group: node.display_group ?? '',
                      segment_override: node.segment_override ?? null,
                      visible: node.visible,
                    }
                    const e = edits[node.classification_key] ?? base
                    return (
                      <tr key={node.classification_key} style={{ borderBottom: '1px solid hsl(var(--border))', opacity: e.visible ? 1 : 0.5 }}>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <div style={{ fontWeight: 500 }}>{node.erp_label}</div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                            {node.context ?? '—'} · {node.classification_key}
                          </div>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>{fCurrency(node.revenue)}</td>
                        <td style={{ ...TD, textAlign: 'right', color: 'hsl(var(--muted-foreground))' }}>{fPct(node.pct, 1)}</td>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <input
                            value={e.custom_label}
                            placeholder={node.erp_label}
                            onChange={ev => setEdit(node.classification_key, { custom_label: ev.target.value }, base)}
                            style={{ ...INPUT, width: '160px' }}
                          />
                        </td>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <input
                            value={e.display_group}
                            placeholder="(opcional)"
                            onChange={ev => setEdit(node.classification_key, { display_group: ev.target.value }, base)}
                            style={{ ...INPUT, width: '130px' }}
                          />
                        </td>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <select
                            value={e.segment_override ?? ''}
                            onChange={ev => setEdit(node.classification_key, { segment_override: (ev.target.value || null) as Segment | null }, base)}
                            style={{ ...INPUT, minWidth: '150px' }}
                          >
                            <option value="">— derivado ({node.segment}) —</option>
                            {SEGMENT_OPTIONS.map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ ...TD, textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={e.visible}
                            onChange={ev => setEdit(node.classification_key, { visible: ev.target.checked }, base)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                          {!e.visible && <Badge variant="soft" style={{ marginLeft: '6px' }}>oculto</Badge>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        }
      </Card>
    </div>
  )
}

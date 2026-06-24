import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/components/ui/Toast'
import { Page, Card, CardBody } from '@/components/ui/Card'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { fCurrency, fPct } from '@/lib/format'
import {
  useDespesaGrupos,
  useDespesaClassificacaoMutation,
  ACCOUNTING_TYPE_LABELS,
  type AccountingType,
  type ClassificacaoItem,
} from '@/hooks/useDespesaMapping'

const TYPE_OPTIONS = Object.entries(ACCOUNTING_TYPE_LABELS) as [AccountingType, string][]

// Edição local: codigo → { tipo, label }
interface EditState {
  accounting_type: AccountingType | null
  custom_label: string
}

const TD: React.CSSProperties = { padding: '10px 14px', fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' }

// Página standalone (com guard) — mantida por compatibilidade; a navegação agora usa a aba
// "Classificação" dentro de Configurações (ver ConfiguracoesPage).
export default function AdminMapeamentoPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner' || !!user?.platformRole
  if (user && !isOwner) return <Navigate to="/configuracoes" replace />
  return (
    <Page>
      <PageHeader
        title="Classificação de despesas"
        subtitle="Defina o tipo contábil de cada grupo financeiro. Só despesa operacional entra no Resultado Operacional."
      />
      <AdminMapeamentoPanel />
    </Page>
  )
}

// Conteúdo reutilizável (sem Page/PageHeader/guard) — embutido como aba em Configurações.
export function AdminMapeamentoPanel() {
  const toast = useToast()
  const { data, isLoading } = useDespesaGrupos()
  const mutation = useDespesaClassificacaoMutation()

  const [edits, setEdits] = useState<Record<string, EditState>>({})

  function current(codigo: string, fallback: EditState): EditState {
    return edits[codigo] ?? fallback
  }

  function setEdit(codigo: string, patch: Partial<EditState>, base: EditState) {
    setEdits(prev => ({ ...prev, [codigo]: { ...base, ...(prev[codigo] ?? {}), ...patch } }))
  }

  const grupos = data?.groups ?? []
  const resumo = data?.summary

  // Itens alterados que têm um tipo definido (PUT só aceita accounting_type não-nulo)
  const dirtyItems: ClassificacaoItem[] = useMemo(() => {
    const out: ClassificacaoItem[] = []
    for (const g of grupos) {
      const e = edits[g.financial_group_code]
      if (!e) continue
      const changedType  = e.accounting_type !== g.accounting_type
      const changedLabel = (e.custom_label || '') !== (g.custom_label || '')
      if ((changedType || changedLabel) && e.accounting_type) {
        out.push({
          financial_group_code: g.financial_group_code,
          accounting_type: e.accounting_type,
          custom_label: e.custom_label || null,
        })
      }
    }
    return out
  }, [edits, grupos])

  async function handleSave() {
    if (dirtyItems.length === 0) return
    try {
      const res = await mutation.mutateAsync(dirtyItems)
      toast.success(`${res.upserted} grupo(s) classificado(s)`)
      setEdits({})
    } catch (err) {
      toast.info(`Erro ao salvar: ${(err as Error).message}`)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-row)' }}>
      {/* Resumo / progresso por valor */}
      <Card>
        <CardBody style={{ padding: 'var(--pad-card)', display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Classificado (por valor)</div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'hsl(var(--primary))' }}>
              {resumo ? fPct(resumo.classified_pct_value, 1) : '—'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Grupos classificados</div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>
              {resumo ? `${resumo.classified}/${resumo.classified + resumo.unclassified}` : '—'}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Button variant="primary" onClick={handleSave} loading={mutation.isPending} disabled={dirtyItems.length === 0}>
            Salvar {dirtyItems.length > 0 ? `(${dirtyItems.length})` : ''}
          </Button>
        </CardBody>
      </Card>

      {/* Tabela de grupos */}
      <Card>
        {isLoading
          ? <CardBody><div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Spinner size="lg" /></div></CardBody>
          : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                    <th style={{ ...TD, textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Grupo financeiro</th>
                    <th style={{ ...TD, textAlign: 'right', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Total</th>
                    <th style={{ ...TD, textAlign: 'right', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>%</th>
                    <th style={{ ...TD, textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Tipo contábil</th>
                    <th style={{ ...TD, textAlign: 'left', fontSize: '11px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Rótulo custom</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(g => {
                    const base: EditState = { accounting_type: g.accounting_type, custom_label: g.custom_label ?? '' }
                    const e = current(g.financial_group_code, base)
                    const naoClassificado = e.accounting_type == null
                    return (
                      <tr key={g.financial_group_code} style={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <div style={{ fontWeight: 500 }}>{g.financial_group_name ?? '(sem grupo)'}</div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                            cód {g.financial_group_code || '—'} · {g.entry_count} lanç.
                          </div>
                        </td>
                        <td style={{ ...TD, textAlign: 'right' }}>{fCurrency(g.total)}</td>
                        <td style={{ ...TD, textAlign: 'right', color: 'hsl(var(--muted-foreground))' }}>{fPct(g.pct, 1)}</td>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <select
                            value={e.accounting_type ?? ''}
                            onChange={ev => setEdit(g.financial_group_code, {
                              accounting_type: (ev.target.value || null) as AccountingType | null,
                            }, base)}
                            style={{
                              height: '32px', padding: '0 8px', borderRadius: '6px',
                              border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
                              color: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'inherit',
                              minWidth: '190px',
                            }}
                          >
                            <option value="">— não classificado —</option>
                            {TYPE_OPTIONS.map(([val, label]) => (
                              <option key={val} value={val}>{label}</option>
                            ))}
                          </select>
                          {naoClassificado && (
                            <Badge variant="soft" style={{ marginLeft: '8px' }}>não classificado</Badge>
                          )}
                        </td>
                        <td style={{ ...TD, textAlign: 'left' }}>
                          <input
                            value={e.custom_label}
                            placeholder={g.financial_group_name ?? ''}
                            onChange={ev => setEdit(g.financial_group_code, { custom_label: ev.target.value }, base)}
                            style={{
                              height: '32px', padding: '0 8px', borderRadius: '6px',
                              border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))',
                              color: 'hsl(var(--foreground))', fontSize: '12px', fontFamily: 'inherit',
                              width: '160px',
                            }}
                          />
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

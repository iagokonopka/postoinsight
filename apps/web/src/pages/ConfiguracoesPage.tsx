import { useState, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/context/AuthContext'
import { apiUrl } from '@/lib/api'
import { Page, Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { SegControl } from '@/components/ui/SegControl'
import { PageHeader } from '@/components/layout/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { AdminMapeamentoPanel } from './AdminMapeamentoPage'
import { ProductMapeamentoPanel } from './ProductMapeamentoPage'

// ─── Hook: locations ──────────────────────────────────────────────────────────

interface LocationItem {
  id: string
  name: string | null
  sourceLocationId: string | null
}

function useConfigLocations() {
  return useQuery<{ locations: LocationItem[] }>({
    queryKey: ['config', 'locations'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/v1/locations'), { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao buscar locations')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Hook: users ──────────────────────────────────────────────────────────────

interface UserItem {
  id: string
  userId: string
  name: string | null
  email: string
  role: 'owner' | 'manager' | 'viewer'
  active: boolean
  locationId: string | null
  locationName: string | null
}

function useConfigUsers() {
  return useQuery<{ users: UserItem[] }>({
    queryKey: ['config', 'users'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/v1/users'), { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao buscar usuários')
      return res.json()
    },
    staleTime: 5 * 60 * 1000,
  })
}

// ─── Hook: connectors ────────────────────────────────────────────────────────

interface ConnectorItem {
  id: string
  locationId: string
  locationName: string
  erpSource: string
  active: boolean
  lastSeenAt: string | null
  lastSyncAttemptAt: string | null
  lastSyncSuccessAt: string | null
  watermark: string | null
}

function useConfigConnectors() {
  return useQuery<{ connectors: ConnectorItem[] }>({
    queryKey: ['config', 'connectors'],
    queryFn: async () => {
      const res = await fetch(apiUrl('/api/v1/connectors'), { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao buscar connectors')
      return res.json()
    },
    staleTime: 2 * 60 * 1000,
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

// ─── CfgRow ───────────────────────────────────────────────────────────────────

function CfgRow({ label, value, last }: { label: string; value: ReactNode; last?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 0',
      borderBottom: last ? 'none' : '1px solid hsl(var(--border))',
    }}>
      <span style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {value}
      </span>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { user } = useAuth()
  const isOwner = user?.role === 'owner' || !!user?.platformRole
  const [tab, setTab] = useState<'geral' | 'classificacao' | 'produtos'>('geral')
  const tabOptions = [
    { value: 'geral' as const, label: 'Geral' },
    ...(isOwner ? [
      { value: 'classificacao' as const, label: 'Despesas' },
      { value: 'produtos' as const, label: 'Produtos' },
    ] : []),
  ]
  const { data: locData,       isLoading: loadingLocs }        = useConfigLocations()
  const { data: usersData,     isLoading: loadingUsers }       = useConfigUsers()
  const { data: connectorsData, isLoading: loadingConnectors } = useConfigConnectors()

  const locations  = locData?.locations  ?? []
  const users      = usersData?.users    ?? []
  const connectors = connectorsData?.connectors ?? []

  const tenantName = user?.tenantName ?? user?.tenantId ?? '—'

  const ROLE_BADGE: Record<string, 'primary' | 'default' | 'soft'> = {
    owner:   'primary',
    manager: 'default',
    viewer:  'soft',
  }

  return (
    <Page>
      <PageHeader
        title="Configurações"
        subtitle="Tenant, locations, usuários e integrações."
      />

      {isOwner && (
        <div><SegControl options={tabOptions} value={tab} onChange={setTab} /></div>
      )}

      {tab === 'classificacao' && isOwner && <AdminMapeamentoPanel />}

      {tab === 'produtos' && isOwner && <ProductMapeamentoPanel />}

      {tab === 'geral' && (<>
      {/* Tenant + Integração */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-grid)' }}>
        {/* Tenant */}
        <Card>
          <CardBody style={{ padding: 'var(--pad-card)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Tenant</div>
            <CfgRow label="Nome da rede"  value={tenantName} />
            <CfgRow label="Plano"         value={<><Badge variant="primary">Pro</Badge> até 8 locations</>} />
            <CfgRow label="Fuso horário"  value={<span className="mono">America/Sao_Paulo</span>} />
            <CfgRow label="Idioma"        value="Português (Brasil)" />
            <CfgRow
              label="Tenant ID"
              value={<span className="mono" style={{ fontSize: '11px' }}>{user?.tenantId ?? '—'}</span>}
              last
            />
          </CardBody>
        </Card>

        {/* Integração — dados reais via /api/v1/connectors */}
        <Card>
          <CardBody style={{ padding: 'var(--pad-card)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '16px' }}>Integração — Connectors</div>
            {loadingConnectors
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : connectors.length === 0
                ? <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', padding: '8px 0' }}>Nenhum connector configurado.</div>
                : connectors.map((c, i) => {
                    const wm = c.watermark ? new Date(c.watermark).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'
                    const last = i === connectors.length - 1
                    return (
                      <div key={c.id}>
                        <CfgRow label="Location"  value={c.locationName} />
                        <CfgRow label="ERP"       value={<span className="mono">{c.erpSource}</span>} />
                        <CfgRow label="Watermark" value={<span className="mono">{wm}</span>} />
                        <CfgRow label="Status"    value={<Badge variant={c.active ? 'success' : 'default'}>{c.active ? 'Ativo' : 'Inativo'}</Badge>} last={last} />
                        {!last && <div style={{ borderTop: '1px solid hsl(var(--border))', margin: '4px 0 12px' }} />}
                      </div>
                    )
                  })
            }
          </CardBody>
        </Card>
      </div>

      {/* Locations */}
      <Card>
        <div style={{
          padding: 'var(--pad-card-y) var(--pad-card) 8px',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Locations</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
              {loadingLocs ? '…' : `${locations.length} unidades configuradas`}
            </div>
          </div>
        </div>

        {loadingLocs
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {locations.map((loc, i) => (
                <div key={loc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  borderBottom: i < locations.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '6px',
                    background: 'hsl(var(--primary-subtle))',
                    color: 'hsl(var(--primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: 600, flexShrink: 0,
                  }}>
                    {initials(loc.name)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{loc.name ?? '—'}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                      ID: <span className="mono">{loc.sourceLocationId ?? '—'}</span>
                    </div>
                  </div>
                  <Badge variant="success">OK</Badge>
                </div>
              ))}
            </div>
        }
      </Card>

      {/* Usuários */}
      <Card>
        <div style={{
          padding: 'var(--pad-card-y) var(--pad-card) 8px',
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          borderBottom: '1px solid hsl(var(--border))',
        }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>Usuários</div>
            <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
              {loadingUsers ? '…' : `${users.filter(u => u.active).length} usuários ativos`}
            </div>
          </div>
        </div>
        {loadingUsers
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
          : <div style={{ display: 'flex', flexDirection: 'column' }}>
              {users.map((u, i) => {
                const name   = u.name ?? u.email
                const parts  = name.trim().split(/\s+/).filter(Boolean)
                const avatar = parts.length >= 2
                  ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
                  : name.slice(0, 2).toUpperCase()
                const isOwner = u.role === 'owner'
                const access  = u.locationName ?? (u.role === 'owner' ? 'Todas as locations' : 'Tenant inteiro')
                return (
                  <div key={u.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    borderBottom: i < users.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    opacity: u.active ? 1 : 0.5,
                  }}>
                    <div style={{
                      width: '32px', height: '32px',
                      borderRadius: '6px',
                      background: isOwner
                        ? 'linear-gradient(135deg, #0073BB, #6B40C4)'
                        : 'hsl(var(--primary-subtle))',
                      color: isOwner ? 'white' : 'hsl(var(--primary))',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: 700, flexShrink: 0,
                    }}>
                      {avatar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{u.name ?? '—'}</div>
                      <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                        {u.email} · {access}
                      </div>
                    </div>
                    <Badge variant={ROLE_BADGE[u.role]}>{u.role}</Badge>
                  </div>
                )
              })}
            </div>
        }
      </Card>
      </>)}
    </Page>
  )
}

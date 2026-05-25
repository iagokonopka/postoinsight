import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useApp } from '@/context/AppContext'
import { apiUrl } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { Page, Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { PageHeader } from '@/components/layout/PageHeader'
import { buildQS } from '@/lib/periods'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SyncLocation {
  id: string
  nome: string
  status: 'success' | 'warning' | 'failed' | 'running'
  ultima_sync: string | null
  proxima_sync: string | null
  registros: number
  duracao: string | null
  erro: string | null
}

interface SyncHistoricoItem {
  id: string
  location: string
  inicio: string | null
  fim: string | null
  duracao: string | null
  registros: number
  status: 'success' | 'failed' | 'running'
  erro: string | null
}

interface SyncStatus {
  ultima_sync_global: string | null
  locations: SyncLocation[]
  historico: SyncHistoricoItem[]
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

function useSyncStatus() {
  const { locationId } = useApp()
  const qs = buildQS({ location_id: locationId ?? undefined })
  return useQuery<SyncStatus>({
    queryKey: ['sync', 'status', locationId],
    queryFn: async () => {
      const res = await fetch(apiUrl(`/api/v1/sync/status${qs}`), { credentials: 'include' })
      if (!res.ok) throw new Error('Erro ao buscar status')
      return res.json()
    },
    refetchInterval: 30_000, // auto-refresh a cada 30s
  })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    + ' '
    + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

type SyncStatusKey = SyncLocation['status']

const DOT_COLOR: Record<SyncStatusKey, string> = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  failed:  'hsl(var(--danger))',
  running: 'hsl(var(--primary))',
}

const STATUS_BADGE: Record<SyncStatusKey, 'success' | 'warning' | 'danger' | 'primary'> = {
  success: 'success',
  warning: 'warning',
  failed:  'danger',
  running: 'primary',
}

const STATUS_LABEL: Record<SyncStatusKey, string> = {
  success: 'OK',
  warning: 'Atenção',
  failed:  'Erro',
  running: 'Rodando',
}

// ─── Dot with pulse animation ─────────────────────────────────────────────────

function SyncDot({ status, size = 10 }: { status: SyncStatusKey; size?: number }) {
  const color = DOT_COLOR[status]
  return (
    <span style={{ position: 'relative', width: size, height: size, flexShrink: 0, display: 'inline-block' }}>
      <span style={{
        display: 'block',
        width: size, height: size,
        borderRadius: '999px',
        background: color,
      }} />
      {status === 'success' && (
        <span style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '999px',
          border: `2px solid ${color.replace(')', ' / 0.3)')}`,
          animation: 'pulse 2s infinite',
        }} />
      )}
    </span>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function SincronizacaoPage() {
  const { data, isLoading, refetch } = useSyncStatus()
  const toast = useToast()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      const res = await fetch(apiUrl('/api/v1/sync/trigger'), {
        method: 'POST',
        credentials: 'include',
      })
      if (res.ok) {
        toast.success('Sincronização iniciada — aguarde alguns instantes.')
        setTimeout(() => refetch(), 3000)
      } else {
        toast.info('Não foi possível iniciar a sincronização.')
      }
    } catch {
      toast.info('Erro de conexão ao disparar sync.')
    } finally {
      setSyncing(false)
    }
  }

  const locations = data?.locations ?? []
  const historico = data?.historico ?? []

  // Group locations by ERP type (heuristic: all current are Status ERP)
  const statusLocations = locations  // all locations for now

  return (
    <Page>
      {/* Pulse keyframe */}
      <style>{`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }`}</style>

      <PageHeader
        title="Sincronização"
        subtitle="Status dos ERPs conectados e histórico das últimas execuções."
        actions={
          <Button variant="primary" loading={syncing} onClick={handleSync}>
            Sincronizar agora
          </Button>
        }
      />

      {/* ERP status cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-grid)' }}>
        {/* Status ERP */}
        <Card>
          <CardBody style={{ padding: 'var(--pad-card)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.1px' }}>
              Status · Status ERP
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Agente RDP — Windows Server
            </div>

            {isLoading
              ? <div style={{ marginTop: '12px' }}><Spinner /></div>
              : statusLocations.length > 0 && (
                <div>
                  {statusLocations.map(loc => (
                    <div key={loc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                      <SyncDot status={loc.status} />
                      <span style={{ fontSize: '13px', fontWeight: 500 }}>{loc.nome}</span>
                      <Badge variant={STATUS_BADGE[loc.status]}>{STATUS_LABEL[loc.status]}</Badge>
                    </div>
                  ))}
                  {statusLocations[0] && (
                    <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '8px' }}>
                      {statusLocations.length} locations · última sync{' '}
                      <b style={{ color: 'hsl(var(--foreground))' }}>
                        {fDateTime(data?.ultima_sync_global ?? null)}
                      </b>
                    </div>
                  )}
                </div>
              )
            }
          </CardBody>
        </Card>

        {/* WebPosto ERP */}
        <Card>
          <CardBody style={{ padding: 'var(--pad-card)' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.1px' }}>
              Status · WebPosto ERP
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              API REST (Quality Automação)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
              <SyncDot status="warning" />
              <span style={{ fontSize: '13px', fontWeight: 500 }}>Sem locations</span>
              <Badge variant="warning">Aguardando contrato</Badge>
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '8px' }}>
              Conector implantado · nenhuma rede com WebPosto ainda.
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Histórico */}
      <Card>
        <CardHeader title="Histórico de execuções" description={`Últimas ${historico.length} execuções`} />
        {isLoading
          ? <CardBody><div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}><Spinner size="lg" /></div></CardBody>
          : historico.length === 0
            ? <CardBody>
                <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: 'hsl(var(--muted-foreground))' }}>
                  Nenhuma execução registrada.
                </div>
              </CardBody>
            : <div style={{ display: 'flex', flexDirection: 'column' }}>
                {historico.map((item, i) => (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px 20px',
                    borderBottom: i < historico.length - 1 ? '1px solid hsl(var(--border))' : 'none',
                    fontSize: '12px',
                  }}>
                    <SyncDot status={item.status as SyncStatusKey} size={8} />
                    <span style={{
                      color: 'hsl(var(--muted-foreground))',
                      fontFamily: "'Geist Mono', monospace",
                      fontSize: '11px',
                      minWidth: '130px',
                      flexShrink: 0,
                    }}>
                      {fDateTime(item.fim ?? item.inicio)}
                    </span>
                    <span style={{ fontWeight: 500, minWidth: '130px', flexShrink: 0 }}>
                      {item.location}
                    </span>
                    <Badge variant={STATUS_BADGE[item.status as SyncStatusKey]}>
                      {STATUS_LABEL[item.status as SyncStatusKey]}
                    </Badge>
                    {item.erro && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--danger))', flexShrink: 0 }}>
                        {item.erro}
                      </span>
                    )}
                    {item.duracao && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>
                        {item.duracao}
                      </span>
                    )}
                    <span style={{
                      marginLeft: 'auto',
                      color: 'hsl(var(--muted-foreground))',
                      fontVariantNumeric: 'tabular-nums',
                      flexShrink: 0,
                    }}>
                      {item.registros.toLocaleString('pt-BR')} registros
                    </span>
                  </div>
                ))}
              </div>
        }
      </Card>
    </Page>
  )
}

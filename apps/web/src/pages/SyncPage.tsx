/**
 * SyncPage — /sync
 * Página de operação da sincronização do ERP por location.
 *
 * Layout:
 *  [PageHeader: "Sincronização" + descrição + botão Sincronizar agora]
 *  [Grid de cards de status por location — 1 card por location]
 *  [SectionCard: histórico de jobs (últimas 20 execuções) — tabela]
 *
 * Endpoint: GET /api/v1/sync/status →
 *   {
 *     ultima_sync_global: string|null,
 *     locations: Array<{ id, nome, status, ultima_sync, proxima_sync, registros, duracao, erro }>,
 *     historico: Array<{ id, location, inicio, fim, duracao, registros, status, erro }>
 *   }
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  RefreshCw, Loader2, CheckCircle2, AlertTriangle, XCircle, Clock,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/kpi/SectionCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { fNum } from '@/lib/formatters';
import { cn } from '@/lib/utils';

/* ─── Tipos do endpoint ───────────────────────────────────── */

type LocationSyncStatus = 'success' | 'warning' | 'failed' | 'running';

interface SyncLocation {
  id: string;
  nome: string;
  status: LocationSyncStatus;
  ultima_sync: string | null;
  proxima_sync: string | null;
  registros: number;
  duracao: string | null;
  erro: string | null;
}

interface SyncHistoryItem {
  id: string;
  location: string;
  inicio: string | null;
  fim: string | null;
  duracao: string | null;
  registros: number;
  status: 'success' | 'failed' | 'running';
  erro: string | null;
}

interface SyncStatusResponse {
  ultima_sync_global: string | null;
  locations: SyncLocation[];
  historico: SyncHistoryItem[];
}

/* ─── Helpers ─────────────────────────────────────────────── */

function relativeFromNow(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) {
    // Futuro — próxima sync
    const m = Math.round(-diffMs / 60_000);
    if (m < 60) return `em ${m}min`;
    return `em ${Math.round(m / 60)}h`;
  }
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `há ${hours}h`;
  return `há ${Math.round(hours / 24)}d`;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_META: Record<LocationSyncStatus, {
  label: string;
  icon: typeof CheckCircle2;
  dotClass: string;
  ring: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
}> = {
  success: { label: 'OK',        icon: CheckCircle2,   dotClass: 'bg-[hsl(var(--success))]',                           ring: 'shadow-[0_0_0_4px_hsl(var(--success)/0.15)]',  badgeVariant: 'secondary' },
  warning: { label: 'Atrasado',  icon: AlertTriangle,  dotClass: 'bg-[hsl(var(--warning))]',                           ring: 'shadow-[0_0_0_4px_hsl(var(--warning)/0.15)]',  badgeVariant: 'outline' },
  failed:  { label: 'Falha',     icon: XCircle,        dotClass: 'bg-[hsl(var(--danger))]',                            ring: 'shadow-[0_0_0_4px_hsl(var(--danger)/0.15)]',   badgeVariant: 'destructive' },
  running: { label: 'Executando', icon: Loader2,       dotClass: 'bg-[hsl(var(--primary))] animate-pulse',             ring: 'shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]',  badgeVariant: 'default' },
};

/* ─── Card de location ────────────────────────────────────── */

function LocationCard({ loc }: { loc: SyncLocation }) {
  const meta = STATUS_META[loc.status];

  return (
    <div
      className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Header — nome + status dot */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">{loc.nome}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {loc.status === 'running' ? 'Sincronizando agora…' : relativeFromNow(loc.ultima_sync)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', meta.dotClass, meta.ring)} />
          <Badge variant={meta.badgeVariant} className="text-[11px]">
            {meta.label}
          </Badge>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 gap-3 text-[12px]">
        <div>
          <p className="text-muted-foreground">Última sync</p>
          <p className="font-medium text-foreground tabular-nums mt-0.5">
            {formatDateTime(loc.ultima_sync)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Próxima</p>
          <p className="font-medium text-foreground tabular-nums mt-0.5">
            {loc.proxima_sync ? relativeFromNow(loc.proxima_sync) : '—'}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Registros</p>
          <p className="font-medium text-foreground tabular-nums mt-0.5">
            {fNum(loc.registros)}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Duração</p>
          <p className="font-medium text-foreground tabular-nums mt-0.5">
            {loc.duracao ?? '—'}
          </p>
        </div>
      </div>

      {/* Mensagem de erro — só se houver */}
      {loc.erro && (
        <div className="rounded-md border border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.06)] p-2 text-[12px] text-[hsl(var(--danger))]">
          {loc.erro}
        </div>
      )}
    </div>
  );
}

/* ─── Status row para o histórico ─────────────────────────── */

function StatusBadge({ status }: { status: SyncHistoryItem['status'] }) {
  if (status === 'success') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--success)/0.3)] bg-[hsl(var(--success)/0.08)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--success))]">
        <CheckCircle2 size={11} /> Sucesso
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.08)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--danger))]">
        <XCircle size={11} /> Falha
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-2 py-0.5 text-[11px] font-medium text-[hsl(var(--primary))]">
      <Loader2 size={11} className="animate-spin" /> Executando
    </span>
  );
}

/* ─── Page ────────────────────────────────────────────────── */

export function SyncPage() {
  const { trigger, triggering, status: globalStatus } = useSyncStatus();
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  // Polling: 5s enquanto algo está executando, 60s caso contrário
  const { data, isLoading } = useQuery({
    queryKey: ['sync-page-status'],
    queryFn: () => api.get<SyncStatusResponse>('/api/v1/sync/status'),
    refetchInterval: (q) => {
      const r = q.state.data;
      return r?.locations.some((l) => l.status === 'running') ? 5_000 : 60_000;
    },
  });

  const isSyncing = triggering || globalStatus === 'syncing';
  const selectedJob = data?.historico.find((h) => h.id === selectedJobId) ?? null;

  return (
    <div className="flex flex-col">
      <PageHeader
        title="Sincronização"
        subtitle="Acompanhe o estado dos agentes e o histórico de execuções."
        actions={(
          <Button onClick={trigger} disabled={isSyncing}>
            {isSyncing ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
            {isSyncing ? 'Sincronizando…' : 'Sincronizar agora'}
          </Button>
        )}
      />

      <div className="flex flex-col gap-6">
        {/* ─── Grid de locations ───────────────────────────── */}
        <SectionCard
          title="Status por unidade"
          description={
            data?.ultima_sync_global
              ? `Última sincronização global: ${formatDateTime(data.ultima_sync_global)} (${relativeFromNow(data.ultima_sync_global)})`
              : 'Nenhuma sincronização registrada ainda.'
          }
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 w-full rounded-lg" />
              ))}
            </div>
          ) : !data || data.locations.length === 0 ? (
            <EmptyState
              icon={<Clock size={18} />}
              title="Nenhuma unidade conectada"
              description="Conecte um agente para começar a sincronizar dados do ERP."
              primaryAction={{ label: 'Sincronizar agora', onClick: trigger }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {data.locations.map((loc) => <LocationCard key={loc.id} loc={loc} />)}
            </div>
          )}
        </SectionCard>

        {/* ─── Histórico ───────────────────────────────────── */}
        <SectionCard
          title="Histórico de execuções"
          description="Últimas 20 sincronizações em todas as unidades."
          noPadding
        >
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !data || data.historico.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Clock size={18} />}
                title="Sem histórico ainda"
                description="As próximas sincronizações aparecerão aqui."
                compact
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Início</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-right">Registros</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.historico.map((h) => (
                  <TableRow
                    key={h.id}
                    onClick={() => setSelectedJobId(selectedJobId === h.id ? null : h.id)}
                    className="cursor-pointer"
                    data-state={selectedJobId === h.id ? 'selected' : undefined}
                  >
                    <TableCell className="font-medium">{h.location}</TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {formatDateTime(h.inicio)}
                    </TableCell>
                    <TableCell className="tabular-nums text-muted-foreground">
                      {h.duracao ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {fNum(h.registros)}
                    </TableCell>
                    <TableCell><StatusBadge status={h.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>

        {/* ─── Detalhe inline do job selecionado ───────────── */}
        {selectedJob && (
          <SectionCard
            title="Detalhes da execução"
            action={(
              <button
                type="button"
                onClick={() => setSelectedJobId(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Fechar
              </button>
            )}
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px]">
              <div>
                <p className="text-muted-foreground">Unidade</p>
                <p className="font-medium text-foreground mt-0.5">{selectedJob.location}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Início</p>
                <p className="font-medium text-foreground tabular-nums mt-0.5">{formatDateTime(selectedJob.inicio)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Fim</p>
                <p className="font-medium text-foreground tabular-nums mt-0.5">{formatDateTime(selectedJob.fim)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <div className="mt-0.5"><StatusBadge status={selectedJob.status} /></div>
              </div>
            </div>
            {selectedJob.erro && (
              <div className="mt-4 rounded-md border border-[hsl(var(--danger)/0.3)] bg-[hsl(var(--danger)/0.06)] p-3 text-[12px] text-[hsl(var(--danger))]">
                <p className="font-medium mb-1">Erro reportado pelo agente</p>
                <p className="font-mono text-[11px] leading-relaxed break-all">{selectedJob.erro}</p>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </div>
  );
}

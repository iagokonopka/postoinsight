/**
 * useSyncStatus — estado do sync e ação de trigger
 * Spec: FRONTEND_SPEC.md seção 9
 * Polling a cada 30s quando syncing, 5min caso contrário
 */
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface SyncStatusResponse {
  last_sync_at: string | null;
  status: 'ok' | 'syncing' | 'error' | 'never';
  hours_since_sync: number | null;
}

type SyncState = 'ok' | 'warning' | 'critical' | 'syncing' | 'error';

function resolveState(data?: SyncStatusResponse, triggering?: boolean): SyncState {
  if (triggering || data?.status === 'syncing') return 'syncing';
  if (data?.status === 'error') return 'error';
  if (!data?.last_sync_at || data?.status === 'never') return 'error';
  const h = data.hours_since_sync ?? Infinity;
  if (h > 48) return 'critical';
  if (h > 25) return 'warning';
  return 'ok';
}

function resolveLabel(state: SyncState, data?: SyncStatusResponse): string {
  switch (state) {
    case 'ok': {
      if (!data?.last_sync_at) return 'Sincronizado';
      const d = new Date(data.last_sync_at);
      return `Atualizado às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    case 'warning':
      return `Há ${Math.round(data?.hours_since_sync ?? 0)}h`;
    case 'critical':
      return `Desatualizado — ${Math.round(data?.hours_since_sync ?? 0)}h`;
    case 'syncing':
      return 'Sincronizando...';
    case 'error':
      return 'Falha na sync';
  }
}

export function useSyncStatus() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [triggering, setTriggering] = useState(false);

  const { data } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => api.get<SyncStatusResponse>('/api/v1/sync/status'),
    refetchInterval: triggering ? 3_000 : 5 * 60_000,
  });

  const state = resolveState(data, triggering);
  const label = resolveLabel(state, data);
  const lastSyncAt = data?.last_sync_at ? new Date(data.last_sync_at) : null;

  async function trigger() {
    setTriggering(true);
    try {
      await api.post('/api/v1/sync/trigger');
      toast.success('Sincronização iniciada', 'Os dados serão atualizados em alguns instantes.');
      // Invalida o status para forçar recheck
      await queryClient.invalidateQueries({ queryKey: ['sync-status'] });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao iniciar sincronização';
      toast.error('Falha ao sincronizar', msg);
    } finally {
      // Para de marcar como triggering após 30s (timeout de segurança)
      setTimeout(() => setTriggering(false), 30_000);
    }
  }

  return {
    status: state,
    label,
    lastSyncAt,
    trigger,
    triggering,
    isCritical: state === 'critical',
    isError: state === 'error',
  };
}

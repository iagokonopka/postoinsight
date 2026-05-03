import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SectionCard } from '@/components/ui/SectionCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { fNum } from '@/lib/formatters';

interface SyncLocation {
  id: string;
  nome: string;
  status: string;
  ultima_sync: string | null;
  proxima_sync: string | null;
  registros: number;
  duracao?: string;
  erro?: string | null;
}

interface SyncHistoricoItem {
  id: string | number;
  location: string;
  inicio: string;
  fim: string;
  duracao: string;
  registros: number;
  status: string;
  erro?: string | null;
}

interface SyncStatus {
  ultima_sync_global: string | null;
  locations: SyncLocation[];
  historico: SyncHistoricoItem[];
}

function fTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('pt-BR') +
    ' ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );
}

export function SyncPage() {
  const qc = useQueryClient();
  const [expandedErr, setExpandedErr] = useState<string | number | null>(null);

  const { data } = useQuery<SyncStatus>({
    queryKey: ['sync-status'],
    queryFn: () => api.get('/api/v1/sync/status'),
    refetchInterval: 30_000, // atualiza a cada 30s
  });

  // Mutation para forçar sync de uma location
  const syncMutation = useMutation({
    mutationFn: (locationId: string) =>
      api.post('/api/v1/sync/trigger', { location_id: locationId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-status'] });
    },
  });

  const locations = data?.locations ?? [];
  const historico = data?.historico ?? [];

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Sincronização
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Status de conexão e histórico das últimas sincronizações
        </p>
      </div>

      {/* Cards por location */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 'var(--space-4)',
      }}>
        {locations.map((loc) => {
          const isSyncing = syncMutation.isPending && syncMutation.variables === loc.id;
          const statusColor =
            loc.status === 'success' ? 'var(--color-success)' :
            loc.status === 'failed'  ? 'var(--color-danger)' :
            'var(--color-warning)';

          return (
            <div key={loc.id} style={{
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-5)',
              boxShadow: 'var(--shadow-xs)',
              borderTop: `3px solid ${statusColor}`,
            }}>
              {/* Nome + badge + botão sync */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', marginBottom: 4 }}>
                    {loc.nome}
                  </div>
                  <StatusBadge
                    status={loc.status === 'success' ? 'online' : loc.status === 'failed' ? 'offline' : 'warning'}
                  />
                </div>
                <button
                  onClick={() => syncMutation.mutate(loc.id)}
                  disabled={isSyncing}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bg)',
                    color: 'var(--color-text-muted)',
                    fontFamily: 'inherit', fontSize: 11,
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    opacity: isSyncing ? 0.6 : 1,
                  }}
                >
                  <svg
                    width={11} height={11} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                    style={{ animation: isSyncing ? 'spin 1s linear infinite' : 'none' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isSyncing ? 'Sincronizando…' : 'Sync'}
                </button>
              </div>

              {/* Detalhes */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <SyncInfoRow label="Última sync"  value={fTime(loc.ultima_sync)} />
                <SyncInfoRow label="Próxima sync" value={fTime(loc.proxima_sync)} />
                <SyncInfoRow
                  label="Registros"
                  value={fNum(loc.registros)}
                  valueStyle={{ color: loc.registros > 0 ? 'var(--color-text)' : 'var(--color-danger)', fontWeight: 600 }}
                />
                {loc.erro && (
                  <div style={{
                    marginTop: 4, fontSize: 11, color: 'var(--color-danger)',
                    background: 'var(--color-danger-subtle)',
                    borderRadius: 'var(--radius-sm)', padding: '4px 8px', lineHeight: 1.4,
                  }}>
                    {loc.erro}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Histórico */}
      <SectionCard title="Histórico de Sincronizações">
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 160px 160px 80px 90px 100px 24px',
          gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
          background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
        }}>
          {['Unidade', 'Início', 'Fim', 'Duração', 'Registros', 'Status', ''].map((h, i) => (
            <div key={h + i} style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i >= 3 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {/* Linhas */}
        {historico.map((row, idx) => {
          const hasErr = row.status === 'failed' && row.erro;
          const isExp  = expandedErr === row.id;

          return (
            <div key={row.id}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 160px 160px 80px 90px 100px 24px',
                gap: 12, padding: '0 var(--space-5)',
                height: 'var(--table-row-height)', alignItems: 'center',
                borderBottom: idx < historico.length - 1 || isExp ? '1px solid var(--color-border)' : 'none',
                background: isExp ? 'var(--color-bg-subtle)' : 'transparent',
              }}>
                <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500 }}>{row.location}</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {fTime(row.inicio)}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {fTime(row.fim)}
                </div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', textAlign: 'right' }}>
                  {row.duracao}
                </div>
                <div style={{
                  fontSize: 12, fontFamily: 'var(--font-mono)', textAlign: 'right',
                  color: row.registros > 0 ? 'var(--color-text)' : 'var(--color-danger)',
                  fontWeight: row.registros > 0 ? 500 : 700,
                }}>
                  {fNum(row.registros)}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={row.status} />
                </div>
                {hasErr ? (
                  <button
                    onClick={() => setExpandedErr(isExp ? null : row.id)}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', padding: 2 }}
                  >
                    <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                      style={{ transform: isExp ? 'rotate(180deg)' : 'none', display: 'block' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                ) : <div />}
              </div>

              {/* Linha de erro expandida */}
              {isExp && hasErr && (
                <div style={{
                  padding: '10px var(--space-5)',
                  background: 'var(--color-danger-subtle)',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <span style={{ fontSize: 12, color: 'var(--color-danger)', fontFamily: 'var(--font-mono)' }}>
                    {row.erro}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// Linha de detalhe dentro do card de location
function SyncInfoRow({ label, value, valueStyle }: {
  label: string;
  value: string;
  valueStyle?: React.CSSProperties;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{label}</span>
      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', ...valueStyle }}>
        {value}
      </span>
    </div>
  );
}
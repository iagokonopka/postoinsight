type StatusType = 'success' | 'failed' | 'running' | 'warning' | 'online' | 'offline';

interface StatusBadgeProps {
  status: StatusType | string;
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  success: { label: 'Concluído',    bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
  failed:  { label: 'Falhou',       bg: 'var(--color-danger-subtle)',  color: 'var(--color-danger)' },
  running: { label: 'Em andamento', bg: 'var(--color-info-subtle)',    color: 'var(--color-info)' },
  warning: { label: 'Alerta',       bg: 'var(--color-warning-subtle)', color: 'var(--color-warning)' },
  online:  { label: 'Online',       bg: 'var(--color-success-subtle)', color: 'var(--color-success)' },
  offline: { label: 'Offline',      bg: 'var(--color-danger-subtle)',  color: 'var(--color-danger)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.warning;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '2px 8px',
      borderRadius: 100,
      fontSize: 11,
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
}
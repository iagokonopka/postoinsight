import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { usePeriodo, PERIODOS, type PeriodoId } from '@/hooks/use-periodo';
import { useLocationFilter, type LocationFilter } from '@/hooks/use-location-filter';
import { APP_NAME } from '@/lib/config';

// Shape mínimo de location para o seletor
export interface TopbarLocation {
  id: string;
  nome: string;
}

interface TopbarProps {
  locations: TopbarLocation[];
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export function Topbar({ locations, sidebarCollapsed, onToggleSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const { periodoId, setPeriodo } = usePeriodo();
  const { locationId, setLocationId } = useLocationFilter();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  // Iniciais do usuário para o avatar
  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase()
    : '?';

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        height: 'var(--topbar-height)',
        background: 'var(--color-topbar)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        gap: 8,
      }}
    >
      {/* Toggle sidebar */}
      <button
        onClick={onToggleSidebar}
        title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--color-topbar-muted)',
          padding: '4px 6px',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          marginRight: 6,
        }}
      >
        <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 20 }}>
        <div style={{
          width: 26, height: 26,
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-cta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width={13} height={13} fill="none" stroke="white" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#fff', letterSpacing: '-0.01em' }}>
          {APP_NAME}
        </span>
      </div>

      {/* Seletor de período */}
      <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {PERIODOS.map((p) => {
          const active = periodoId === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPeriodo(p.id as PeriodoId)}
              style={{
                padding: '4px 12px',
                borderRadius: 'var(--radius-sm)',
                border: active ? '1px solid rgba(255,255,255,.3)' : '1px solid transparent',
                background: active ? 'rgba(255,255,255,.12)' : 'transparent',
                color: active ? '#fff' : 'var(--color-topbar-muted)',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all .1s',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1 }} />

      {/* Seletor de location */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '4px 10px',
        border: '1px solid rgba(255,255,255,.15)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
      }}>
        <span style={{
          width: 6, height: 6,
          borderRadius: '50%',
          background: 'var(--color-success)',
          display: 'inline-block',
          flexShrink: 0,
        }} />
        <select
          value={locationId}
          onChange={(e) => setLocationId(e.target.value as LocationFilter)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontFamily: 'inherit',
            fontSize: 12,
            cursor: 'pointer',
            outline: 'none',
            appearance: 'none',
            paddingRight: 16,
          }}
        >
          <option value="all" style={{ color: '#16191F', background: '#fff' }}>
            Todas as unidades
          </option>
          {locations.map((l) => (
            <option key={l.id} value={l.id} style={{ color: '#16191F', background: '#fff' }}>
              {l.nome}
            </option>
          ))}
        </select>
        <svg
          width={10} height={10}
          viewBox="0 0 10 10"
          fill="none"
          stroke="rgba(255,255,255,.5)"
          strokeWidth={1.8}
          style={{ pointerEvents: 'none', marginLeft: -14, flexShrink: 0 }}
        >
          <path strokeLinecap="round" d="M2 4l3 3 3-3" />
        </svg>
      </div>

      {/* Avatar com dropdown de logout */}
      <div
        onClick={handleLogout}
        title="Sair"
        style={{
          width: 30, height: 30,
          borderRadius: '50%',
          background: 'var(--color-cta)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#fff',
          cursor: 'pointer',
          marginLeft: 4,
          userSelect: 'none',
        }}
      >
        {initials}
      </div>
    </header>
  );
}
import { Link, useLocation } from 'react-router-dom';
import { APP_NAME } from '@/lib/config';

// Definição da navegação — espelhada do layout.jsx do design
const NAV = [
  {
    section: 'Análise',
    items: [
      {
        to: '/dashboard',
        label: 'Visão Geral',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        to: '/combustivel',
        label: 'Combustível',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      },
      {
        to: '/conveniencia',
        label: 'Conveniência',
        icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
      },
      {
        to: '/dre',
        label: 'DRE Mensal',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
    ],
  },
  {
    section: 'Operação',
    items: [
      {
        to: '/sync',
        label: 'Sincronização',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      },
    ],
  },
  {
    section: null,
    items: [
      {
        to: '/settings',
        label: 'Configurações',
        icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z',
      },
    ],
  },
];

interface SidebarProps {
  tenantName?: string;
  locationCount?: number;
  hasSyncError?: boolean;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

export function Sidebar({
  tenantName,
  locationCount,
  hasSyncError = false,
  theme,
  onThemeToggle,
}: SidebarProps) {
  const location = useLocation();

  // Verifica se a rota atual corresponde ao item de nav
  function isActive(to: string) {
    return location.pathname === to || location.pathname.startsWith(to + '/');
  }

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        borderRight: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 'var(--topbar-height)',
        left: 0,
        bottom: 0,
        zIndex: 20,
        overflowY: 'auto',
      }}
    >
      {/* Cabeçalho da sidebar com nome do tenant */}
      <div style={{
        padding: '16px var(--space-4) 12px',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>
          {APP_NAME}
        </div>
        {tenantName && (
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
            {tenantName}{locationCount ? ` · ${locationCount} unidades` : ''}
          </div>
        )}
      </div>

      {/* Navegação */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV.map((group, gi) => (
          <div key={gi} style={{ marginBottom: 2 }}>
            {group.section && (
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                padding: '10px 16px 4px',
              }}>
                {group.section}
              </div>
            )}
            {group.items.map((item) => {
              const active = isActive(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    padding: '0 16px',
                    height: 32,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: active ? 500 : 400,
                    background: active ? 'var(--color-primary-subtle)' : 'transparent',
                    color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                    borderLeft: `3px solid ${active ? 'var(--color-primary)' : 'transparent'}`,
                    transition: 'all .1s',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Rodapé: status de sync + toggle de tema */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--color-border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: hasSyncError ? 'var(--color-warning)' : 'var(--color-success)',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
            {hasSyncError ? '1 offline' : 'Sync OK'}
          </span>
        </div>
        <button
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-muted)',
            padding: 4,
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            {theme === 'dark' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            )}
          </svg>
        </button>
      </div>
    </aside>
  );
}
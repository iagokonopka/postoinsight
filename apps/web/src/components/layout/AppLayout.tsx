import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from './Topbar';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';

// Shape mínimo de location vindo da API
interface LocationItem {
  id: string;
  nome: string;
  status?: string;
}

interface LocationsResponse {
  locations: LocationItem[];
}

export function AppLayout() {
  const { user, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // Persiste preferência de tema no localStorage
    return (localStorage.getItem('pi-theme') as 'light' | 'dark') ?? 'light';
  });

  // Aplica o tema no atributo data-theme do html
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('pi-theme', theme);
  }, [theme]);

  // Busca as locations do tenant para o seletor da Topbar
  const { data: locationsData } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get<LocationsResponse>('/api/v1/locations'),
    enabled: !!user,
  });

  const locations = locationsData?.locations ?? [];
  const hasSyncError = locations.some((l) => l.status === 'failed' || l.status === 'offline');

  // Aguarda restauração da sessão antes de redirecionar
  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg-subtle)',
        color: 'var(--color-text-muted)',
        fontSize: 13,
      }}>
        Carregando…
      </div>
    );
  }

  // Redireciona para login se não autenticado
  if (!user) return <Navigate to="/login" replace />;

  const sidebarLeft = sidebarCollapsed ? 0 : 'var(--sidebar-width)';

  return (
    <>
      <Topbar
        locations={locations}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((c) => !c)}
      />
      {!sidebarCollapsed && (
        <Sidebar
          tenantName={user.name}
          locationCount={locations.length}
          hasSyncError={hasSyncError}
          theme={theme}
          onThemeToggle={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        />
      )}
      <main
        style={{
          marginTop: 'var(--topbar-height)',
          marginLeft: sidebarLeft,
          minHeight: 'calc(100vh - var(--topbar-height))',
          background: 'var(--color-bg-subtle)',
          transition: 'margin-left 0.15s ease',
        }}
      >
        <Outlet />
      </main>
    </>
  );
}
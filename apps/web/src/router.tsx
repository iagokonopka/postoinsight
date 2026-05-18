import { createBrowserRouter, Navigate } from 'react-router-dom';
import { PrivateRoute } from '@/components/layout/PrivateRoute';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';

// ── Placeholder pages (replaced as each phase is implemented) ─────────────────

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">Em implementação…</p>
    </div>
  );
}

function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
      <p className="text-6xl font-bold text-muted-foreground/30">404</p>
      <h1 className="text-xl font-semibold text-foreground">Página não encontrada</h1>
      <a href="/dashboard" className="text-sm text-primary hover:underline">
        Voltar ao início
      </a>
    </div>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Public
  { path: '/login', element: <LoginPage /> },

  // Root redirect
  { path: '/', element: <Navigate to="/dashboard" replace /> },

  // Private — analytical pages
  {
    path: '/dashboard',
    element: (
      <PrivateRoute>
        <DashboardPage />
      </PrivateRoute>
    ),
  },
  {
    path: '/combustivel',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Combustível" />
      </PrivateRoute>
    ),
  },
  {
    path: '/arla',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Arla 32" />
      </PrivateRoute>
    ),
  },
  {
    path: '/lubrificantes',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Lubrificantes" />
      </PrivateRoute>
    ),
  },
  {
    path: '/conveniencia',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Conveniência" />
      </PrivateRoute>
    ),
  },
  {
    path: '/dre',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="DRE Mensal" />
      </PrivateRoute>
    ),
  },
  {
    path: '/sync',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Sincronização" />
      </PrivateRoute>
    ),
  },

  // Private — settings (sub-routes)
  { path: '/settings', element: <Navigate to="/settings/profile" replace /> },
  {
    path: '/settings/profile',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Perfil" />
      </PrivateRoute>
    ),
  },
  {
    path: '/settings/locations',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Unidades" />
      </PrivateRoute>
    ),
  },
  {
    path: '/settings/users',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Usuários" />
      </PrivateRoute>
    ),
  },
  {
    path: '/settings/integrations',
    element: (
      <PrivateRoute>
        <PlaceholderPage title="Integrações" />
      </PrivateRoute>
    ),
  },

  // 404
  { path: '*', element: <NotFoundPage /> },
]);

/**
 * App — roteamento principal
 * Rotas protegidas ficam dentro do shell (AppLayout)
 * Rotas públicas ficam fora (ex: /login)
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { FilterProvider } from '@/contexts/FilterContext';
import { TenantProvider } from '@/contexts/TenantContext';

// Páginas — importadas diretamente (sem lazy por enquanto)
import { LoginPage } from '@/pages/LoginPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { CombustivelPage } from '@/pages/CombustivelPage';
import { ConvenienciaPage } from '@/pages/ConvenienciaPage';
import { DrePage } from '@/pages/DrePage';
import { SyncPage } from '@/pages/SyncPage';
import { SettingsPage } from '@/pages/SettingsPage';

/** Guard: redireciona para /login se não autenticado */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <TenantProvider>
      <FilterProvider>{children}</FilterProvider>
    </TenantProvider>
  );
}

export function App() {
  return (
    <Routes>
      {/* Pública */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protegidas — dentro do shell */}
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="combustivel" element={<CombustivelPage />} />
        <Route path="conveniencia" element={<ConvenienciaPage />} />
        <Route path="dre" element={<DrePage />} />
        <Route path="sync" element={<SyncPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

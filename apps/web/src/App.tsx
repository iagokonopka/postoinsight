import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { AuthProvider } from '@/lib/auth-context';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/login/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { CombustivelPage } from '@/pages/combustivel/CombustivelPage';
import { ConvenienciaPage } from '@/pages/conveniencia/ConvenienciaPage';
import { DrePage } from '@/pages/dre/DrePage';
import { SyncPage } from '@/pages/sync/SyncPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rotas protegidas — AppLayout valida autenticação */}
            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"   element={<DashboardPage />} />
              <Route path="/combustivel" element={<CombustivelPage />} />
              <Route path="/conveniencia" element={<ConvenienciaPage />} />
              <Route path="/dre"         element={<DrePage />} />
              <Route path="/sync"        element={<SyncPage />} />
              <Route path="/settings"    element={<SettingsPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { AppShell } from '@/components/layout/AppShell'
import { ToastProvider } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import LoginPage from '@/pages/LoginPage'
import DefinirSenhaPage from '@/pages/DefinirSenhaPage'
import RecuperarSenhaPage from '@/pages/RecuperarSenhaPage'
import VisaoGeralPage from '@/pages/VisaoGeralPage'
import CombustivelPage from '@/pages/CombustivelPage'
import ArlaPage from '@/pages/ArlaPage'
import LubrificantesPage from '@/pages/LubrificantesPage'
import ConvenienciaPage from '@/pages/ConvenienciaPage'
import DrePage from '@/pages/DrePage'
import SincronizacaoPage from '@/pages/SincronizacaoPage'
import ConfiguracoesPage from '@/pages/ConfiguracoesPage'
import ProdutoPage from '@/pages/ProdutoPage'
import AssistentePage from '@/pages/AssistentePage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

export default function App() {
  return (
    <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<GuestRoute />} />
                {/* Rotas públicas de ativação/recuperação — fora do ProtectedShell */}
                <Route path="/ativar" element={<DefinirSenhaPage />} />
                <Route path="/redefinir-senha" element={<DefinirSenhaPage />} />
                <Route path="/recuperar" element={<RecuperarSenhaPage />} />
                <Route element={<ProtectedShell />}>
                  <Route path="/" element={<VisaoGeralPage />} />
                  <Route path="/combustivel" element={<CombustivelPage />} />
                  <Route path="/arla" element={<ArlaPage />} />
                  <Route path="/lubrificantes" element={<LubrificantesPage />} />
                  <Route path="/conveniencia" element={<ConvenienciaPage />} />
                  <Route path="/dre" element={<DrePage />} />
                  <Route path="/assistente" element={<AssistentePage />} />
                  <Route path="/sincronizacao" element={<SincronizacaoPage />} />
                  <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                  <Route path="/produto/:id" element={<ProdutoPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

// ─── Auth guards ──────────────────────────────────────────────────────────────

// Shows /login only when unauthenticated. Redirects to / if already logged in.
function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

// Shows AppShell only when authenticated. Redirects to /login if no session.
function ProtectedShell() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <AppShell />
}

// Shown while GET /auth/me is in-flight — prevents white flash
function FullPageSpinner() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
      background: 'hsl(var(--background))',
    }}>
      <span style={{
        width: '32px', height: '32px',
        border: '3px solid hsl(var(--muted))',
        borderTopColor: 'hsl(var(--primary))',
        borderRadius: '999px',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }} />
    </div>
  )
}

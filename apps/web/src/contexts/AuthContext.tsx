/**
 * AuthContext — gerencia sessão do usuário
 * Chama GET /auth/me no boot para restaurar sessão via cookie HttpOnly
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '@/lib/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  tenantId?: string;
  role?: 'owner' | 'manager' | 'viewer';
  locationId?: string; // preenchido para managers
  platformRole?: 'superadmin' | 'support';
}

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restaura sessão no boot via cookie existente
  useEffect(() => {
    // skipAuthRedirect: evita redirect loop — 401 aqui significa "não logado", não sessão expirada
    api
      .get<AuthUser>('/auth/me', { skipAuthRedirect: true })
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const data = await api.post<AuthUser>('/auth/login', { email, password });
    setUser(data);
  }

  async function logout() {
    await api.post('/auth/logout');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}

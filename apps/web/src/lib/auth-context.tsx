import React, { createContext, useCallback, useEffect, useState } from 'react';
import { api, ApiError } from './api';

// Shape do usuário retornado pela API (ADR-012)
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'viewer';
  platformRole: 'superadmin' | 'support' | null;
  tenantId: string;
  locationId: string | null;
}

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restaura sessão ao carregar o app via GET /auth/me
  useEffect(() => {
    api
      .get<{ user: AuthUser }>('/auth/me')
      .then((data) => setUser(data.user))
      .catch((err) => {
        // 401 = não autenticado — estado inicial normal
        if (err instanceof ApiError && err.status === 401) return;
        console.error('Erro ao restaurar sessão:', err);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await api.post<{ user: AuthUser }>('/auth/login', payload);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout', {});
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Não refaz fetch ao focar a janela — dados de BI não mudam em segundos
      refetchOnWindowFocus: false,
      // 5 minutos de stale time para dados analíticos
      staleTime: 5 * 60 * 1000,
      // Não retenta se o erro for 401 (não autenticado) ou 403 (sem permissão)
      retry: (failureCount, error) => {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});
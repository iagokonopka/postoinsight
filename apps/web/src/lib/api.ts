import { API_URL } from './config';

// Erros da API com status HTTP
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fetch wrapper: sempre usa credentials: 'include' para o cookie HttpOnly ser
// enviado automaticamente. Nunca manipula o token diretamente (ADR-012).
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_URL}${path}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }

  // 204 No Content — sem body
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// Atalhos para os métodos HTTP mais usados
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  put: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),

  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
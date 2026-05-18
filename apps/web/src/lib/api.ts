/**
 * Fetch helper — PostoInsight
 * - Envia cookies automaticamente (credentials: 'include')
 * - Redireciona para /login em 401
 * - Lança ApiError em respostas de erro
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends RequestInit {
  /** Se true, não redireciona para /login em 401 — apenas lança ApiError */
  skipAuthRedirect?: boolean;
}

async function request<T>(path: string, init?: RequestOptions): Promise<T> {
  const { skipAuthRedirect, ...fetchInit } = init ?? {};

  const res = await fetch(path, {
    ...fetchInit,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...fetchInit?.headers,
    },
  });

  if (res.status === 401) {
    if (!skipAuthRedirect) {
      window.location.href = '/login?reason=session_expired';
    }
    throw new ApiError(401, 'Sessão expirada');
  }

  if (!res.ok) {
    let message = `Erro ${res.status}`;
    try {
      const body = await res.json();
      message = body?.message ?? body?.error ?? message;
    } catch {
      // mantém mensagem padrão
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, opts),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

/** Monta query string a partir de um objeto, omitindo valores undefined/null */
export function buildQuery(params: Record<string, string | number | boolean | null | undefined>): string {
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      q.set(key, String(value));
    }
  }
  const str = q.toString();
  return str ? `?${str}` : '';
}

import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { clientEnv } from './env'

/**
 * Server-side fetcher para a API Fastify.
 *
 * Estratégia de autenticação: encaminha os cookies da sessão Auth.js para a API.
 * A API valida a sessão via mesmo AUTH_SECRET e deriva tenant_id da sessão —
 * nunca aceitando tenant_id como parâmetro externo (ver spec dashboard-vendas §6, §9).
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const session = await auth()
  if (!session?.user?.id) {
    throw new Error('UNAUTHENTICATED')
  }

  const cookieHeader = cookies()
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ')

  const url = new URL(path, clientEnv.NEXT_PUBLIC_API_URL).toString()

  const res = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      cookie: cookieHeader,
      ...(init.headers ?? {}),
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${text || res.statusText}`)
  }

  return (await res.json()) as T
}

export function buildQuery(params: Record<string, string | string[] | undefined>): string {
  const usp = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    if (Array.isArray(v)) v.forEach((vv) => usp.append(k, vv))
    else usp.set(k, v)
  }
  const s = usp.toString()
  return s ? `?${s}` : ''
}

import type { FastifyRequest, FastifyReply } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { decode } from '@auth/core/jwt'
import { db } from '../db.js'
import { tenants } from '@postoinsight/db'
import { env } from '../env.js'

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string
    userId?: string
    role?: 'owner' | 'manager' | 'viewer' | null
    platformRole?: 'superadmin' | 'support' | null
  }
}

/**
 * Cookies do Auth.js v5 em estratégia JWT. O cookie é um JWE (HKDF + A256GCM)
 * encriptado com AUTH_SECRET. O salt usado na derivação da chave é o nome do
 * próprio cookie — daí precisarmos tentar os dois nomes (http vs https).
 */
const COOKIE_NAMES = [
  '__Secure-authjs.session-token',
  'authjs.session-token',
] as const

interface AuthClaims {
  /** user.id — gravado pelo callback jwt do apps/web */
  id?: string
  /** Compatibilidade — Auth.js também grava sub */
  sub?: string
  tenantId?: string
  tenantSlug?: string
  role?: 'owner' | 'manager' | 'viewer'
  platformRole?: 'superadmin' | 'support'
}

/**
 * preHandler que resolve a sessão Auth.js v5 (estratégia JWT).
 *
 * Fluxo:
 * 1. Lê o JWE do cookie (ou Authorization: Bearer)
 * 2. Decripta via @auth/core/jwt.decode usando AUTH_SECRET + salt = nome do cookie
 * 3. Extrai tenantId, userId e roles direto dos claims (sem hit no banco)
 * 4. Se for platform user e enviar header `x-tenant-id`, valida que o tenant
 *    existe e está ativo (impersonation para support/superadmin).
 *
 * Regras absolutas:
 * - tenantId nunca aceito de query/body. Sempre derivado do JWT (ou header
 *   x-tenant-id, mas só com platformRole válida).
 * - Se o JWT não tiver tenantId, retorna 403 (user sem tenant ativo).
 */
export async function requireTenantSession(
  req: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const extracted = extractToken(req)
  if (!extracted) {
    reply.status(401).send({ error: 'Não autenticado' })
    return
  }

  const claims = await decodeWithFallback(extracted)
  if (!claims) {
    reply.status(401).send({ error: 'Sessão inválida ou expirada' })
    return
  }

  const userId = claims.id ?? claims.sub
  if (!userId) {
    reply.status(401).send({ error: 'Sessão sem identificador de usuário' })
    return
  }

  req.userId       = userId
  req.role         = claims.role         ?? null
  req.platformRole = claims.platformRole ?? null

  const requestedTenantId = (req.headers['x-tenant-id'] as string | undefined)?.trim()

  // Platform users podem impersonar qualquer tenant via header
  if (requestedTenantId) {
    if (!claims.platformRole) {
      reply.status(403).send({ error: 'Apenas platform users podem trocar de tenant' })
      return
    }
    const [tenant] = await db
      .select({ id: tenants.id })
      .from(tenants)
      .where(and(eq(tenants.id, requestedTenantId), eq(tenants.active, true)))
      .limit(1)
    if (!tenant) {
      reply.status(404).send({ error: 'Tenant não encontrado' })
      return
    }
    req.tenantId = requestedTenantId
    return
  }

  // Caso normal: tenantId vem direto do JWT
  if (claims.tenantId) {
    req.tenantId = claims.tenantId
    return
  }

  // Sem tenantId no token e sem header — platform users sem tenant escolhido
  if (claims.platformRole) {
    reply.status(400).send({ error: 'Header x-tenant-id obrigatório para platform users' })
    return
  }

  reply.status(403).send({ error: 'Usuário sem tenant ativo' })
}

interface ExtractedToken {
  token: string
  /** Origem do token — define o salt a tentar */
  source: 'cookie:secure' | 'cookie:plain' | 'bearer'
}

function extractToken(req: FastifyRequest): ExtractedToken | null {
  const auth = req.headers['authorization']
  if (auth?.startsWith('Bearer ')) {
    return { token: auth.slice(7).trim(), source: 'bearer' }
  }
  const cookieHeader = req.headers['cookie']
  if (!cookieHeader) return null
  for (const name of COOKIE_NAMES) {
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${escapeRe(name)}=([^;]+)`))
    if (match && match[1]) {
      return {
        token:  decodeURIComponent(match[1]),
        source: name.startsWith('__Secure-') ? 'cookie:secure' : 'cookie:plain',
      }
    }
  }
  return null
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Decriptografa o JWE. O salt no Auth.js v5 é o nome do cookie. Para
 * tokens vindos via Bearer (sem cookie), tentamos ambos os nomes.
 */
async function decodeWithFallback(extracted: ExtractedToken): Promise<AuthClaims | null> {
  const candidates =
    extracted.source === 'cookie:secure' ? ['__Secure-authjs.session-token']
    : extracted.source === 'cookie:plain' ? ['authjs.session-token']
    : [...COOKIE_NAMES]

  for (const salt of candidates) {
    try {
      const claims = await decode({ token: extracted.token, secret: env.AUTH_SECRET, salt })
      if (claims) return claims as AuthClaims
    } catch {
      // tenta o próximo salt
    }
  }
  return null
}

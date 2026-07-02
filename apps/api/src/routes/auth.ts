import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import '@fastify/cookie'
import { eq, and, isNull } from 'drizzle-orm'
import { encode } from '@auth/core/jwt'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { users, tenants, tenantUsers, platformUsers, loginHistory, auditLog } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import { env } from '../env.js'
import {
  createOneTimeToken,
  consumeOneTimeToken,
  getTokenContext,
  invalidateUserTokens,
} from '../lib/one-time-tokens.js'
import { sendAuthEmail } from '../lib/auth-email.js'

/**
 * Tempo de vida da sessão em segundos — 8 horas.
 * Alinhado com o padrão Auth.js v5.
 */
const SESSION_MAX_AGE = 8 * 60 * 60

/** Tempo de vida da sessão com "Manter conectado" — 30 dias. */
const REMEMBER_ME_MAX_AGE = 30 * 24 * 60 * 60

/**
 * Número máximo de tentativas de login antes do bloqueio temporário.
 * Após atingir o limite, a conta fica bloqueada por LOCK_DURATION_MINUTES.
 */
const MAX_FAILED_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

/**
 * Nome do cookie de sessão.
 * Deve coincidir com os salts em apps/api/src/lib/auth.ts.
 */
const COOKIE_NAME = env.NODE_ENV === 'production'
  ? '__Secure-authjs.session-token'
  : 'authjs.session-token'

/**
 * Emite o JWE de sessão usando o mesmo mecanismo do Auth.js v5.
 * O salt = nome do cookie — idêntico ao usado em decodeWithFallback().
 */
async function issueSessionToken(
  claims: Record<string, unknown>,
  maxAge: number = SESSION_MAX_AGE,
): Promise<string> {
  return encode({
    token:  { ...claims, iat: Math.floor(Date.now() / 1000) },
    secret: env.AUTH_SECRET,
    salt:   COOKIE_NAME,
    maxAge,
  })
}

/**
 * Configura o cookie de sessão na resposta.
 * - HttpOnly: JS nunca acessa o token
 * - SameSite=None + Secure: necessário para cross-site (frontend e API em subdomínios
 *   distintos do Railway, que estão na Public Suffix List e são tratados como sites separados)
 * - Em dev: SameSite=Lax sem Secure para funcionar via http://localhost
 */
function setSessionCookie(
  reply: FastifyReply,
  token: string,
  maxAge: number = SESSION_MAX_AGE,
): void {
  const isProd = env.NODE_ENV === 'production'
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly:  true,
    sameSite:  isProd ? 'none' : 'lax',
    secure:    isProd,
    path:      '/',
    maxAge,
  })
}

/** Extrai o IP real do cliente considerando proxies (Railway usa proxy). */
function getClientIp(req: FastifyRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? req.ip
  return req.ip
}

interface SessionUser {
  id: string
  name: string | null
  email: string
}

interface ResolvedSession {
  claims: Record<string, unknown>
  user: {
    id: string
    name: string | null
    email: string
    role: string | null
    platformRole: string | null
    tenantId: string | null
    locationId: string | null
  }
}

/**
 * Resolve claims e payload de resposta para um usuário — mesma lógica usada pelo
 * login. Reutilizado por set-password e login-link. Retorna null se o usuário não
 * é platform user nem tem tenant ativo (estado inválido para sessão).
 */
async function resolveSession(user: SessionUser): Promise<ResolvedSession | null> {
  const [platform] = await db
    .select({ platformRole: platformUsers.platformRole })
    .from(platformUsers)
    .where(eq(platformUsers.userId, user.id))
    .limit(1)

  let tenantId:   string | undefined
  let role:       string | undefined
  let locationId: string | undefined

  if (!platform) {
    const [tu] = await db
      .select({
        tenantId:   tenantUsers.tenantId,
        role:       tenantUsers.role,
        locationId: tenantUsers.locationId,
      })
      .from(tenantUsers)
      .where(and(
        eq(tenantUsers.userId, user.id),
        eq(tenantUsers.active, true),
        isNull(tenantUsers.deletedAt),
      ))
      .limit(1)

    if (!tu) return null

    tenantId   = tu.tenantId
    role       = tu.role
    locationId = tu.locationId ?? undefined
  }

  const claims: Record<string, unknown> = {
    id:    user.id,
    email: user.email,
    name:  user.name,
    ...(platform
      ? { platformRole: platform.platformRole }
      : { tenantId, role, ...(locationId ? { locationId } : {}) }
    ),
  }

  return {
    claims,
    user: {
      id:           user.id,
      name:         user.name,
      email:        user.email,
      role:         role ?? null,
      platformRole: platform?.platformRole ?? null,
      tenantId:     tenantId ?? null,
      locationId:   locationId ?? null,
    },
  }
}

/**
 * Rotas de autenticação para o SPA.
 * Segue ADR-012: cookie HttpOnly gerenciado pelo Fastify.
 *
 * POST /auth/login           — valida credenciais, emite cookie de sessão
 * GET  /auth/me              — retorna dados do usuário autenticado
 * POST /auth/logout          — revoga o cookie de sessão
 * POST /auth/change-password — troca de senha com validação da senha atual
 */
export const authRoutes: FastifyPluginAsync = async (app) => {

  // -------------------------------------------------------------------------
  // POST /auth/login
  // -------------------------------------------------------------------------
  app.post('/login', async (req, reply) => {
    const body = req.body as { email?: unknown; password?: unknown; rememberMe?: unknown }

    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
      return reply.status(400).send({ error: 'email e password são obrigatórios' })
    }

    const email      = body.email.trim().toLowerCase()
    const password   = body.password
    const rememberMe = body.rememberMe === true
    const maxAge     = rememberMe ? REMEMBER_ME_MAX_AGE : SESSION_MAX_AGE
    const ipAddress = getClientIp(req)
    const userAgent = req.headers['user-agent'] ?? null

    // 1. Busca o usuário pelo e-mail
    const [user] = await db
      .select({
        id:                  users.id,
        name:                users.name,
        email:               users.email,
        passwordHash:        users.passwordHash,
        active:              users.active,
        lockedUntil:         users.lockedUntil,
        failedLoginAttempts: users.failedLoginAttempts,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    // Resposta genérica — não revelar se o e-mail existe
    const invalidReply = async () => {
      // Registra tentativa falha em login_history se o usuário existe
      if (user) {
        // Incrementa contador de falhas e aplica bloqueio se necessário
        const newCount = (user.failedLoginAttempts ?? 0) + 1
        const lockedUntil = newCount >= MAX_FAILED_ATTEMPTS
          ? new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
          : null

        await db.update(users)
          .set({
            failedLoginAttempts: newCount,
            ...(lockedUntil ? { lockedUntil } : {}),
            updatedAt: new Date(),
          })
          .where(eq(users.id, user.id))

        // Registra falha no histórico para BI / detecção de força bruta
        await db.insert(loginHistory).values({
          userId:    user.id,
          tenantId:  null,
          ipAddress,
          userAgent,
          success:   false,
        })
      }
      return reply.status(401).send({ error: 'Credenciais inválidas' })
    }

    if (!user || !user.passwordHash) return invalidReply()
    if (!user.active)                return invalidReply()
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return reply.status(403).send({ error: 'Conta bloqueada temporariamente. Tente novamente mais tarde.' })
    }

    // 2. Valida a senha
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) return invalidReply()

    // 3. Verifica se é platform user
    const [platform] = await db
      .select({ platformRole: platformUsers.platformRole })
      .from(platformUsers)
      .where(eq(platformUsers.userId, user.id))
      .limit(1)

    let tenantId:   string | undefined
    let role:       string | undefined
    let locationId: string | undefined

    if (!platform) {
      // 4a. Usuário de tenant — busca o tenant ativo
      const [tu] = await db
        .select({
          tenantId:   tenantUsers.tenantId,
          role:       tenantUsers.role,
          locationId: tenantUsers.locationId,
        })
        .from(tenantUsers)
        .where(and(
          eq(tenantUsers.userId, user.id),
          eq(tenantUsers.active, true),
          isNull(tenantUsers.deletedAt),
        ))
        .limit(1)

      if (!tu) {
        return reply.status(403).send({ error: 'Usuário sem tenant ativo' })
      }

      tenantId   = tu.tenantId
      role       = tu.role
      locationId = tu.locationId ?? undefined
    }

    // 5. Login bem-sucedido: zera contadores e atualiza last_login_at
    await db.update(users)
      .set({
        failedLoginAttempts: 0,
        lockedUntil:         null,
        lastLoginAt:         new Date(),
        updatedAt:           new Date(),
      })
      .where(eq(users.id, user.id))

    // 6. Registra login bem-sucedido no histórico
    await db.insert(loginHistory).values({
      userId:    user.id,
      tenantId:  tenantId ?? null,
      ipAddress,
      userAgent,
      success:   true,
    })

    // 7. Emite o JWE — locationId incluído apenas para managers
    const claims: Record<string, unknown> = {
      id:    user.id,
      email: user.email,
      name:  user.name,
      ...(platform
        ? { platformRole: platform.platformRole }
        : { tenantId, role, ...(locationId ? { locationId } : {}) }
      ),
    }

    const token = await issueSessionToken(claims, maxAge)

    // 8. Seta o cookie HttpOnly e retorna dados do usuário (sem o token)
    setSessionCookie(reply, token, maxAge)
    return reply.send({
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         role ?? null,
        platformRole: platform?.platformRole ?? null,
        tenantId:     tenantId ?? null,
        locationId:   locationId ?? null,
      },
    })
  })

  // -------------------------------------------------------------------------
  // GET /auth/me — restaura sessão após reload do SPA
  // -------------------------------------------------------------------------
  app.get('/me', { preHandler: requireTenantSession }, async (req, reply) => {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1)

    if (!user) {
      return reply.status(401).send({ error: 'Usuário não encontrado' })
    }

    // Busca nome do tenant quando há sessão de tenant
    let tenantName: string | null = null
    if (req.tenantId) {
      const [tenant] = await db
        .select({ name: tenants.name })
        .from(tenants)
        .where(eq(tenants.id, req.tenantId))
        .limit(1)
      tenantName = tenant?.name ?? null
    }

    return reply.send({
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         req.role         ?? null,
        platformRole: req.platformRole ?? null,
        tenantId:     req.tenantId     ?? null,
        locationId:   req.locationId   ?? null,
        tenantName,
      },
    })
  })

  // -------------------------------------------------------------------------
  // POST /auth/logout
  // -------------------------------------------------------------------------
  app.post('/logout', async (_req, reply) => {
    reply.clearCookie(COOKIE_NAME, { path: '/' })
    return reply.send({ ok: true })
  })

  // -------------------------------------------------------------------------
  // POST /auth/change-password
  // -------------------------------------------------------------------------
  app.post('/change-password', { preHandler: requireTenantSession }, async (req, reply) => {
    const body = req.body as { currentPassword?: unknown; newPassword?: unknown }

    if (typeof body?.currentPassword !== 'string' || typeof body?.newPassword !== 'string') {
      return reply.status(400).send({ error: 'currentPassword e newPassword são obrigatórios' })
    }

    if (body.newPassword.length < 8) {
      return reply.status(400).send({ error: 'A nova senha deve ter no mínimo 8 caracteres' })
    }

    // Busca hash atual do usuário autenticado
    const [user] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1)

    if (!user || !user.passwordHash) {
      return reply.status(401).send({ error: 'Usuário não encontrado' })
    }

    // Valida a senha atual antes de permitir a troca
    const currentValid = await bcrypt.compare(body.currentPassword, user.passwordHash)
    if (!currentValid) {
      return reply.status(401).send({ error: 'Senha atual incorreta' })
    }

    const newHash = await bcrypt.hash(body.newPassword, 12)

    // Atualiza o hash da senha e registra o momento da troca
    const now = new Date()
    await db.update(users)
      .set({ passwordHash: newHash, passwordChangedAt: now, updatedAt: now })
      .where(eq(users.id, req.userId!))

    // Registra a troca de senha no audit_log para rastreabilidade
    await db.insert(auditLog).values({
      tenantId:     req.tenantId ?? null,
      actorUserId:  req.userId!,
      action:       'user.password_changed',
      targetEntity: 'users',
      targetId:     req.userId!,
      ipAddress:    getClientIp(req),
    })

    return reply.send({ ok: true })
  })

  // -------------------------------------------------------------------------
  // GET /auth/set-password/context?token= — preview NÃO-consumidor
  // -------------------------------------------------------------------------
  app.get('/set-password/context', async (req, reply) => {
    const token = (req.query as { token?: unknown })?.token
    if (typeof token !== 'string' || !token) {
      return reply.send({ valid: false })
    }
    const ctx = await getTokenContext(token)
    return reply.send(ctx)
  })

  // -------------------------------------------------------------------------
  // POST /auth/set-password — consome activation|reset, grava senha, loga
  // -------------------------------------------------------------------------
  app.post('/set-password', async (req, reply) => {
    const body = req.body as { token?: unknown; password?: unknown }

    if (typeof body?.token !== 'string' || typeof body?.password !== 'string') {
      return reply.status(400).send({ error: 'token e password são obrigatórios' })
    }
    if (body.password.length < 8) {
      return reply.status(400).send({ error: 'A senha deve ter no mínimo 8 caracteres' })
    }

    // Consumo atômico (uso único) — aceita activation ou reset.
    const result = await consumeOneTimeToken(body.token, ['activation', 'reset'])
    if (!result.ok || !result.userId) {
      return reply.status(410).send({ error: 'Link expirado ou já utilizado' })
    }

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1)

    if (!user) {
      return reply.status(410).send({ error: 'Link expirado ou já utilizado' })
    }

    const now = new Date()
    const passwordHash = await bcrypt.hash(body.password, 12)

    await db.update(users)
      .set({
        passwordHash,
        passwordChangedAt:   now,
        active:              true,
        failedLoginAttempts: 0,
        lockedUntil:         null,
        updatedAt:           now,
      })
      .where(eq(users.id, user.id))

    // Invalida quaisquer outros tokens pendentes do usuário (reset/login/activation).
    await invalidateUserTokens(user.id)

    const session = await resolveSession(user)
    if (!session) {
      return reply.status(403).send({ error: 'Usuário sem tenant ativo' })
    }

    const ipAddress = getClientIp(req)
    const userAgent = req.headers['user-agent'] ?? null

    await db.insert(loginHistory).values({
      userId:   user.id,
      tenantId: session.user.tenantId,
      ipAddress,
      userAgent,
      success:  true,
    })

    await db.insert(auditLog).values({
      tenantId:     session.user.tenantId,
      actorUserId:  user.id,
      action:       'user.password_set_via_token',
      targetEntity: 'users',
      targetId:     user.id,
      ipAddress,
    })

    const token = await issueSessionToken(session.claims)
    setSessionCookie(reply, token)
    return reply.send({ user: session.user })
  })

  // -------------------------------------------------------------------------
  // POST /auth/forgot-password — sempre 200 (anti-enumeração)
  // -------------------------------------------------------------------------
  app.post('/forgot-password', async (req, reply) => {
    const email = (req.body as { email?: unknown })?.email
    if (typeof email !== 'string' || !email) {
      return reply.status(400).send({ error: 'email é obrigatório' })
    }
    await emitTokenEmail(req, email.trim().toLowerCase(), 'reset')
    return reply.send({ ok: true })
  })

  // -------------------------------------------------------------------------
  // POST /auth/login-link — sempre 200 (anti-enumeração)
  // -------------------------------------------------------------------------
  app.post('/login-link', async (req, reply) => {
    const email = (req.body as { email?: unknown })?.email
    if (typeof email !== 'string' || !email) {
      return reply.status(400).send({ error: 'email é obrigatório' })
    }
    await emitTokenEmail(req, email.trim().toLowerCase(), 'login')
    return reply.send({ ok: true })
  })

  // -------------------------------------------------------------------------
  // GET /auth/login-link/consume?token= — consome login, emite sessão
  // -------------------------------------------------------------------------
  app.get('/login-link/consume', async (req, reply) => {
    const token = (req.query as { token?: unknown })?.token
    const fail = () => reply.redirect(`${env.WEB_APP_URL}/recuperar?erro=link`)

    if (typeof token !== 'string' || !token) return fail()

    const result = await consumeOneTimeToken(token, ['login'])
    if (!result.ok || !result.userId) return fail()

    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1)
    if (!user) return fail()

    const session = await resolveSession(user)
    if (!session) return fail()

    await db.insert(loginHistory).values({
      userId:   user.id,
      tenantId: session.user.tenantId,
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] ?? null,
      success:  true,
    })

    const sessionToken = await issueSessionToken(session.claims)
    setSessionCookie(reply, sessionToken)
    return reply.redirect(`${env.WEB_APP_URL}/`)
  })

  // -------------------------------------------------------------------------
  // POST /auth/activation-token — (re)emite link de ativação (superadmin)
  // -------------------------------------------------------------------------
  app.post('/activation-token', { preHandler: requireTenantSession }, async (req, reply) => {
    if (req.platformRole !== 'superadmin') {
      return reply.status(403).send({ error: 'Apenas superadmin pode emitir links de ativação' })
    }

    const userId = (req.body as { userId?: unknown })?.userId
    if (typeof userId !== 'string' || !userId) {
      return reply.status(400).send({ error: 'userId é obrigatório' })
    }

    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    if (!user) {
      return reply.status(404).send({ error: 'Usuário não encontrado' })
    }

    const raw = await createOneTimeToken({
      userId:    user.id,
      purpose:   'activation',
      createdBy: req.userId!,
      requestIp: getClientIp(req),
      requestUserAgent: req.headers['user-agent'] ?? null,
    })

    const link = `${env.WEB_APP_URL}/ativar?token=${raw}`
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000)
    return reply.send({ link, expiresAt: expiresAt.toISOString() })
  })

  /**
   * Emite token + e-mail para um e-mail informado. Sempre silencioso:
   * se o usuário não existe ou está inativo, não faz nada (anti-enumeração).
   */
  async function emitTokenEmail(
    req: FastifyRequest,
    email: string,
    purpose: 'reset' | 'login',
  ): Promise<void> {
    const [user] = await db
      .select({ id: users.id, name: users.name, email: users.email, active: users.active })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (!user || !user.active) return

    const raw = await createOneTimeToken({
      userId:    user.id,
      purpose,
      requestIp: getClientIp(req),
      requestUserAgent: req.headers['user-agent'] ?? null,
    })

    // reset → tela do SPA; login → endpoint da API (consome + redireciona ao SPA).
    const link = purpose === 'reset'
      ? `${env.WEB_APP_URL}/redefinir-senha?token=${raw}`
      : `${env.API_PUBLIC_URL}/auth/login-link/consume?token=${raw}`

    await sendAuthEmail({ to: user.email, purpose, link, name: user.name })
  }
}
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify'
import '@fastify/cookie'
import { eq, and, isNull } from 'drizzle-orm'
import { encode } from '@auth/core/jwt'
import bcrypt from 'bcryptjs'
import { db } from '../db.js'
import { users, tenantUsers, platformUsers, loginHistory, auditLog } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import { env } from '../env.js'

/**
 * Tempo de vida da sessão em segundos — 8 horas.
 * Alinhado com o padrão Auth.js v5.
 */
const SESSION_MAX_AGE = 8 * 60 * 60

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
async function issueSessionToken(claims: Record<string, unknown>): Promise<string> {
  return encode({
    token:  { ...claims, iat: Math.floor(Date.now() / 1000) },
    secret: env.AUTH_SECRET,
    salt:   COOKIE_NAME,
    maxAge: SESSION_MAX_AGE,
  })
}

/**
 * Configura o cookie de sessão na resposta.
 * - HttpOnly: JS nunca acessa o token
 * - SameSite=Lax: protege contra CSRF em POST/PUT, permite navegação cross-site via link
 * - Secure: apenas HTTPS (omitido em dev para funcionar via http://localhost)
 * - Domain: .postoinsight.com.br em produção para cobrir subdomínios
 */
function setSessionCookie(reply: FastifyReply, token: string): void {
  const isProd = env.NODE_ENV === 'production'
  reply.setCookie(COOKIE_NAME, token, {
    httpOnly:  true,
    sameSite:  'lax',
    secure:    isProd,
    path:      '/',
    maxAge:    SESSION_MAX_AGE,
    ...(isProd && process.env.COOKIE_DOMAIN
      ? { domain: process.env.COOKIE_DOMAIN }
      : {}),
  })
}

/** Extrai o IP real do cliente considerando proxies (Railway usa proxy). */
function getClientIp(req: FastifyRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') return forwarded.split(',')[0]?.trim() ?? req.ip
  return req.ip
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
    const body = req.body as { email?: unknown; password?: unknown }

    if (typeof body?.email !== 'string' || typeof body?.password !== 'string') {
      return reply.status(400).send({ error: 'email e password são obrigatórios' })
    }

    const email    = body.email.trim().toLowerCase()
    const password = body.password
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

    const token = await issueSessionToken(claims)

    // 8. Seta o cookie HttpOnly e retorna dados do usuário (sem o token)
    setSessionCookie(reply, token)
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

    return reply.send({
      user: {
        id:           user.id,
        name:         user.name,
        email:        user.email,
        role:         req.role         ?? null,
        platformRole: req.platformRole ?? null,
        tenantId:     req.tenantId     ?? null,
        locationId:   req.locationId   ?? null,
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
}
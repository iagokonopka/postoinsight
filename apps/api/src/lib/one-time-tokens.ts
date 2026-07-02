import { randomBytes, createHash } from 'node:crypto'
import { and, eq, gt, isNull, inArray } from 'drizzle-orm'
import { db } from '../db.js'
import { oneTimeTokens, users, tenants, tenantUsers } from '@postoinsight/db'

/**
 * Núcleo de tokens de uso único — ativação, reset de senha e login por link.
 * O token bruto (32 bytes base64url) só existe no link enviado ao usuário;
 * no banco guarda-se apenas sha256(raw) em hex. Uso único é garantido por
 * UPDATE condicional em consumed_at (à prova de replay/corrida).
 * Spec: docs/specs/auth-ativacao.md · ADR-019.
 */

export type TokenPurpose = 'activation' | 'reset' | 'login'

/** TTL por propósito, em milissegundos. */
const TTL_MS: Record<TokenPurpose, number> = {
  activation: 72 * 60 * 60 * 1000, // 72h
  reset:      60 * 60 * 1000,      // 60min
  login:      15 * 60 * 1000,      // 15min
}

/** Calcula o hash hex de um token bruto. */
function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex')
}

interface CreateTokenInput {
  userId: string
  purpose: TokenPurpose
  createdBy?: string | null
  requestIp?: string | null
  requestUserAgent?: string | null
}

/**
 * Cria um token de uso único e retorna o token BRUTO (só existe aqui).
 * Invalida tokens anteriores não consumidos do mesmo (user_id, purpose).
 */
export async function createOneTimeToken(input: CreateTokenInput): Promise<string> {
  const raw = randomBytes(32).toString('base64url')
  const tokenHash = hashToken(raw)
  const expiresAt = new Date(Date.now() + TTL_MS[input.purpose])

  // Invalida tokens não consumidos anteriores do par (user_id, purpose).
  await db.update(oneTimeTokens)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(oneTimeTokens.userId, input.userId),
      eq(oneTimeTokens.purpose, input.purpose),
      isNull(oneTimeTokens.consumedAt),
    ))

  await db.insert(oneTimeTokens).values({
    userId:           input.userId,
    purpose:          input.purpose,
    tokenHash,
    expiresAt,
    createdBy:        input.createdBy ?? null,
    requestIp:        input.requestIp ?? null,
    requestUserAgent: input.requestUserAgent ?? null,
  })

  return raw
}

export interface TokenContext {
  valid: boolean
  email?: string
  name?: string | null
  tenantName?: string | null
  purpose?: TokenPurpose
}

/**
 * Preview NÃO-CONSUMIDOR: valida o token e retorna dados para pré-preencher a
 * tela de definir senha. Nunca consome o token.
 */
export async function getTokenContext(rawToken: string): Promise<TokenContext> {
  const tokenHash = hashToken(rawToken)

  const [row] = await db
    .select({
      userId:    oneTimeTokens.userId,
      purpose:   oneTimeTokens.purpose,
      expiresAt: oneTimeTokens.expiresAt,
      consumedAt: oneTimeTokens.consumedAt,
      email:     users.email,
      name:      users.name,
    })
    .from(oneTimeTokens)
    .innerJoin(users, eq(users.id, oneTimeTokens.userId))
    .where(eq(oneTimeTokens.tokenHash, tokenHash))
    .limit(1)

  if (!row || row.consumedAt || row.expiresAt <= new Date()) {
    return { valid: false }
  }

  // Nome do tenant (se houver) para exibição na tela de ativação.
  // Um owner pertence a um único tenant ativo.
  const [tenantRow] = await db
    .select({ name: tenants.name })
    .from(tenantUsers)
    .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
    .where(and(
      eq(tenantUsers.userId, row.userId),
      eq(tenantUsers.active, true),
      isNull(tenantUsers.deletedAt),
    ))
    .limit(1)
  const tenantName = tenantRow?.name ?? null

  return {
    valid:      true,
    email:      row.email,
    name:       row.name,
    tenantName,
    purpose:    row.purpose as TokenPurpose,
  }
}

export interface ConsumeResult {
  ok: boolean
  userId?: string
  purpose?: TokenPurpose
}

/**
 * Consome um token atomicamente. Retorna { ok: true, userId } apenas se o token
 * existe, é do propósito esperado, não foi consumido e não expirou.
 * `expectedPurposes` permite aceitar mais de um propósito (ex.: activation|reset).
 */
export async function consumeOneTimeToken(
  rawToken: string,
  expectedPurposes: TokenPurpose[],
): Promise<ConsumeResult> {
  const tokenHash = hashToken(rawToken)

  // Consumo atômico: só atualiza se for do propósito esperado, ainda não
  // consumido e não expirado. Tokens de outro propósito não são tocados.
  const updated = await db.update(oneTimeTokens)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(oneTimeTokens.tokenHash, tokenHash),
      inArray(oneTimeTokens.purpose, expectedPurposes),
      isNull(oneTimeTokens.consumedAt),
      gt(oneTimeTokens.expiresAt, new Date()),
    ))
    .returning({ userId: oneTimeTokens.userId, purpose: oneTimeTokens.purpose })

  const [row] = updated
  if (!row) return { ok: false }

  return { ok: true, userId: row.userId, purpose: row.purpose as TokenPurpose }
}

/** Marca como consumidos todos os tokens não consumidos de um usuário. */
export async function invalidateUserTokens(userId: string, purpose?: TokenPurpose): Promise<void> {
  await db.update(oneTimeTokens)
    .set({ consumedAt: new Date() })
    .where(and(
      eq(oneTimeTokens.userId, userId),
      isNull(oneTimeTokens.consumedAt),
      ...(purpose ? [eq(oneTimeTokens.purpose, purpose)] : []),
    ))
}

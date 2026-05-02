import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import {
  db,
  users,
  accounts,
  sessions,
  verificationTokens,
  tenantUsers,
  tenants,
  platformUsers,
  eq,
  and,
} from '@postoinsight/db'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  // O DrizzleAdapter só é usado para fluxos que não fazemos (OAuth/email link).
  // Mantemos para compatibilidade — cast para contornar mismatch de tipos
  // entre versões do drizzle-orm e do @auth/drizzle-adapter.
  adapter: (DrizzleAdapter as unknown as (
    db: unknown,
    schema: unknown,
  ) => ReturnType<typeof DrizzleAdapter>)(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email.toLowerCase()))
          .limit(1)

        if (!user || !user.passwordHash) return null

        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user?.id) {
        token.id = user.id
      }

      // Resolve tenant + role only when needed (login or refresh).
      if (user?.id || trigger === 'update' || !token.tenantId) {
        const userId = (user?.id ?? token.id) as string | undefined
        if (userId) {
          const [tu] = await db
            .select({
              tenantId: tenantUsers.tenantId,
              tenantSlug: tenants.slug,
              tenantName: tenants.name,
              role: tenantUsers.role,
            })
            .from(tenantUsers)
            .innerJoin(tenants, eq(tenants.id, tenantUsers.tenantId))
            .where(and(eq(tenantUsers.userId, userId), eq(tenantUsers.active, true)))
            .limit(1)

          if (tu) {
            token.tenantId = tu.tenantId
            token.tenantSlug = tu.tenantSlug
            token.tenantName = tu.tenantName
            token.role = tu.role
          }

          const [pu] = await db
            .select({ platformRole: platformUsers.platformRole })
            .from(platformUsers)
            .where(eq(platformUsers.userId, userId))
            .limit(1)

          if (pu) {
            token.platformRole = pu.platformRole
          }
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        if (token.id) session.user.id = token.id as string
        session.user.tenantId = (token.tenantId as string | undefined) ?? null
        session.user.tenantSlug = (token.tenantSlug as string | undefined) ?? null
        session.user.tenantName = (token.tenantName as string | undefined) ?? null
        session.user.role = (token.role as 'owner' | 'manager' | 'viewer' | undefined) ?? null
        session.user.platformRole =
          (token.platformRole as 'superadmin' | 'support' | undefined) ?? null
      }
      return session
    },
  },
})

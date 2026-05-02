import type { NextAuthConfig } from 'next-auth'

// Configuração mínima para o middleware (Edge Runtime).
// Sem imports de db, postgres ou bcrypt — apenas JWT.
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user
    },
  },
}

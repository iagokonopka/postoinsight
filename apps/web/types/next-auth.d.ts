import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
      tenantId: string | null
      tenantSlug: string | null
      tenantName: string | null
      role: 'owner' | 'manager' | 'viewer' | null
      platformRole: 'superadmin' | 'support' | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    tenantId?: string
    tenantSlug?: string
    tenantName?: string
    role?: 'owner' | 'manager' | 'viewer'
    platformRole?: 'superadmin' | 'support'
  }
}

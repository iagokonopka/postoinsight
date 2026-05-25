import { apiUrl } from '@/lib/api'

// Auth types — mirrors JWT claims from apps/api/src/lib/auth.ts
export interface AuthUser {
  id: string
  email: string
  name: string | null
  // tenant user
  tenantId?: string
  tenantName?: string | null  // retornado pelo /auth/me via JOIN em app.tenants
  role?: 'owner' | 'manager' | 'viewer'
  locationId?: string
  // platform user
  platformRole?: 'superadmin' | 'support'
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch(apiUrl('/auth/me'), { credentials: 'include' })
    if (!res.ok) return null
    const data = await res.json()
    // API returns { user: { ... } }
    return (data.user ?? data) as AuthUser
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  await fetch(apiUrl('/auth/logout'), { method: 'POST', credentials: 'include' })
}

// Derives display initials from name or email
export function getInitials(user: AuthUser): string {
  const source = user.name ?? user.email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

// Derives tenant initials (2 letters)
export function getTenantInitials(tenantName: string | null | undefined): string {
  if (!tenantName) return 'PI'
  const parts = tenantName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return tenantName.slice(0, 2).toUpperCase()
}

// Role label in portuguese
export function getRoleLabel(role?: AuthUser['role'] | AuthUser['platformRole']): string {
  const labels: Record<string, string> = {
    owner: 'Proprietário',
    manager: 'Gerente',
    viewer: 'Consultor',
    superadmin: 'Admin',
    support: 'Suporte',
  }
  return labels[role ?? ''] ?? 'Usuário'
}

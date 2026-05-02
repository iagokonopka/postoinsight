import Link from 'next/link'
import { signOut } from '@/auth'

const ANALYSIS = [
  { href: '/dashboard', label: 'Dashboard de Vendas' },
  { href: '/combustivel', label: 'Combustível' },
  { href: '/conveniencia', label: 'Conveniência' },
  { href: '/dre', label: 'DRE Mensal' },
] as const

const OPERATION = [{ href: '/sync', label: 'Sincronização' }] as const

const SETTINGS = [{ href: '/settings/profile', label: 'Configurações' }] as const

async function logoutAction() {
  'use server'
  await signOut({ redirectTo: '/login' })
}

export function Sidebar({
  user,
}: {
  user: {
    name?: string | null
    email?: string | null
    tenantName?: string | null
  }
}) {
  return (
    <aside
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--color-bg)',
        borderRight: '1px solid var(--color-border)',
        padding: 'var(--space-6) var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-6)',
        position: 'sticky',
        top: 0,
        height: '100vh',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 700,
            color: 'var(--color-primary)',
          }}
        >
          PostoInsight
        </div>
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Inteligência para sua rede
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', flex: 1 }}>
        <NavGroup title="Análise" items={ANALYSIS} />
        <NavGroup title="Operação" items={OPERATION} />
        <NavGroup title="" items={SETTINGS} />
      </nav>

      <div
        style={{
          borderTop: '1px solid var(--color-border-subtle)',
          paddingTop: 'var(--space-4)',
          fontSize: 'var(--text-sm)',
        }}
      >
        <div style={{ fontWeight: 600 }}>{user.name ?? user.email}</div>
        {user.tenantName && (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xs)' }}>
            {user.tenantName}
          </div>
        )}
        <form action={logoutAction} style={{ marginTop: 'var(--space-3)' }}>
          <button
            type="submit"
            style={{
              background: 'transparent',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              padding: '6px 10px',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text)',
              width: '100%',
            }}
          >
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}

function NavGroup({
  title,
  items,
}: {
  title: string
  items: ReadonlyArray<{ href: string; label: string }>
}) {
  return (
    <div>
      {title && (
        <div
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-subtle)',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            margin: '0 0 var(--space-2)',
            padding: '0 var(--space-2)',
          }}
        >
          {title}
        </div>
      )}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 2 }}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              style={{
                display: 'block',
                padding: '8px var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-base)',
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

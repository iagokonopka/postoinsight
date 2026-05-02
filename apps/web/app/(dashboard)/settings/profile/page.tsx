import { auth } from '@/auth'

export const metadata = { title: 'Perfil — PostoInsight' }

export default async function ProfilePage() {
  const session = await auth()
  const user = session?.user

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1
        style={{
          margin: 0,
          fontSize: 'var(--text-heading)',
          fontWeight: 600,
        }}
      >
        Perfil
      </h1>

      <div
        style={{
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-5)',
          display: 'grid',
          gap: 'var(--space-3)',
          maxWidth: 480,
        }}
      >
        <Field label="Nome" value={user?.name ?? '—'} />
        <Field label="E-mail" value={user?.email ?? '—'} />
        <Field label="Tenant" value={user?.tenantName ?? '—'} />
        <Field label="Role" value={user?.role ?? '—'} />
      </div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-subtle)' }}>
        {label.toUpperCase()}
      </span>
      <span style={{ fontSize: 'var(--text-base)' }}>{value}</span>
    </div>
  )
}

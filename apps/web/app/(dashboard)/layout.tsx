import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        user={{
          name: session.user.name ?? null,
          email: session.user.email ?? null,
          tenantName: session.user.tenantName ?? null,
        }}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <main style={{ padding: 'var(--space-8)', flex: 1 }}>{children}</main>
      </div>
    </div>
  )
}

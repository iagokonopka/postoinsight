import { redirect } from 'next/navigation'
import { auth, signIn } from '@/auth'
import { AuthError } from 'next-auth'

export const metadata = {
  title: 'Entrar — PostoInsight',
}

async function loginAction(formData: FormData) {
  'use server'
  const email = String(formData.get('email') ?? '')
  const password = String(formData.get('password') ?? '')
  const callbackUrl = String(formData.get('callbackUrl') ?? '/dashboard')

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: callbackUrl || '/dashboard',
    })
  } catch (err) {
    if (err instanceof AuthError) {
      redirect(`/login?error=invalid&callbackUrl=${encodeURIComponent(callbackUrl)}`)
    }
    throw err
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string }
}) {
  const session = await auth()
  if (session) redirect('/dashboard')

  const callbackUrl = searchParams?.callbackUrl ?? '/dashboard'
  const error = searchParams?.error

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 380,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-8)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            margin: 0,
            fontSize: 'var(--text-heading)',
            fontWeight: 600,
          }}
        >
          PostoInsight
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            color: 'var(--color-text-muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Inteligência para sua rede
        </p>
      </div>

      <form
        action={loginAction}
        style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>E-mail</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-base)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <span style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>Senha</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            style={{
              padding: '10px 12px',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-base)',
              background: 'var(--color-bg)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        {error && (
          <div
            role="alert"
            style={{
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              fontSize: 'var(--text-sm)',
            }}
          >
            E-mail ou senha inválidos.
          </div>
        )}

        <button
          type="submit"
          style={{
            marginTop: 'var(--space-2)',
            padding: '10px 14px',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-primary)',
            color: 'var(--color-text-inverse)',
            fontSize: 'var(--text-md)',
            fontWeight: 600,
          }}
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

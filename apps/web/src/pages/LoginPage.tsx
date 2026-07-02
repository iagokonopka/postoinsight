import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiUrl } from '@/lib/api'

// ─── Logo SVG (same as Sidebar) ───────────────────────────────────────────────

function LogoSvg() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0073BB" />
          <stop offset="100%" stopColor="#005f99" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#lg1)" />
      <path
        d="M11 8 V24 M11 8 H17 a4 4 0 0 1 0 8 H11"
        stroke="white" strokeWidth="2.4"
        strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
      <circle cx="22" cy="22" r="2.2" fill="white" />
    </svg>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
  disabled?: boolean
  error?: boolean
}

function Field({ label, type = 'text', value, onChange, placeholder, autoComplete, disabled, error }: InputProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        style={{
          height: '40px',
          padding: '0 12px',
          borderRadius: '6px',
          border: `1px solid ${error ? 'hsl(var(--danger))' : 'hsl(var(--input))'}`,
          background: 'hsl(var(--card))',
          color: 'hsl(var(--foreground))',
          fontFamily: 'inherit',
          fontSize: '14px',
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          transition: 'border-color 0.12s, box-shadow 0.12s',
          opacity: disabled ? 0.6 : 1,
        }}
        onFocus={e => {
          e.currentTarget.style.borderColor = error ? 'hsl(var(--danger))' : 'hsl(var(--ring))'
          e.currentTarget.style.boxShadow = `0 0 0 3px hsl(var(--ring) / 0.15)`
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = error ? 'hsl(var(--danger))' : 'hsl(var(--input))'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate()
  const { refetch } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Preencha e-mail e senha.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(apiUrl('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password, rememberMe }),
      })

      if (res.ok) {
        await refetch()
        navigate('/', { replace: true })
        return
      }

      const data = await res.json().catch(() => ({}))
      if (res.status === 403) {
        setError(data.error ?? 'Conta bloqueada temporariamente. Tente novamente mais tarde.')
      } else {
        setError(data.error ?? 'Credenciais inválidas. Verifique e-mail e senha.')
      }
    } catch {
      setError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100%',
      background: 'hsl(var(--background))',
    }}>
      {/* Card */}
      <div style={{
        width: '380px',
        background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)',
        padding: '32px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
          <LogoSvg />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.3px' }}>PostoInsight</div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>Business Intelligence</div>
          </div>
        </div>

        {/* Heading */}
        <h2 style={{
          fontSize: '18px',
          fontWeight: 600,
          letterSpacing: '-0.3px',
          color: 'hsl(var(--foreground))',
          marginBottom: '20px',
        }}>
          Entrar na sua conta
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Field
            label="E-mail"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="voce@empresa.com.br"
            autoComplete="email"
            disabled={loading}
            error={!!error}
          />
          <Field
            label="Senha"
            type="password"
            value={password}
            onChange={v => { setPassword(v); setError(null) }}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            error={!!error}
          />

          {/* Error message */}
          {error && (
            <div style={{
              fontSize: '12px',
              color: 'hsl(var(--danger))',
              background: 'hsl(var(--danger-subtle))',
              border: '1px solid hsl(var(--danger) / 0.25)',
              borderRadius: '6px',
              padding: '10px 12px',
              lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Remember me */}
          <label style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '12px', color: 'hsl(var(--muted-foreground))', cursor: 'pointer',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={e => setRememberMe(e.target.checked)}
              disabled={loading}
              style={{ width: '14px', height: '14px', accentColor: 'hsl(var(--primary))', cursor: 'pointer' }}
            />
            Manter conectado
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              height: '40px',
              borderRadius: '6px',
              background: loading ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '14px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.12s',
              marginTop: '4px',
            }}
          >
            {loading && (
              <span style={{
                width: '14px', height: '14px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: 'white',
                borderRadius: '999px',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }} />
            )}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {/* Forgot password */}
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <a
            href="/recuperar"
            onClick={e => { e.preventDefault(); navigate('/recuperar') }}
            style={{
              fontSize: '12px',
              color: 'hsl(var(--muted-foreground))',
              textDecoration: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'hsl(var(--foreground))')}
            onMouseLeave={e => (e.currentTarget.style.color = 'hsl(var(--muted-foreground))')}
          >
            Esqueci a senha
          </a>
        </div>
      </div>
    </div>
  )
}

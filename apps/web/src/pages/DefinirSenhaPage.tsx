import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { apiUrl } from '@/lib/api'

/**
 * Tela de definir senha — atende ativação (/ativar) e reset (/redefinir-senha).
 * Lê ?token= da URL, pré-preenche email + nome da rede via endpoint de contexto
 * (não-consumidor) e, ao enviar, consome o token, grava a senha e cai logado.
 * Spec: docs/specs/auth-ativacao.md §8
 */

interface Ctx {
  valid: boolean
  email?: string
  name?: string | null
  tenantName?: string | null
  purpose?: 'activation' | 'reset' | 'login'
}

const cardStyle: React.CSSProperties = {
  width: '380px',
  background: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow-md)',
  padding: '32px',
}

const wrapStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  minHeight: '100vh', width: '100%', background: 'hsl(var(--background))',
}

export default function DefinirSenhaPage() {
  const navigate = useNavigate()
  const { refetch } = useAuth()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [ctx, setCtx] = useState<Ctx | null>(null)
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Impede vazamento do token via referer.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'referrer'
    meta.content = 'no-referrer'
    document.head.appendChild(meta)
    return () => { document.head.removeChild(meta) }
  }, [])

  useEffect(() => {
    if (!token) { setCtx({ valid: false }); return }
    fetch(apiUrl(`/auth/set-password/context?token=${encodeURIComponent(token)}`))
      .then(r => r.json())
      .then(setCtx)
      .catch(() => setCtx({ valid: false }))
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) { setError('A senha deve ter no mínimo 8 caracteres.'); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch(apiUrl('/auth/set-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token, password }),
      })
      if (res.ok) {
        await refetch()
        navigate('/', { replace: true })
        return
      }
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Não foi possível definir a senha.')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (ctx === null) {
    return <div style={wrapStyle}><Spinner /></div>
  }

  if (!ctx.valid) {
    return (
      <div style={wrapStyle}>
        <div style={cardStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>Link inválido</h2>
          <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5 }}>
            Este link expirou ou já foi utilizado. Solicite um novo para continuar.
          </p>
          <button onClick={() => navigate('/recuperar')} style={primaryBtn(false)}>
            Solicitar novo link
          </button>
        </div>
      </div>
    )
  }

  const isReset = ctx.purpose === 'reset'

  return (
    <div style={wrapStyle}>
      <div style={cardStyle}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', marginBottom: '6px' }}>
          {isReset ? 'Redefinir senha' : 'Bem-vindo ao PostoInsight'}
        </h2>
        <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '20px', lineHeight: 1.5 }}>
          {ctx.tenantName ? <>Rede <strong>{ctx.tenantName}</strong>. </> : null}
          {isReset ? 'Escolha sua nova senha.' : 'Defina sua senha para acessar o painel.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* username oculto para o gerenciador de senhas associar a credencial */}
          <input
            type="email"
            value={ctx.email ?? ''}
            readOnly
            autoComplete="username"
            style={{ position: 'absolute', opacity: 0, height: 0, width: 0, pointerEvents: 'none' }}
            tabIndex={-1}
            aria-hidden
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500 }}>E-mail</label>
            <input
              value={ctx.email ?? ''}
              readOnly disabled
              style={fieldStyle(false, true)}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500 }}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
                disabled={loading}
                style={fieldStyle(!!error, false)}
              />
              <button
                type="button"
                onClick={() => setShow(s => !s)}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', fontSize: '11px', cursor: 'pointer',
                  color: 'hsl(var(--muted-foreground))',
                }}
              >
                {show ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              fontSize: '12px', color: 'hsl(var(--danger))',
              background: 'hsl(var(--danger-subtle))',
              border: '1px solid hsl(var(--danger) / 0.25)',
              borderRadius: '6px', padding: '10px 12px', lineHeight: 1.5,
            }}>{error}</div>
          )}

          <button type="submit" disabled={loading} style={primaryBtn(loading)}>
            {loading ? 'Salvando…' : (isReset ? 'Redefinir e entrar' : 'Definir senha e entrar')}
          </button>
        </form>
      </div>
    </div>
  )
}

function fieldStyle(error: boolean, disabled: boolean): React.CSSProperties {
  return {
    height: '40px', padding: '0 12px', borderRadius: '6px',
    border: `1px solid ${error ? 'hsl(var(--danger))' : 'hsl(var(--input))'}`,
    background: 'hsl(var(--card))', color: 'hsl(var(--foreground))',
    fontFamily: 'inherit', fontSize: '14px', outline: 'none', width: '100%',
    boxSizing: 'border-box', opacity: disabled ? 0.6 : 1,
  }
}

function primaryBtn(loading: boolean): React.CSSProperties {
  return {
    height: '40px', borderRadius: '6px', marginTop: '4px',
    background: loading ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))', border: 'none',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
  }
}

function Spinner() {
  return (
    <span style={{
      width: '32px', height: '32px',
      border: '3px solid hsl(var(--muted))', borderTopColor: 'hsl(var(--primary))',
      borderRadius: '999px', animation: 'spin 0.7s linear infinite', display: 'inline-block',
    }} />
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiUrl } from '@/lib/api'

/**
 * Tela "Esqueci a senha" — envia e-mail com link de redefinição.
 * Mensagem SEMPRE genérica (anti-enumeração), independente de o e-mail existir.
 * Spec: docs/specs/auth-ativacao.md §8
 */
export default function RecuperarSenhaPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await fetch(apiUrl('/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
    } catch { /* mensagem genérica mesmo em erro de rede */ }
    finally {
      setLoading(false)
      setSent(true)
    }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', width: '100%', background: 'hsl(var(--background))',
    }}>
      <div style={{
        width: '380px', background: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow-md)', padding: '32px',
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '-0.3px', marginBottom: '6px' }}>
          Recuperar acesso
        </h2>

        {sent ? (
          <>
            <p style={{ fontSize: '14px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.5, marginBottom: '20px' }}>
              Se houver uma conta associada a esse e-mail, enviaremos um link para redefinir a senha.
              Verifique sua caixa de entrada.
            </p>
            <button onClick={() => navigate('/login')} style={primaryBtn(false)}>
              Voltar ao login
            </button>
          </>
        ) : (
          <>
            <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginBottom: '20px', lineHeight: 1.5 }}>
              Informe seu e-mail e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 500 }}>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="voce@empresa.com.br"
                  autoComplete="email"
                  disabled={loading}
                  style={{
                    height: '40px', padding: '0 12px', borderRadius: '6px',
                    border: '1px solid hsl(var(--input))', background: 'hsl(var(--card))',
                    color: 'hsl(var(--foreground))', fontFamily: 'inherit', fontSize: '14px',
                    outline: 'none', width: '100%', boxSizing: 'border-box',
                  }}
                />
              </div>
              <button type="submit" disabled={loading} style={primaryBtn(loading)}>
                {loading ? 'Enviando…' : 'Enviar link'}
              </button>
            </form>
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a
                href="/login"
                onClick={e => { e.preventDefault(); navigate('/login') }}
                style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', textDecoration: 'none' }}
              >
                Voltar ao login
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function primaryBtn(loading: boolean): React.CSSProperties {
  return {
    height: '40px', borderRadius: '6px', marginTop: '4px', width: '100%',
    background: loading ? 'hsl(var(--primary) / 0.7)' : 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))', border: 'none',
    fontFamily: 'inherit', fontSize: '14px', fontWeight: 600,
    cursor: loading ? 'not-allowed' : 'pointer',
  }
}

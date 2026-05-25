import { Component, type ReactNode, type ErrorInfo } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', height: '100vh', width: '100%',
          background: 'hsl(var(--background))', gap: '16px', padding: '32px',
        }}>
          <div style={{
            maxWidth: '560px', width: '100%',
            background: 'hsl(var(--danger-subtle))',
            border: '1px solid hsl(var(--danger) / 0.3)',
            borderRadius: '8px', padding: '24px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--danger))', marginBottom: '8px' }}>
              Erro de renderização
            </div>
            <pre style={{
              fontSize: '12px', fontFamily: "'Geist Mono', monospace",
              color: 'hsl(var(--foreground))', whiteSpace: 'pre-wrap',
              wordBreak: 'break-all', margin: 0,
            }}>
              {this.state.error.message}
            </pre>
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/' }}
            style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: 'hsl(var(--primary))', color: 'white',
              fontSize: '13px', fontWeight: 500, cursor: 'pointer',
            }}
          >
            Voltar ao início
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

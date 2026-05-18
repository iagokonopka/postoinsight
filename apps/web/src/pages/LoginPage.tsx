/**
 * LoginPage — autenticação via cookie HttpOnly
 * Spec: FRONTEND_SPEC.md seção 1 (rota /login)
 * ADR-012: SPA nunca vê o token — gerenciado pelo Fastify
 */
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionExpired = searchParams.get('reason') === 'session_expired';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else if (err instanceof ApiError && err.status === 423) {
        setError('Conta bloqueada por tentativas excessivas. Aguarde 15 minutos.');
      } else {
        setError('Erro ao conectar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 text-center">
          <span className="text-3xl font-bold text-primary">PostoInsight</span>
          <p className="mt-1 text-sm text-muted-foreground">
            Inteligência para sua rede de postos
          </p>
        </div>

        {/* Card do formulário */}
        <div className="rounded-xl border border-border bg-card p-8 shadow-md">
          <h1 className="mb-6 text-xl font-semibold text-foreground">
            Entrar na sua conta
          </h1>

          {/* Aviso de sessão expirada */}
          {sessionExpired && !error && (
            <Alert className="mb-4 border-warning/30 bg-warning-subtle">
              <AlertCircle size={16} className="text-warning" />
              <AlertDescription className="text-sm">
                Sua sessão expirou. Faça login novamente.
              </AlertDescription>
            </Alert>
          )}

          {/* Erro de login */}
          {error && (
            <Alert className="mb-4 border-danger/30 bg-danger-subtle" variant="destructive">
              <AlertCircle size={16} />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

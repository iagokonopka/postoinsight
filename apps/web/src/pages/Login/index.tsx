import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

// ── Logo mark (inline SVG) ─────────────────────────────────────────────────────

function Logo() {
  return (
    <svg width="40" height="40" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="login-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0073BB" />
          <stop offset="100%" stopColor="#6B40C4" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#login-logo-grad)" />
      <path
        d="M8 20V10a2 2 0 0 1 2-2h3a3 3 0 0 1 0 6H8m5-6v6"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Login Page ─────────────────────────────────────────────────────────────────

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
      const redirect = searchParams.get('redirect') ?? '/dashboard';
      navigate(redirect, { replace: true });
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Credenciais inválidas. Verifique e-mail e senha.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border border-border rounded-[12px] shadow-md p-8">

        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <Logo />
          <div className="text-center">
            <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
              PostoInsight
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              BI para redes de postos
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[13px] font-medium text-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@rede.com"
              className={cn(
                'h-9 w-full rounded-[7px] border border-input bg-background px-3',
                'text-[13px] text-foreground placeholder:text-muted-foreground',
                'outline-none ring-offset-background',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                'transition-colors duration-100',
              )}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[13px] font-medium text-foreground">
              Senha
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                'h-9 w-full rounded-[7px] border border-input bg-background px-3',
                'text-[13px] text-foreground placeholder:text-muted-foreground',
                'outline-none ring-offset-background',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                'transition-colors duration-100',
              )}
            />
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              'h-9 w-full rounded-[7px] bg-primary text-white text-[13px] font-medium',
              'flex items-center justify-center gap-2',
              'hover:bg-primary/90 transition-colors duration-100',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Entrando…
              </>
            ) : (
              'Entrar'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, ChevronRight, LogOut, User } from 'lucide-react';
import { setTheme } from '@/lib/theme';
import { cn } from '@/lib/cn';
import { useAuth } from '@/hooks/useAuth';

// ── Route → breadcrumb label map ───────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  '/dashboard':    'Visão Geral',
  '/combustivel':  'Combustível',
  '/arla':         'Arla 32',
  '/lubrificantes':'Lubrificantes',
  '/conveniencia': 'Conveniência',
  '/dre':          'DRE Mensal',
  '/sync':         'Sincronização',
  '/settings':     'Configurações',
  '/settings/profile':      'Configurações',
  '/settings/locations':    'Configurações',
  '/settings/users':        'Configurações',
  '/settings/integrations': 'Configurações',
};

// ── ThemeToggle ────────────────────────────────────────────────────────────────
function ThemeToggle() {
  const isDark =
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark');

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
    // Force re-render: dispatch storage event so other listeners pick it up
    window.dispatchEvent(new Event('storage'));
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-[7px]',
        'text-muted-foreground hover:text-foreground hover:bg-muted',
        'transition-colors duration-100',
      )}
    >
      {isDark ? <Sun size={15} strokeWidth={1.6} /> : <Moon size={15} strokeWidth={1.6} />}
    </button>
  );
}

// ── UserMenu ───────────────────────────────────────────────────────────────────
function UserMenu() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0] ?? 'U').toUpperCase();

  const roleLabel: Record<string, string> = {
    owner: 'Owner',
    manager: 'Gerente',
    viewer: 'Visualizador',
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        aria-expanded={open}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-[7px]',
          'hover:bg-muted transition-colors duration-100',
        )}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0073BB, #6B40C4)' }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-[12px] font-medium text-foreground leading-none">
            {user?.name ?? user?.email ?? 'Usuário'}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {roleLabel[user?.role ?? ''] ?? 'Owner'}
          </div>
        </div>
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1.5 z-50',
            'w-52 bg-card border border-border rounded-[10px] shadow-md',
            'py-1 text-[13px]',
          )}
        >
          <div className="px-3 py-2 border-b border-border">
            <div className="font-medium text-foreground">{user?.name ?? 'Usuário'}</div>
            <div className="text-[11px] text-muted-foreground">{user?.email}</div>
          </div>
          <button
            onClick={() => { setOpen(false); navigate('/settings/profile'); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <User size={13} strokeWidth={1.6} />
            Perfil
          </button>
          <div className="border-t border-border my-1" />
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-danger hover:bg-danger/10 transition-colors"
          >
            <LogOut size={13} strokeWidth={1.6} />
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

// ── Breadcrumb ─────────────────────────────────────────────────────────────────
function Breadcrumb() {
  const location = useLocation();
  const pageLabel = ROUTE_LABELS[location.pathname] ?? 'PostoInsight';

  return (
    <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground">PostoInsight</span>
      <ChevronRight size={13} className="text-muted-foreground/50" aria-hidden="true" />
      <span className="font-semibold text-foreground">{pageLabel}</span>
    </nav>
  );
}

// ── Topbar ─────────────────────────────────────────────────────────────────────
export function Topbar() {
  return (
    <header className="flex items-center gap-3 px-6 h-[52px] bg-card border-b border-border flex-shrink-0">
      <Breadcrumb />
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu />
      </div>
    </header>
  );
}

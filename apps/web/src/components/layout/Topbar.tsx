/**
 * Topbar — barra superior (light)
 * Referência visual: design_example/postoinsight/PostoInsight.html (.topbar)
 * h-[54px], bg-card, border-b border-border
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, Loader2, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFilters, type PeriodKey } from '@/contexts/FilterContext';
import { useTenant } from '@/contexts/TenantContext';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { cn } from '@/lib/utils';

/* ─── Mapeamento pathname → label legível ─────────────────── */

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/combustivel':  'Combustível',
  '/conveniencia': 'Conveniência & Serviços',
  '/dre':          'DRE Mensal',
  '/sync':         'Sincronização',
  '/settings':     'Configurações',
};

function usePageLabel(pathname: string): string {
  const entry = Object.entries(PAGE_LABELS).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + '/'),
  );
  return entry?.[1] ?? 'PostoInsight';
}

/* ─── Label de período para o breadcrumb ─────────────────── */

const PERIOD_CRUMB: Record<PeriodKey, string> = {
  today:      'Hoje',
  yesterday:  'Ontem',
  '7d':       'Últimos 7 dias',
  this_week:  'Esta semana',
  this_month: 'Este mês',
  last_month: 'Mês anterior',
  custom:     'Período personalizado',
};

/* ─── Segmented period control ───────────────────────────── */

const PERIOD_OPTIONS = [
  { value: 'today',      label: 'Hoje'     },
  { value: 'this_week',  label: 'Semana'   },
  { value: 'this_month', label: 'Mês'      },
  { value: 'last_month', label: 'Mês ant.' },
] as const satisfies ReadonlyArray<{ value: PeriodKey; label: string }>;

function PeriodSegment() {
  const { period, setPeriod } = useFilters();

  return (
    <SegmentedControl<PeriodKey>
      value={period}
      options={PERIOD_OPTIONS}
      onChange={(v) => setPeriod(v)}
    />
  );
}

/* ─── Location select ────────────────────────────────────── */

function LocationSelect() {
  const { locationId, setLocationId } = useFilters();
  const { locations } = useTenant();

  return (
    <Select value={locationId} onValueChange={setLocationId}>
      <SelectTrigger className="h-[34px] w-44 text-[13px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas as unidades</SelectItem>
        {locations.map((loc) => (
          <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── Botão de sincronização ─────────────────────────────── */

function SyncButton() {
  const { status, trigger, triggering } = useSyncStatus();
  const isSyncing = triggering || status === 'syncing';

  return (
    <button
      type="button"
      onClick={trigger}
      disabled={isSyncing}
      className={cn(
        'inline-flex h-[34px] items-center gap-1.5 rounded-[6px] border border-border',
        'bg-card px-3 text-[13px] font-medium text-foreground transition-colors',
        'hover:bg-muted disabled:opacity-60',
        status === 'critical' && 'border-red-400 text-red-600',
      )}
    >
      {isSyncing ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <RefreshCw size={13} />
      )}
      {isSyncing ? 'Sincronizando…' : 'Sincronizar'}
    </button>
  );
}

/* ─── Avatar com dropdown ────────────────────────────────── */

function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : (user?.email?.[0]?.toUpperCase() ?? 'U');

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm hover:bg-muted focus:outline-none">
        {/* Avatar com gradiente idêntico ao HTML de referência */}
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #0073BB, #6B40C4)' }}
        >
          {initials}
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {user?.name && (
          <div className="px-2 py-1.5 text-sm font-medium text-foreground">{user.name}</div>
        )}
        {user?.email && (
          <div className="px-2 pb-2 text-xs text-muted-foreground">{user.email}</div>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings size={13} className="mr-2" />
          Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut size={13} className="mr-2" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Breadcrumb ─────────────────────────────────────────── */

function Breadcrumb() {
  const location = useLocation();
  const { period, locationId } = useFilters();
  const { locations } = useTenant();

  const pageLabel = usePageLabel(location.pathname);

  const locationLabel =
    locationId === 'all'
      ? 'Todas as unidades'
      : (locations.find((l) => l.id === locationId)?.name ?? 'Unidade');

  const periodLabel = PERIOD_CRUMB[period] ?? 'Este mês';

  // Não exibir contexto de filtro em páginas de operação
  const isOperational = ['/settings', '/sync'].some((p) => location.pathname.startsWith(p));

  return (
    <div className="flex items-center gap-2 text-[13px] text-muted-foreground whitespace-nowrap shrink-0">
      <b className="text-foreground font-semibold">{pageLabel}</b>
      {!isOperational && (
        <>
          {/* Chevron separador */}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
            <path d="m9 18 6-6-6-6" />
          </svg>
          <span id="crumb-context">{locationLabel} · {periodLabel}</span>
        </>
      )}
    </div>
  );
}

/* ─── Topbar ─────────────────────────────────────────────── */

export function Topbar() {
  const location = useLocation();
  const { multiLocationEnabled } = useTenant();

  // DRE tem seletor de mês próprio — ocultar segmented control
  const isDrePage = location.pathname.startsWith('/dre');

  return (
    <header className="flex h-[54px] shrink-0 items-center gap-3 bg-card border-b border-border px-6">
      <Breadcrumb />

      <div className="ml-auto flex items-center gap-2">
        {!isDrePage && <PeriodSegment />}
        {multiLocationEnabled && <LocationSelect />}
        <SyncButton />
        <UserMenu />
      </div>
    </header>
  );
}
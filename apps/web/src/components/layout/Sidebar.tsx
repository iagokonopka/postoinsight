/**
 * Sidebar — navegação principal
 * Referência visual: design_example/postoinsight/PostoInsight.html (.sidebar)
 * Largura: 240px, bg-sidebar (slate-800), fixa
 */
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Fuel,
  ShoppingBag,
  FileText,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { cn } from '@/lib/utils';

/* ─── Grupos de navegação ─────────────────────────────────── */

const NAV_ANALISE = [
  { to: '/dashboard',    label: 'Dashboard',              icon: LayoutDashboard },
  { to: '/combustivel',  label: 'Combustível',            icon: Fuel },
  { to: '/conveniencia', label: 'Conveniência',           icon: ShoppingBag },
  { to: '/dre',          label: 'DRE',                    icon: FileText },
] as const;

const NAV_OPERACAO = [
  { to: '/sync',         label: 'Sincronização',          icon: RefreshCw },
  { to: '/settings',     label: 'Configurações',          icon: Settings },
] as const;

/* ─── Logo SVG mark ──────────────────────────────────────── */

function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="sb-logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0073BB" />
          <stop offset="1" stopColor="#6B40C4" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#sb-logo-grad)" />
      {/* Ícone estilizado — torre com sinal */}
      <path d="M14 7v14M10 11l4-4 4 4M8 18h12" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Item de navegação ──────────────────────────────────── */

interface NavItemProps {
  to: string;
  label: string;
  icon: React.ElementType;
  isActive: boolean;
}

function NavItem({ to, label, icon: Icon, isActive }: NavItemProps) {
  return (
    <NavLink
      to={to}
      className={cn(
        'relative flex items-center gap-[10px] rounded-[6px] px-[10px] py-2',
        'text-[13px] font-medium transition-colors duration-[120ms]',
        isActive
          ? 'bg-[hsl(var(--sidebar-active-bg))] text-[hsl(var(--sidebar-foreground))]'
          : 'text-[hsl(var(--sidebar-foreground)/0.7)] hover:bg-[hsl(var(--sidebar-muted)/0.6)] hover:text-[hsl(var(--sidebar-foreground))]',
      )}
    >
      {/* Barra lateral de item ativo */}
      {isActive && (
        <span
          className="absolute left-0 rounded-r-[2px]"
          style={{
            top: 6,
            bottom: 6,
            width: '2.5px',
            background: 'var(--sidebar-active)',
          }}
        />
      )}
      <Icon
        size={14}
        strokeWidth={1.6}
        className={cn(
          'shrink-0 opacity-85',
          isActive && 'opacity-100',
        )}
        style={isActive ? { color: 'var(--sidebar-active)' } : undefined}
      />
      <span>{label}</span>
    </NavLink>
  );
}

/* ─── Section label ──────────────────────────────────────── */

function SectionLabel({ children }: { children: string }) {
  return (
    <p
      className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[1.4px]"
      style={{ color: 'hsl(var(--sidebar-foreground) / 0.4)' }}
    >
      {children}
    </p>
  );
}

/* ─── Sidebar principal ──────────────────────────────────── */

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { locations } = useTenant();

  // Iniciais do tenant: 2 primeiras letras da primeira location, fallback "PI"
  const tenantName = locations[0]?.name ?? 'PostoInsight';
  const tenantInitials = tenantName
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  // Label do role do usuário
  const roleLabel =
    user?.role === 'owner'   ? 'Proprietário' :
    user?.role === 'manager' ? 'Gerente'       :
    user?.role === 'viewer'  ? 'Visualizador'  :
    'Administrador';

  return (
    <aside
      className="flex h-full w-60 shrink-0 flex-col"
      style={{
        background: 'hsl(var(--sidebar))',
        color: 'hsl(var(--sidebar-foreground))',
        borderRight: '1px solid hsl(var(--sidebar-muted) / 0.5)',
      }}
    >
      {/* ── Logo ─────────────────────────────────── */}
      <div
        className="flex items-center gap-[10px] px-5 py-[18px]"
        style={{ borderBottom: '1px solid hsl(var(--sidebar-muted) / 0.6)' }}
      >
        <LogoMark />
        <div>
          <p className="text-[14px] font-semibold tracking-[-0.2px]" style={{ color: 'hsl(var(--sidebar-foreground))' }}>
            PostoInsight
          </p>
          <span
            className="block text-[10px] font-medium tracking-[0.4px] mt-[1px]"
            style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
          >
            BI · {tenantName.length > 16 ? tenantName.slice(0, 15) + '…' : tenantName}
          </span>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────── */}
      <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
        {/* Seção Análise */}
        <div>
          <SectionLabel>Análise</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {NAV_ANALISE.map(({ to, label, icon }) => (
              <NavItem
                key={to}
                to={to}
                label={label}
                icon={icon}
                isActive={location.pathname.startsWith(to)}
              />
            ))}
          </div>
        </div>

        {/* Seção Operação */}
        <div>
          <SectionLabel>Operação</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {NAV_OPERACAO.map(({ to, label, icon }) => (
              <NavItem
                key={to}
                to={to}
                label={label}
                icon={icon}
                isActive={location.pathname.startsWith(to)}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* ── Footer — tenant ──────────────────────── */}
      <div
        className="p-3"
        style={{ borderTop: '1px solid hsl(var(--sidebar-muted) / 0.6)' }}
      >
        <div className="flex items-center gap-[10px] rounded-[6px] px-2 py-[6px]">
          {/* Ícone do tenant */}
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-content rounded-[6px] text-[11px] font-bold text-white"
            style={{
              background: 'linear-gradient(135deg, #0073BB, #6B40C4)',
              justifyContent: 'center',
            }}
          >
            {tenantInitials || 'PI'}
          </div>
          {/* Nome + role */}
          <div className="min-w-0">
            <p
              className="truncate text-[12px] font-medium"
              style={{ color: 'hsl(var(--sidebar-foreground))' }}
            >
              {user?.name ?? user?.email ?? 'Usuário'}
            </p>
            <p
              className="text-[10px]"
              style={{ color: 'hsl(var(--sidebar-foreground) / 0.5)' }}
            >
              {roleLabel}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
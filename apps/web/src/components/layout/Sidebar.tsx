import type { ElementType } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Fuel,
  Droplets,
  Wrench,
  ShoppingBag,
  FileText,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/cn';

// ── Logo mark ─────────────────────────────────────────────────────────────────
function LogoMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0073BB" />
          <stop offset="100%" stopColor="#6B40C4" />
        </linearGradient>
      </defs>
      <rect width="28" height="28" rx="7" fill="url(#logo-grad)" />
      <path
        d="M8 20V10a2 2 0 0 1 2-2h3a3 3 0 0 1 0 6H8m5-6v6"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="19" cy="18" r="2.5" stroke="#fff" strokeWidth="1.6" />
    </svg>
  );
}

// ── Navigation config ──────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Análise',
    items: [
      { label: 'Visão Geral',   href: '/dashboard',    icon: LayoutDashboard },
      { label: 'Combustível',   href: '/combustivel',  icon: Fuel },
      { label: 'Arla 32',       href: '/arla',         icon: Droplets },
      { label: 'Lubrificantes', href: '/lubrificantes',icon: Wrench },
      { label: 'Conveniência',  href: '/conveniencia', icon: ShoppingBag },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { label: 'DRE Mensal', href: '/dre', icon: FileText },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { label: 'Sincronização', href: '/sync',     icon: RefreshCw },
      { label: 'Configurações', href: '/settings', icon: Settings },
    ],
  },
];

// ── SidebarItem ────────────────────────────────────────────────────────────────
interface SidebarItemProps {
  label: string;
  href: string;
  icon: ElementType;
  isActive: boolean;
}

function SidebarItem({ label, href, icon: Icon, isActive }: SidebarItemProps) {
  return (
    <NavLink
      to={href}
      className={cn(
        'relative flex items-center gap-2.5 px-3 py-[7px] rounded-[7px] text-[13px] font-medium transition-colors duration-120 select-none',
        isActive
          ? 'bg-sidebar-active-bg text-sidebar-foreground'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-muted/60 hover:text-sidebar-foreground',
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <span
          className="absolute left-0 top-[6px] bottom-[6px] w-[2.5px] bg-sidebar-active rounded-full"
          aria-hidden="true"
        />
      )}
      <Icon
        size={14}
        strokeWidth={1.6}
        className={cn(isActive ? 'text-sidebar-active' : 'text-current')}
      />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

// ── SidebarSection ─────────────────────────────────────────────────────────────
interface SidebarSectionProps {
  label: string;
  items: typeof NAV_SECTIONS[0]['items'];
  currentPath: string;
}

function SidebarSection({ label, items, currentPath }: SidebarSectionProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-[1.4px] text-sidebar-foreground/40">
        {label}
      </span>
      {items.map((item) => (
        <SidebarItem
          key={item.href}
          label={item.label}
          href={item.href}
          icon={item.icon}
          isActive={
            item.href === '/settings'
              ? currentPath.startsWith('/settings')
              : currentPath === item.href
          }
        />
      ))}
    </div>
  );
}

// ── TenantBadge ────────────────────────────────────────────────────────────────
function TenantBadge() {
  // Will be wired to AuthContext in Phase 7
  return (
    <div className="flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-sidebar-muted/60 cursor-pointer transition-colors">
      {/* Avatar with gradient */}
      <div
        className="w-7 h-7 rounded-[7px] flex-shrink-0 flex items-center justify-center text-white text-[11px] font-bold"
        style={{ background: 'linear-gradient(135deg, #0073BB, #6B40C4)' }}
        aria-hidden="true"
      >
        R
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-sidebar-foreground truncate">
          Rede JAM
        </div>
        <div className="text-[10px] text-sidebar-foreground/50 truncate">
          Owner
        </div>
      </div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-60 flex flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-muted/50">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-sidebar-muted/60">
        <LogoMark />
        <div>
          <span className="block text-sm font-semibold text-sidebar-foreground">
            PostoInsight
          </span>
          <span className="block text-[10px] text-sidebar-foreground/50 tracking-wide">
            BI para redes
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
        {NAV_SECTIONS.map((section) => (
          <SidebarSection
            key={section.label}
            label={section.label}
            items={section.items}
            currentPath={location.pathname}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-muted/60">
        <TenantBadge />
      </div>
    </aside>
  );
}

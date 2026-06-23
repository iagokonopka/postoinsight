import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  Fuel,
  Container,
  Store,
  Droplet,
  FileText,
  Sparkles,
  RefreshCw,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getTenantInitials, getRoleLabel } from '@/lib/auth'

// Menu empilhado (sem hierarquia / sem títulos de seção) — ícones do Claude Design
const NAV_MAIN = [
  { to: '/',              label: 'Visão Geral',   Icon: LayoutGrid },
  { to: '/combustivel',   label: 'Combustível',   Icon: Fuel },
  { to: '/arla',          label: 'Arla 32',       Icon: Container },
  { to: '/conveniencia',  label: 'Conveniência',  Icon: Store },
  { to: '/lubrificantes', label: 'Lubrificantes', Icon: Droplet },
  { to: '/dre',           label: 'DRE',           Icon: FileText },
  { to: '/assistente',    label: 'Assistente',    Icon: Sparkles },
]

const NAV_FOOT = [
  { to: '/sincronizacao', label: 'Sincronização', Icon: RefreshCw },
  { to: '/configuracoes', label: 'Configurações',  Icon: Settings },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const tenantName = user?.tenantName ?? ''
  const tenantInitials = tenantName ? getTenantInitials(tenantName) : 'PI'
  const roleLabel = user ? getRoleLabel(user.role ?? user.platformRole) : ''
  const displayName = user?.name ?? user?.email ?? ''

  return (
    <aside style={{
      width: '250px',
      flexShrink: 0,
      background: 'hsl(var(--sidebar))',
      color: 'hsl(var(--sidebar-foreground))',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid hsl(var(--sidebar-muted) / 0.5)',
    }}>
      {/* Marca */}
      <div style={{ padding: '24px 22px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LogoSvg />
          <div style={{ fontSize: '18px', fontWeight: 400, letterSpacing: '-0.02em', color: 'hsl(var(--sidebar-foreground))', lineHeight: 1 }}>
            <b style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>posto</b><span style={{ opacity: 0.62 }}>insight</span>
          </div>
        </div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--sidebar-foreground) / 0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: '11px' }}>
          {tenantName ? `BI · ${tenantName}` : 'BI'}
        </div>
      </div>

      {/* Nav principal (empilhada) */}
      <nav style={{ flex: 1, padding: '6px 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_MAIN.map(({ to, label, Icon }) => (
          <SidebarItem key={to} to={to} label={label} Icon={Icon} exact={to === '/'} currentPath={location.pathname} />
        ))}
      </nav>

      {/* Rodapé de nav */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid hsl(var(--sidebar-muted) / 0.5)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_FOOT.map(({ to, label, Icon }) => (
          <SidebarItem key={to} to={to} label={label} Icon={Icon} currentPath={location.pathname} />
        ))}
      </div>

      {/* Tenant */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid hsl(var(--sidebar-muted) / 0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px' }}>
          <div style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: 'linear-gradient(135deg, #0e8aa6, #0a6a80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: 'white', flexShrink: 0,
          }}>
            {tenantInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'hsl(var(--sidebar-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenantName || 'PostoInsight'}
            </div>
            <div style={{ fontSize: '10.5px', color: 'hsl(var(--sidebar-foreground) / 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {roleLabel && displayName ? `${roleLabel} · ${displayName}` : displayName}
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ─── SidebarItem ────────────────────────────────────────────────────────────

interface SidebarItemProps {
  to: string
  label: string
  Icon: LucideIcon
  exact?: boolean
  currentPath: string
}

function SidebarItem({ to, label, Icon, exact }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '11px',
        padding: '9px 12px',
        borderRadius: '9px',
        fontSize: '14px',
        fontWeight: isActive ? 600 : 450,
        color: isActive ? 'hsl(var(--sidebar-active))' : 'hsl(var(--sidebar-foreground) / 0.82)',
        background: isActive ? 'hsl(var(--sidebar-active-bg))' : 'transparent',
        textDecoration: 'none',
        transition: 'background 0.14s, color 0.14s',
        position: 'relative',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={1.7}
            style={{
              flexShrink: 0,
              color: isActive ? 'hsl(var(--sidebar-active))' : 'hsl(var(--sidebar-foreground) / 0.6)',
            }}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  )
}

// ─── Logo SVG ────────────────────────────────────────────────────────────────

function LogoSvg() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0e8aa6" />
          <stop offset="100%" stopColor="#0a6a80" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#g1)" />
      <path
        d="M11 8 V24 M11 8 H17 a4 4 0 0 1 0 8 H11"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="22" cy="22" r="2.2" fill="white" />
    </svg>
  )
}

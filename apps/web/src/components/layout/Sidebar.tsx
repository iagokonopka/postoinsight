import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Fuel,
  ShoppingBag,
  FileBarChart2,
  RefreshCw,
  Settings,
  Droplets,
  Wrench,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getTenantInitials, getRoleLabel } from '@/lib/auth'

const NAV_ANALYSIS = [
  { to: '/',              label: 'Visão Geral',  Icon: LayoutDashboard, sub: false },
  { to: '/combustivel',   label: 'Combustível',  Icon: Fuel,            sub: false },
  { to: '/arla',          label: 'Arla 32',      Icon: Droplets,        sub: true  },
  { to: '/conveniencia',  label: 'Conveniência', Icon: ShoppingBag,     sub: false },
  { to: '/lubrificantes', label: 'Lubrificantes',Icon: Wrench,          sub: true  },
  { to: '/dre',           label: 'DRE Mensal',   Icon: FileBarChart2,   sub: false },
]

const NAV_OPS = [
  { to: '/sincronizacao', label: 'Sincronização', Icon: RefreshCw, badge: 'OK' },
  { to: '/configuracoes', label: 'Configurações',  Icon: Settings },
]

// Item exclusivo do owner — classificação contábil de despesas (Plano 2a)
const NAV_OPS_OWNER = [
  { to: '/configuracoes/mapeamento', label: 'Classificação', Icon: Tags },
]

export function Sidebar() {
  const { user } = useAuth()
  const location = useLocation()

  const isOwner = user?.role === 'owner' || !!user?.platformRole
  const tenantName = user?.tenantName ?? ''
  const tenantInitials = tenantName ? getTenantInitials(tenantName) : 'PI'
  const roleLabel = user ? getRoleLabel(user.role ?? user.platformRole) : ''
  const displayName = user?.name ?? user?.email ?? ''

  return (
    <aside style={{
      width: '240px',
      flexShrink: 0,
      background: 'hsl(var(--sidebar))',
      color: 'hsl(var(--sidebar-foreground))',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid hsl(var(--sidebar-muted) / 0.5)',
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '18px 20px',
        borderBottom: '1px solid hsl(var(--sidebar-muted) / 0.6)',
      }}>
        <LogoSvg />
        <div>
          <div style={{ fontSize: '17px', fontWeight: 400, letterSpacing: '-0.02em', color: 'hsl(var(--sidebar-foreground))', lineHeight: 1 }}>
            <b style={{ fontWeight: 700, color: 'hsl(var(--primary))' }}>posto</b><span style={{ opacity: 0.62 }}>insight</span>
          </div>
          <span style={{ display: 'block', fontSize: '10px', fontWeight: 600, color: 'hsl(var(--sidebar-foreground) / 0.5)', letterSpacing: '0.16em', textTransform: 'uppercase', marginTop: '4px' }}>
            {tenantName ? `BI · ${tenantName}` : 'BI'}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflowY: 'auto' }}>
        {/* Análise */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'hsl(var(--sidebar-foreground) / 0.4)', padding: '0 8px', marginBottom: '4px' }}>
            Análise
          </div>
          {NAV_ANALYSIS.map(({ to, label, Icon, sub }) => (
            <SidebarItem key={to} to={to} label={label} Icon={Icon} exact={to === '/'} currentPath={location.pathname} sub={sub} />
          ))}
        </div>

        {/* Operação — empurrado para o fundo */}
        <div style={{ marginTop: 'auto' }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.4px', textTransform: 'uppercase', color: 'hsl(var(--sidebar-foreground) / 0.4)', padding: '0 8px', marginBottom: '4px' }}>
            Operação
          </div>
          {NAV_OPS.map(({ to, label, Icon, badge }) => (
            <SidebarItem key={to} to={to} label={label} Icon={Icon} badge={badge} currentPath={location.pathname} />
          ))}
          {isOwner && NAV_OPS_OWNER.map(({ to, label, Icon }) => (
            <SidebarItem key={to} to={to} label={label} Icon={Icon} sub currentPath={location.pathname} />
          ))}
        </div>
      </nav>

      {/* Footer — tenant info */}
      <div style={{ padding: '12px', borderTop: '1px solid hsl(var(--sidebar-muted) / 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px', borderRadius: '6px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '6px',
            background: 'linear-gradient(135deg, #0e8aa6, #0a6a80)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '11px', fontWeight: 700, color: 'white',
            flexShrink: 0,
          }}>
            {tenantInitials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--sidebar-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {tenantName || 'PostoInsight'}
            </div>
            <div style={{ fontSize: '10px', color: 'hsl(var(--sidebar-foreground) / 0.5)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
  badge?: string
  exact?: boolean
  sub?: boolean   // indented sub-item
  currentPath: string
}

function SidebarItem({ to, label, Icon, badge, exact, sub, currentPath: _currentPath }: SidebarItemProps) {
  return (
    <NavLink
      to={to}
      end={exact}
      style={({ isActive: navActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 10px',
        paddingLeft: sub ? '28px' : '10px',
        borderRadius: '6px',
        fontSize: sub ? '12px' : '13px',
        fontWeight: 500,
        color: navActive ? 'hsl(var(--sidebar-foreground))' : 'hsl(var(--sidebar-foreground) / 0.7)',
        background: navActive ? 'hsl(var(--sidebar-active-bg))' : 'transparent',
        border: 'none',
        width: '100%',
        textDecoration: 'none',
        transition: 'background 0.12s, color 0.12s',
        position: 'relative',
      })}
    >
      {({ isActive: navActive }) => (
        <>
          {/* Active indicator bar */}
          {navActive && (
            <span style={{
              position: 'absolute',
              left: 0,
              top: '6px',
              bottom: '6px',
              width: '2.5px',
              background: 'hsl(var(--sidebar-active))',
              borderRadius: '2px',
            }} />
          )}
          <Icon
            size={14}
            strokeWidth={1.6}
            style={{
              opacity: navActive ? 1 : 0.85,
              color: navActive ? 'hsl(var(--sidebar-active))' : undefined,
              flexShrink: 0,
            }}
          />
          <span style={{ flex: 1 }}>{label}</span>
          {badge && (
            <span style={{
              marginLeft: 'auto',
              fontSize: '9px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '999px',
              background: 'hsl(var(--sidebar-foreground) / 0.1)',
              color: 'hsl(var(--sidebar-foreground) / 0.8)',
              letterSpacing: '0.4px',
            }}>
              {badge}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ─── Logo SVG ────────────────────────────────────────────────────────────────

function LogoSvg() {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
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

import type { ReactNode } from 'react'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'soft'

interface BadgeProps {
  variant?: BadgeVariant
  children: ReactNode
  style?: React.CSSProperties
}

const VARIANT_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--foreground))',
    borderColor: 'hsl(var(--border))',
  },
  success: {
    background: 'hsl(var(--success-subtle))',
    color: 'hsl(var(--success))',
    borderColor: 'hsl(var(--success) / 0.3)',
  },
  warning: {
    background: 'hsl(var(--warning-subtle))',
    color: 'hsl(var(--warning))',
    borderColor: 'hsl(var(--warning) / 0.3)',
  },
  danger: {
    background: 'hsl(var(--danger-subtle))',
    color: 'hsl(var(--danger))',
    borderColor: 'hsl(var(--danger) / 0.3)',
  },
  primary: {
    background: 'hsl(var(--primary-subtle))',
    color: 'hsl(var(--primary))',
    borderColor: 'hsl(var(--primary) / 0.3)',
  },
  soft: {
    background: 'hsl(var(--muted))',
    color: 'hsl(var(--muted-foreground))',
    border: 'none',
  },
}

export function Badge({ variant = 'default', children, style }: BadgeProps) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 8px',
      borderRadius: '999px',
      fontSize: '11px',
      fontWeight: 500,
      border: '1px solid',
      whiteSpace: 'nowrap',
      ...VARIANT_STYLES[variant],
      ...style,
    }}>
      {children}
    </span>
  )
}

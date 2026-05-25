import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'outline' | 'primary' | 'ghost'
type Size = 'default' | 'sm' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  children?: ReactNode
  loading?: boolean
}

const BASE: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  height: '34px',
  padding: '0 12px',
  borderRadius: '6px',
  fontFamily: 'inherit',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  border: '1px solid transparent',
  transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
  whiteSpace: 'nowrap',
  flexShrink: 0,
}

const VARIANTS: Record<Variant, React.CSSProperties> = {
  outline: {
    background: 'hsl(var(--card))',
    color: 'hsl(var(--foreground))',
    borderColor: 'hsl(var(--border))',
  },
  primary: {
    background: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  ghost: {
    background: 'transparent',
    color: 'hsl(var(--muted-foreground))',
    borderColor: 'transparent',
  },
}

const SIZES: Record<Size, React.CSSProperties> = {
  default: {},
  sm: { height: '28px', padding: '0 10px', fontSize: '12px' },
  icon: { width: '34px', padding: '0', justifyContent: 'center' },
}

export function Button({ variant = 'outline', size = 'default', loading, children, style, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        ...BASE,
        ...VARIANTS[variant],
        ...SIZES[size],
        ...(disabled || loading ? { opacity: 0.5, cursor: 'not-allowed' } : {}),
        ...style,
      }}
    >
      {loading && <Spinner size={size === 'sm' ? 12 : 14} />}
      {children}
    </button>
  )
}

function Spinner({ size = 14 }: { size?: number }) {
  return (
    <span style={{
      width: size,
      height: size,
      border: '2px solid hsl(var(--muted))',
      borderTopColor: 'hsl(var(--primary))',
      borderRadius: '999px',
      display: 'inline-block',
      animation: 'spin 0.7s linear infinite',
      flexShrink: 0,
    }} />
  )
}

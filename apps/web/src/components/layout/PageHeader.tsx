// PageHeader — h1 + subtítulo + actions slot
// Reutilizado em todas as páginas
import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  eyebrow?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, eyebrow, actions }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div>
        {eyebrow && (
          <div className="mono" style={{ fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '9px' }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ fontSize: 'var(--title-size)', fontWeight: 600, letterSpacing: '-0.02em', color: 'hsl(var(--foreground))', lineHeight: 1.12 }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, paddingTop: '2px' }}>
          {actions}
        </div>
      )}
    </div>
  )
}

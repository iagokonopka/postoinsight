// EmptyState — spec: FRONTEND_TODO Bloco 10
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '40px 24px',
      color: 'hsl(var(--muted-foreground))',
      border: '1.5px dashed hsl(var(--border))',
      borderRadius: 'var(--radius)',
      background: 'hsl(var(--muted) / 0.3)',
    }}>
      {icon && (
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '999px',
          background: 'hsl(var(--muted))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '12px',
          color: 'hsl(var(--muted-foreground))',
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: '14px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '4px' }}>
        {title}
      </div>
      {description && (
        <div style={{ fontSize: '12px', maxWidth: '320px' }}>
          {description}
        </div>
      )}
    </div>
  )
}

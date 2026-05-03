import { type CSSProperties, type ReactNode } from 'react';

interface SectionCardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}

export function SectionCard({ title, action, children, style }: SectionCardProps) {
  return (
    <div style={{
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '12px var(--space-5)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-bg-subtle)',
        }}>
          <span style={{
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--color-text)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
          }}>
            {title}
          </span>
          {action ?? null}
        </div>
      )}
      {children}
    </div>
  );
}
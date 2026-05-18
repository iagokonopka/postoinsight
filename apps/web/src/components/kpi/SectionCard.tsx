/**
 * SectionCard — container de seção com título, descrição e conteúdo
 * Referência visual: design_example/postoinsight/PostoInsight.html (.card, .card-h, .card-b)
 */
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;    // subtítulo do card (12px muted)
  action?: ReactNode;      // botão ou badge no canto direito do header
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  noPadding?: boolean;
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  noPadding = false,
}: SectionCardProps) {
  const hasHeader = title || description || action;

  return (
    <div
      className={cn('rounded-lg border border-border bg-card', className)}
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {hasHeader && (
        <div
          className="flex items-start justify-between gap-3"
          style={{ padding: 'var(--pad-card-y) var(--pad-card) 8px' }}
        >
          <div className="min-w-0">
            {title && (
              <h2
                className="text-[13px] font-semibold text-foreground truncate"
                style={{ letterSpacing: '-0.1px' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p
                className="text-[12px] text-muted-foreground"
                style={{ marginTop: 3 }}
              >
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}

      <div
        className={cn(contentClassName)}
        style={!noPadding ? { padding: '0 var(--pad-card) var(--pad-card-y)' } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
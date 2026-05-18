import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SectionCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function SectionCard({
  title,
  description,
  actions,
  children,
  noPadding = false,
  className,
}: SectionCardProps) {
  const hasHeader = title || description || actions;

  return (
    <div className={cn('bg-card border border-border rounded shadow-sm', className)}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-3 px-[16px] pt-[14px] pb-2">
          <div>
            {title && (
              <h2 className="text-[13px] font-semibold text-foreground tracking-[-0.1px]">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
          )}
        </div>
      )}
      <div className={cn(!noPadding && 'px-[16px] pb-[14px]', !hasHeader && !noPadding && 'pt-[14px]')}>
        {children}
      </div>
    </div>
  );
}
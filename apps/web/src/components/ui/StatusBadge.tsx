import { type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface StatusBadgeProps {
  variant: Variant;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

const variantStyles: Record<Variant, string> = {
  success: 'bg-success-subtle text-success border-success/30',
  warning: 'bg-warning-subtle text-warning border-warning/30',
  danger:  'bg-danger-subtle text-danger border-danger/30',
  neutral: 'bg-muted text-muted-foreground border-border',
  primary: 'bg-primary-subtle text-primary border-primary/30',
};

const dotColors: Record<Variant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger:  'bg-danger',
  neutral: 'bg-muted-foreground',
  primary: 'bg-primary',
};

export function StatusBadge({ variant, children, pulse = false, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
        variantStyles[variant],
        className
      )}
    >
      {pulse ? (
        <span className="relative w-2.5 h-2.5 flex-shrink-0">
          <span
            className={cn(
              'absolute inset-0 rounded-full animate-ping opacity-75',
              dotColors[variant]
            )}
          />
          <span className={cn('relative w-2.5 h-2.5 rounded-full block', dotColors[variant])} />
        </span>
      ) : (
        <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  );
}
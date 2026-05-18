/**
 * EmptyState — placeholder reutilizável para estados vazios
 * Spec: FRONTEND_SPEC.md seção 11.2
 *
 * Visual:
 *  - Borda tracejada slate-200, fundo card
 *  - Ícone centralizado (lucide-react, 40px), cor muted
 *  - Título 14px semibold + subtexto 13px muted
 *  - CTA primário opcional + CTA secundário opcional
 */
import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  /** Compact = padding reduzido, para uso dentro de cards pequenos */
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  primaryAction,
  secondaryAction,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-lg border border-dashed border-border bg-card/30',
        compact ? 'p-6 gap-2' : 'p-10 gap-3',
        className,
      )}
    >
      {icon && (
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground"
          style={{ background: 'hsl(var(--muted) / 0.6)' }}
        >
          {icon}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        {description && (
          <p className="text-[13px] text-muted-foreground max-w-xs">{description}</p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="mt-2 flex items-center gap-2">
          {secondaryAction && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
          {primaryAction && (
            <Button
              type="button"
              size="sm"
              onClick={primaryAction.onClick}
              disabled={primaryAction.loading}
            >
              {primaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

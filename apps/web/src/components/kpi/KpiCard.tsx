/**
 * KpiCard — card de indicador com valor, delta e sparkline como fundo
 * Referência visual: design_example/postoinsight/PostoInsight.html (.kpi)
 *
 * A sparkline ocupa o card inteiro como background (position absolute, opacity 0.28)
 * O texto fica em z-index: 1 acima dela.
 */
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkline } from '@/components/charts/Sparkline';
import { fDelta } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface KpiCardProps {
  label: string;
  value: string;           // já formatado (fBRL, fPct, etc.)
  delta?: number;          // variação % vs período anterior (0.032 = +3,2%)
  sparkline?: number[];    // série de pontos para a sparkline de fundo
  sparklineColor?: string;
  loading?: boolean;
  className?: string;
  /** Ícone opcional ao lado do label */
  icon?: ReactNode;
}

export function KpiCard({
  label,
  value,
  delta,
  sparkline,
  sparklineColor = '#0073BB',
  loading = false,
  className,
  icon,
}: KpiCardProps) {
  if (loading) {
    return (
      <Skeleton
        className={cn('rounded-lg', className)}
        style={{ minHeight: 116 }}
      />
    );
  }

  const deltaInfo = delta !== undefined ? fDelta(delta) : null;

  const deltaColorClass =
    !deltaInfo              ? '' :
    deltaInfo.neutral       ? 'text-muted-foreground' :
    deltaInfo.positive      ? 'text-[hsl(var(--success))]' :
                              'text-[hsl(var(--danger))]';

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-card flex flex-col',
        className,
      )}
      style={{
        minHeight: 116,
        padding: 'var(--kpi-pad)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Sparkline como fundo absoluto — opacidade baixa, atrás do texto */}
      {sparkline && sparkline.length > 0 && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ opacity: 0.28, zIndex: 0 }}
        >
          <Sparkline data={sparkline} color={sparklineColor} />
        </div>
      )}

      {/* Label */}
      <p
        className="relative truncate text-[11px] font-medium text-muted-foreground flex items-center gap-1.5"
        style={{ zIndex: 1 }}
      >
        {icon && <span className="opacity-70">{icon}</span>}
        {label}
      </p>

      {/* Valor principal */}
      <p
        className="relative truncate font-semibold tabular-nums text-foreground mt-1.5 mb-2"
        style={{
          fontSize: 'var(--kpi-val-size)',
          letterSpacing: '-0.6px',
          lineHeight: 1.1,
          zIndex: 1,
        }}
      >
        {value}
      </p>

      {/* Delta (variação vs período anterior) */}
      {deltaInfo && (
        <p
          className={cn('relative mt-auto text-[11px] font-medium', deltaColorClass)}
          style={{ zIndex: 1 }}
        >
          {deltaInfo.label}
        </p>
      )}
    </div>
  );
}
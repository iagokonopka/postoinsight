import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { DeltaTag } from './DeltaTag';
import { Sparkline } from '@/components/charts/Sparkline';

interface KpiCardProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  delta?: number;
  deltaLabel?: string;
  delta2?: number;
  delta2Label?: string;
  sparklineData?: number[];
  sparklineColor?: string;
  loading?: boolean;
  invertColors?: boolean;
  className?: string;
}

export function KpiCard({
  label,
  icon: Icon,
  value,
  delta,
  deltaLabel,
  delta2,
  delta2Label,
  sparklineData,
  sparklineColor = 'hsl(var(--primary))',
  loading = false,
  invertColors = false,
  className,
}: KpiCardProps) {
  if (loading) {
    return (
      <div className={cn('h-[108px] rounded bg-muted animate-pulse', className)} />
    );
  }

  return (
    <div
      className={cn(
        'relative bg-card border border-border rounded shadow-sm overflow-hidden flex flex-col min-h-[108px] p-[14px]',
        className
      )}
    >
      {/* Sparkline de fundo — decorativa */}
      {sparklineData && sparklineData.length > 1 && (
        <Sparkline
          data={sparklineData}
          color={sparklineColor}
          showArea
          opacity={0.25}
          className="absolute inset-0 w-full h-full pointer-events-none"
          aria-hidden
        />
      )}

      {/* Conteúdo */}
      <div className="relative z-10 flex flex-col h-full">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
          {Icon && <Icon size={12} strokeWidth={1.6} />}
          {label}
        </span>

        <span className="text-[22px] font-semibold text-foreground tracking-tight tabular-nums mt-1.5 mb-2 leading-none">
          {value}
        </span>

        <div className="mt-auto flex flex-col gap-0.5">
          {delta !== undefined && (
            <DeltaTag value={delta} label={deltaLabel} invertColors={invertColors} />
          )}
          {delta2 !== undefined && (
            <DeltaTag value={delta2} label={delta2Label} invertColors={invertColors} />
          )}
        </div>
      </div>
    </div>
  );
}
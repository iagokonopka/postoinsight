import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DeltaTagProps {
  value: number;
  label?: string;
  invertColors?: boolean;
  /** Mostra apenas o ícone + valor sem wrapper de label */
  compact?: boolean;
  className?: string;
}

const NEUTRAL_THRESHOLD = 0.15;

export function DeltaTag({
  value,
  label,
  invertColors = false,
  compact = false,
  className,
}: DeltaTagProps) {
  const absValue = Math.abs(value);
  const isNeutral = absValue < NEUTRAL_THRESHOLD;

  // Se invertColors: positivo é ruim (vermelho), negativo é bom (verde)
  const isPositive = invertColors ? value < 0 : value > 0;
  const isNegative = invertColors ? value > 0 : value < 0;

  const colorClass = isNeutral
    ? 'text-muted-foreground'
    : isPositive
      ? 'text-success'
      : 'text-danger';

  const Icon = isNeutral ? ArrowRight : isPositive ? ArrowUp : ArrowDown;

  const formatted = `${absValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })}%`;

  const tag = (
    <span className={cn('text-[11px] flex items-center gap-1', colorClass, className)}>
      <Icon size={10} strokeWidth={2.5} />
      {formatted}
    </span>
  );

  if (compact || !label) return tag;

  return (
    <div className="flex items-center gap-1.5">
      {tag}
      <span className="text-[11px] text-muted-foreground lowercase">{label}</span>
    </div>
  );
}
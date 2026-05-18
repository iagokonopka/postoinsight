/**
 * SegmentedControl — controle segmentado reutilizável
 * Referência visual: docs/design/PostoInsight.html (.seg)
 *
 * Genérico em T (string literal) — preserva o tipo das chaves para os callbacks.
 *
 * Exemplo:
 *   <SegmentedControl
 *     value={period}
 *     options={[
 *       { value: 'today', label: 'Hoje' },
 *       { value: 'this_month', label: 'Mês' },
 *     ]}
 *     onChange={setPeriod}
 *   />
 */
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Tooltip ao hover — opcional */
  title?: string;
  disabled?: boolean;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  options: ReadonlyArray<SegmentedOption<T>>;
  onChange: (value: T) => void;
  className?: string;
  /** Tamanho do controle — afeta altura e padding interno */
  size?: 'sm' | 'md';
}

export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  className,
  size = 'sm',
}: SegmentedControlProps<T>) {
  const h = size === 'md' ? 'h-8' : 'h-7';
  const px = size === 'md' ? 'px-3.5' : 'px-3';
  const text = size === 'md' ? 'text-[13px]' : 'text-xs';

  return (
    <div
      className={cn(
        'inline-flex gap-0.5 rounded-[7px] bg-muted p-[3px]',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            title={opt.title}
            disabled={opt.disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              h, px, text,
              'rounded-[5px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
              active
                ? 'bg-card text-foreground shadow-[var(--shadow-sm)]'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

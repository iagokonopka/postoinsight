/**
 * Sparkline — mini gráfico de linha/área
 *
 * Dois modos de uso:
 * 1. Fundo absoluto (KpiCard): sem height/width → ocupa 100% do container pai
 * 2. Inline fixo (legado): height={32} width={80}
 */
import { useMemo } from 'react';
import { EChart } from './EChart';
import { cn } from '@/lib/utils';

interface SparklineProps {
  data: number[];
  color?: string;
  /** Altura em px. Omitir para usar 100% do container (modo fundo absoluto). */
  height?: number;
  /** Largura em px. Omitir para usar 100% do container. */
  width?: number;
  className?: string;
}

export function Sparkline({ data, color = '#0073BB', height, width, className }: SparklineProps) {
  const option = useMemo(() => ({
    grid:   { top: 0, bottom: 0, left: 0, right: 0 },
    xAxis:  { type: 'category' as const, show: false, data: data.map((_, i) => i), boundaryGap: false },
    yAxis:  { type: 'value'   as const, show: false, scale: false },
    series: [{
      type:      'line' as const,
      data,
      symbol:    'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: { color, opacity: 0.18 },
      smooth:    0.4,
    }],
    animation: false,
  }), [data, color]);

  // Modo fundo absoluto — sem dimensões fixas, expande 100% do container pai
  if (height === undefined && width === undefined) {
    return (
      <EChart
        option={option}
        height="100%"
        className={cn('w-full h-full', className)}
      />
    );
  }

  // Modo inline — container div com dimensões explícitas
  return (
    <div
      className={cn('shrink-0', className)}
      style={{ width: width ?? 80, height: height ?? 32 }}
    >
      <EChart option={option} height="100%" className="w-full h-full" />
    </div>
  );
}
/**
 * Heatmap — CSS Grid + lógica de cor em JS puro. Sem Recharts.
 * Uso: padrões de venda por hora do dia × dia da semana (7 × 24).
 */
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface HeatmapProps {
  /** data[rowIndex][colIndex] = value */
  data: number[][]
  rowLabels: string[]
  colLabels: string[]
  /** Formatter for cell value display (default: compact number) */
  valueFormatter?: (v: number) => string
  className?: string
}

// ─── Color helpers ────────────────────────────────────────────────────────────

function cellBg(intensity: number): string {
  // intensity 0 = lightest (#EBF8FF approx hsl(204 100% 97%))
  // intensity 1 = darkest  (hsl(204 100% 37%))
  const lightness = 97 - intensity * 60
  return `hsl(204 100% ${lightness.toFixed(1)}%)`
}

function cellTextColor(intensity: number): string {
  return intensity > 0.5 ? 'white' : 'hsl(var(--foreground))'
}

function defaultFmt(v: number): string {
  if (v === 0) return ''
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `${Math.round(v / 1_000)}k`
  return String(v)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Heatmap({
  data,
  rowLabels,
  colLabels,
  valueFormatter = defaultFmt,
  className,
}: HeatmapProps) {
  const allValues = data.flat()
  const max = Math.max(...allValues) || 1

  return (
    <div className={cn('flex gap-2 overflow-x-auto', className)}>
      {/* Row labels */}
      <div className="flex flex-col gap-[5px] pt-[22px] flex-shrink-0">
        {rowLabels.map((label) => (
          <div
            key={label}
            className="h-9 flex items-center text-[11px] text-muted-foreground whitespace-nowrap pr-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Grid area */}
      <div className="flex-1 flex flex-col gap-[5px] min-w-0">
        {/* Col labels */}
        <div className="flex gap-[5px] mb-1">
          {colLabels.map((col) => (
            <div
              key={col}
              className="flex-1 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide truncate"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        {rowLabels.map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-[5px]">
            {colLabels.map((_, colIdx) => {
              const value = data[rowIdx]?.[colIdx] ?? 0
              const intensity = value / max
              return (
                <div
                  key={colIdx}
                  title={`${rowLabels[rowIdx]} · ${colLabels[colIdx]}: ${value.toLocaleString('pt-BR')}`}
                  className="flex-1 h-9 rounded-[5px] flex items-center justify-center
                             text-[10px] font-medium tabular-nums
                             transition-transform duration-100 hover:scale-105 cursor-default"
                  style={{
                    background: value > 0 ? cellBg(intensity) : 'hsl(var(--muted))',
                    color: value > 0 ? cellTextColor(intensity) : 'hsl(var(--muted-foreground))',
                  }}
                >
                  {valueFormatter(value)}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

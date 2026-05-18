/**
 * DonutChart — Recharts PieChart com innerRadius alto.
 * Centro customizável via div absoluta. Legenda em grid-cols-2 abaixo.
 */
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, type TooltipProps } from 'recharts'
import { CHART_TOOLTIP_STYLE } from '@/lib/chart-theme'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DonutSlice {
  name: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  centerLabel?: string
  centerValue?: string
  /** Height of the pie chart area (legend is additional) */
  height?: number
  showLegend?: boolean
  /** Called when a slice is clicked */
  onSliceClick?: (slice: DonutSlice) => void
  /** Key of the active (selected) slice name — highlights that slice */
  activeSlice?: string | null
  className?: string
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  return (
    <div style={CHART_TOOLTIP_STYLE.contentStyle}>
      <div className="flex items-center gap-2 text-[12px]">
        <span
          className="inline-block w-2 h-2 rounded-[2px] flex-shrink-0"
          style={{ background: entry.payload.color }}
        />
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.name}:</span>
        <span className="font-semibold tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
          {(entry.value as number)?.toLocaleString('pt-BR')}
        </span>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  height = 180,
  showLegend = true,
  onSliceClick,
  activeSlice,
  className,
}: DonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Pie + center overlay */}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="90%"
              paddingAngle={2}
              strokeWidth={0}
              onClick={onSliceClick ? (entry) => onSliceClick(entry as DonutSlice) : undefined}
              style={onSliceClick ? { cursor: 'pointer' } : undefined}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.name}
                  fill={entry.color}
                  opacity={activeSlice && activeSlice !== entry.name ? 0.4 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label */}
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            {centerLabel && (
              <span className="text-[10px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">
                {centerLabel}
              </span>
            )}
            {centerValue && (
              <span className="text-[14px] font-semibold text-foreground tabular-nums mt-0.5">
                {centerValue}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="grid grid-cols-2 gap-x-3.5 gap-y-2.5 mt-4">
          {data.map((d) => {
            const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0.0'
            return (
              <button
                key={d.name}
                type="button"
                onClick={onSliceClick ? () => onSliceClick(d) : undefined}
                className={cn(
                  'flex items-center gap-2 text-left',
                  onSliceClick && 'cursor-pointer hover:opacity-80 transition-opacity',
                  activeSlice && activeSlice !== d.name && 'opacity-50',
                )}
              >
                <span
                  className="w-2 h-2 rounded-[2px] flex-shrink-0"
                  style={{ background: d.color }}
                />
                <span className="flex-1 text-xs text-muted-foreground truncate">{d.name}</span>
                <span className="text-xs font-semibold text-foreground tabular-nums">{pct}%</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

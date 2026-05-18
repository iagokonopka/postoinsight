/**
 * MultiLineChart — Recharts LineChart com múltiplas séries.
 * Uso: comparação de séries (produtos, categorias) sem área preenchida.
 * Suporta strokeDasharray por série (ex: linha tracejada para margem %).
 */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from 'recharts'
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from '@/lib/chart-theme'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LineSerie {
  key: string
  color: string
  name: string
  /** e.g. "6 4" for dashed */
  strokeDasharray?: string
  strokeWidth?: number
}

interface MultiLineChartProps {
  data: Record<string, unknown>[]
  series: LineSerie[]
  xKey?: string
  yFormatter?: (v: number) => string
  tooltipFormatter?: (v: number, name: string) => string
  height?: number
  showLegend?: boolean
  className?: string
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
}: TooltipProps<number, string> & { formatter?: (v: number, name: string) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div style={CHART_TOOLTIP_STYLE.contentStyle}>
      <p style={{ ...CHART_TOOLTIP_STYLE.labelStyle, marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey as string} className="flex items-center gap-2 text-[12px]">
          <span
            className="inline-block w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: entry.color }}
          />
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.name}:</span>
          <span className="font-semibold tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
            {formatter
              ? formatter(entry.value as number, entry.name as string)
              : (entry.value as number)?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MultiLineChart({
  data,
  series,
  xKey = 'label',
  yFormatter,
  tooltipFormatter,
  height = 260,
  showLegend = true,
  className,
}: MultiLineChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID.stroke} />

          <XAxis
            dataKey={xKey}
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={yFormatter}
            width={yFormatter ? 56 : 40}
          />

          <Tooltip
            content={<CustomTooltip formatter={tooltipFormatter} />}
            cursor={CHART_TOOLTIP_STYLE.cursor}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}
            />
          )}

          {series.map((s) => (
            <Line
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              strokeWidth={s.strokeWidth ?? 2}
              strokeDasharray={s.strokeDasharray}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * LineAreaChart — Recharts AreaChart com gradiente.
 * Uso: evolução de receita/volume ao longo do tempo com área preenchida.
 * Regras ADR-011: ResponsiveContainer obrigatório, sem Recharts fora de /charts/.
 */
import {
  AreaChart,
  Area,
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

export interface Serie {
  key: string
  color: string
  name: string
  /** Optional: override area opacity (default 0.5 → 0.05 gradient) */
  areaOpacity?: number
}

interface LineAreaChartProps {
  data: Record<string, unknown>[]
  series: Serie[]
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

export function LineAreaChart({
  data,
  series,
  xKey = 'label',
  yFormatter,
  tooltipFormatter,
  height = 260,
  showLegend = false,
  className,
}: LineAreaChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <defs>
            {series.map((s) => {
              const gradId = `grad-${s.key}`
              const op = s.areaOpacity ?? 0.5
              return (
                <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={s.color} stopOpacity={op} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0.03} />
                </linearGradient>
              )
            })}
          </defs>

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
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.name}
              stroke={s.color}
              fill={`url(#grad-${s.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

/**
 * ComposedChart — Recharts ComposedChart com Bar (eixo esq.) + Line (eixo dir.).
 * Uso: receita bruta (barras) + margem % (linha), dual Y-axis.
 */
import {
  ComposedChart as ReComposedChart,
  Bar,
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

interface ComposedChartProps {
  data: Record<string, unknown>[]
  xKey?: string
  /** Bar series — eixo esquerdo (R$) */
  barKey: string
  barName: string
  barColor: string
  barFormatter?: (v: number) => string
  /** Line series — eixo direito (%) */
  lineKey: string
  lineName: string
  lineColor: string
  lineFormatter?: (v: number) => string
  height?: number
  showLegend?: boolean
  className?: string
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  barFormatter,
  lineFormatter,
  barKey,
  lineKey,
}: TooltipProps<number, string> & {
  barFormatter?: (v: number) => string
  lineFormatter?: (v: number) => string
  barKey: string
  lineKey: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div style={CHART_TOOLTIP_STYLE.contentStyle}>
      <p style={{ ...CHART_TOOLTIP_STYLE.labelStyle, marginBottom: 6 }}>{label}</p>
      {payload.map((entry) => {
        const isBar = entry.dataKey === barKey
        const fmt = isBar ? barFormatter : lineFormatter
        return (
          <div key={entry.dataKey as string} className="flex items-center gap-2 text-[12px]">
            <span
              className="inline-block w-2 h-2 rounded-[2px] flex-shrink-0"
              style={{ background: entry.color }}
            />
            <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.name}:</span>
            <span className="font-semibold tabular-nums" style={{ color: 'hsl(var(--foreground))' }}>
              {fmt ? fmt(entry.value as number) : (entry.value as number)?.toLocaleString('pt-BR')}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ComposedChart({
  data,
  xKey = 'label',
  barKey,
  barName,
  barColor,
  barFormatter,
  lineKey,
  lineName,
  lineColor,
  lineFormatter,
  height = 260,
  showLegend = true,
  className,
}: ComposedChartProps) {
  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke={CHART_GRID.stroke} />

          <XAxis
            dataKey={xKey}
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />

          {/* Left axis — monetary */}
          <YAxis
            yAxisId="left"
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={barFormatter}
            width={barFormatter ? 56 : 40}
          />

          {/* Right axis — percentage */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={CHART_TICK}
            tickLine={false}
            axisLine={false}
            tickFormatter={lineFormatter ?? ((v: number) => `${v}%`)}
            width={36}
          />

          <Tooltip
            content={
              <CustomTooltip
                barFormatter={barFormatter}
                lineFormatter={lineFormatter}
                barKey={barKey}
                lineKey={lineKey}
              />
            }
            cursor={CHART_TOOLTIP_STYLE.cursor}
          />

          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}
            />
          )}

          <Bar
            yAxisId="left"
            dataKey={barKey}
            name={barName}
            fill={barColor}
            radius={[3, 3, 0, 0]}
            maxBarSize={40}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey={lineKey}
            name={lineName}
            stroke={lineColor}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </ReComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

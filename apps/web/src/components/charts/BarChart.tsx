/**
 * BarChart — Recharts BarChart com suporte a layout vertical (ranking) e horizontal.
 * Layout "vertical" = barras horizontais (YAxis = categorias, XAxis = valores).
 * Layout "horizontal" = barras verticais padrão.
 */
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  type TooltipProps,
} from 'recharts'
import { CHART_GRID, CHART_TICK, CHART_TOOLTIP_STYLE } from '@/lib/chart-theme'
import { cn } from '@/lib/cn'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarChartProps {
  data: Record<string, unknown>[]
  dataKey: string
  nameKey?: string
  color?: string
  /** Array of colors per bar (overrides `color`) */
  colors?: string[]
  layout?: 'vertical' | 'horizontal'
  formatter?: (v: number) => string
  height?: number
  /** Width for category axis in vertical layout */
  categoryWidth?: number
  className?: string
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  layout,
}: TooltipProps<number, string> & {
  formatter?: (v: number) => string
  layout?: 'vertical' | 'horizontal'
}) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  // In vertical layout, label = category name (from YAxis)
  const displayLabel = layout === 'vertical' ? (entry.payload as Record<string, unknown>)[entry.name ?? 'name'] ?? label : label
  return (
    <div style={CHART_TOOLTIP_STYLE.contentStyle}>
      <p style={{ ...CHART_TOOLTIP_STYLE.labelStyle, marginBottom: 4 }}>{String(displayLabel)}</p>
      <span className="font-semibold tabular-nums text-[12px]" style={{ color: entry.color }}>
        {formatter ? formatter(entry.value as number) : (entry.value as number)?.toLocaleString('pt-BR')}
      </span>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function BarChart({
  data,
  dataKey,
  nameKey = 'name',
  color = 'hsl(var(--primary))',
  colors,
  layout = 'horizontal',
  formatter,
  height = 260,
  categoryWidth = 120,
  className,
}: BarChartProps) {
  const isVertical = layout === 'vertical'

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          layout={layout}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          {isVertical ? (
            <CartesianGrid horizontal={false} stroke={CHART_GRID.stroke} />
          ) : (
            <CartesianGrid vertical={false} stroke={CHART_GRID.stroke} />
          )}

          {isVertical ? (
            <>
              <XAxis
                type="number"
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatter}
              />
              <YAxis
                type="category"
                dataKey={nameKey}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
                width={categoryWidth}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={nameKey}
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={CHART_TICK}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatter}
                width={formatter ? 56 : 40}
              />
            </>
          )}

          <Tooltip
            content={<CustomTooltip formatter={formatter} layout={layout} />}
            cursor={CHART_TOOLTIP_STYLE.cursor}
          />

          <Bar
            dataKey={dataKey}
            fill={color}
            radius={isVertical ? [0, 3, 3, 0] : [3, 3, 0, 0]}
            maxBarSize={isVertical ? 24 : 40}
          >
            {colors &&
              data.map((_, i) => (
                <Cell key={i} fill={colors[i % colors.length]} />
              ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  )
}

// FuelLineChart — área+linha única + série de comparação tracejada opcional.
// Réplica do design (fuelLineEl). Recharts ComposedChart.
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'

type DotRenderProps = { cx?: number; cy?: number; index?: number }

export interface FuelLinePoint {
  label: string
  value: number
  cmp?: number   // série de comparação (opcional)
}

interface FuelLineChartProps {
  data: FuelLinePoint[]
  yFormatter: (v: number) => string
  tooltipFormatter?: (v: number) => string
  color?: string
  hasCompare?: boolean
  height?: number
}

function lastDot(color: string, lastIndex: number) {
  return function Dot(props: DotRenderProps) {
    const { cx, cy, index } = props
    if (index !== lastIndex || cx == null || cy == null) return <g />
    return <circle cx={cx} cy={cy} r={4} fill={color} />
  }
}

export function FuelLineChart({
  data,
  yFormatter,
  tooltipFormatter,
  color = 'hsl(var(--primary))',
  hasCompare = false,
  height = 260,
}: FuelLineChartProps) {
  const lastIndex = data.length - 1
  const ttFmt = tooltipFormatter ?? yFormatter
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 12, bottom: 4, left: 4 }}>
          <CartesianGrid stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            minTickGap={28}
            dy={6}
          />
          <YAxis
            tickFormatter={yFormatter}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickCount={4}
          />
          <Tooltip content={<ChartTooltip formatter={ttFmt} />} />
          {hasCompare && (
            <Line
              type="linear"
              dataKey="cmp"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              isAnimationActive={false}
            />
          )}
          <Area
            type="linear"
            dataKey="value"
            stroke={color}
            strokeWidth={2.4}
            fill={color}
            fillOpacity={0.1}
            dot={lastDot(color, lastIndex)}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

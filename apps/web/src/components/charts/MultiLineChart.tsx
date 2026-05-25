// MultiLineChart — multi-série (Combustível evolução, DRE margem%)
// Spec: FRONTEND_TODO Bloco 14 — combLines + marginEvolution
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'

export interface MultiLineSeries {
  key: string
  label: string
  color: string
  hide?: boolean
}

interface MultiLineChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: MultiLineSeries[]
  yFormatter?: (v: number) => string
  tooltipFormatter?: (v: number, name: string) => string
  pointRadius?: number
}

export function MultiLineChart({
  data,
  xKey,
  series,
  yFormatter = v => v.toFixed(1) + '%',
  tooltipFormatter,
  pointRadius = 0,
}: MultiLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />

        <XAxis
          dataKey={xKey}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />

        <YAxis
          tickFormatter={yFormatter}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />

        <Tooltip
          content={<ChartTooltip formatter={tooltipFormatter ?? ((v) => yFormatter(v))} />}
        />

        <Legend
          wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
          iconType="circle"
          iconSize={8}
        />

        {series.map(s => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color}
            strokeWidth={2}
            dot={pointRadius > 0 ? { r: pointRadius, fill: s.color } : false}
            activeDot={{ r: (pointRadius || 3) + 2 }}
            hide={s.hide}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

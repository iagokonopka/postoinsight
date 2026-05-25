// BarChart — simples e agrupado (reutilizável)
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'

export interface BarSeries {
  key: string
  label: string
  color: string
}

interface BarChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: BarSeries[]
  yFormatter?: (v: number) => string
  tooltipFormatter?: (v: number, name: string) => string
  maxBarSize?: number
  stacked?: boolean
}

export function BarChart({
  data,
  xKey,
  series,
  yFormatter = v => v.toLocaleString('pt-BR'),
  tooltipFormatter,
  maxBarSize = 40,
  stacked = false,
}: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ReBarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
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
          width={56}
        />

        <Tooltip content={<ChartTooltip formatter={tooltipFormatter ?? ((v) => yFormatter(v))} />} />

        {series.length > 1 && (
          <Legend
            wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
            iconType="circle"
            iconSize={8}
          />
        )}

        {series.map(s => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={maxBarSize}
            radius={stacked ? undefined : [4, 4, 0, 0]}
          />
        ))}
      </ReBarChart>
    </ResponsiveContainer>
  )
}

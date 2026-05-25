// LineAreaChart — Receita & Margem (Visão Geral / DRE evolução)
// Spec: FRONTEND_TODO Bloco 13 — ComposedChart com Area + Line
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'
import { fCurrency } from '@/lib/format'

export interface LineAreaSeries {
  key: string
  label: string
  color: string
  yAxisId?: 'left' | 'right'
  type?: 'area' | 'line'
  dashed?: boolean
  hide?: boolean
}

interface LineAreaChartProps {
  data: Record<string, unknown>[]
  xKey: string
  series: LineAreaSeries[]
  yLeftFormatter?: (v: number) => string
  yRightFormatter?: (v: number) => string
  tooltipFormatter?: (v: number, name: string) => string
  showRightAxis?: boolean
}

export function LineAreaChart({
  data,
  xKey,
  series,
  yLeftFormatter = v => 'R$ ' + (v / 1000).toFixed(0) + 'k',
  yRightFormatter = v => v.toFixed(1) + '%',
  tooltipFormatter,
  showRightAxis = false,
}: LineAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          {series.filter(s => s.type !== 'line').map(s => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={s.color} stopOpacity={0.5} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.05} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />

        <XAxis
          dataKey={xKey}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />

        <YAxis
          yAxisId="left"
          tickFormatter={yLeftFormatter}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />

        {showRightAxis && (
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={yRightFormatter}
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
        )}

        <Tooltip
          content={<ChartTooltip formatter={tooltipFormatter ?? ((v) => fCurrency(v))} />}
        />

        <Legend
          wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }}
          iconType="circle"
          iconSize={8}
        />

        {series.map(s => {
          const yId = s.yAxisId ?? 'left'
          if (s.type === 'line') {
            return (
              <Line
                key={s.key}
                yAxisId={yId}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '6 4' : undefined}
                dot={false}
                activeDot={{ r: 4 }}
                hide={s.hide}
              />
            )
          }
          return (
            <Area
              key={s.key}
              yAxisId={yId}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={`url(#grad-${s.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              hide={s.hide}
            />
          )
        })}
      </ComposedChart>
    </ResponsiveContainer>
  )
}

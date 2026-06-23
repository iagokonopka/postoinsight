// EvolutionChart — linha + área no estilo "Executivo" (ADR-017), réplica do design.
// Área sólida suave sob a receita, 3 grades horizontais, eixos mono/muted sem linha,
// ponto só no último ponto. Recharts ComposedChart (sem SVG manual).
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { ChartTooltip } from './ChartTooltip'

type DotRenderProps = { cx?: number; cy?: number; index?: number }

export interface EvolutionPoint {
  label: string
  receita: number
  margem: number
}

interface EvolutionChartProps {
  data: EvolutionPoint[]
  /** rótulo do eixo Y / tooltip (ex.: fCompact) */
  yFormatter: (v: number) => string
  tooltipFormatter?: (v: number) => string
  receitaLabel?: string
  margemLabel?: string
  /** cores (default: receita=foreground, margem=primary) */
  receitaColor?: string
  margemColor?: string
  height?: number
}

// Ponto só no último índice (igual ao design)
function lastDot(color: string, lastIndex: number) {
  return function Dot(props: DotRenderProps) {
    const { cx, cy, index } = props
    if (index !== lastIndex || cx == null || cy == null) return <g />
    return <circle cx={cx} cy={cy} r={4} fill={color} />
  }
}

export function EvolutionChart({
  data,
  yFormatter,
  tooltipFormatter,
  receitaColor = 'hsl(var(--foreground))',
  margemColor = 'hsl(var(--primary))',
  height = 260,
}: EvolutionChartProps) {
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
            width={64}
            tickCount={4}
          />
          <Tooltip content={<ChartTooltip formatter={ttFmt} />} />
          {/* Área + linha da receita (linha escura) */}
          <Area
            type="linear"
            dataKey="receita"
            stroke={receitaColor}
            strokeWidth={2.2}
            fill="hsl(var(--hero1-bg))"
            fillOpacity={1}
            dot={lastDot(receitaColor, lastIndex)}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          {/* Linha da margem (acento) */}
          <Line
            type="linear"
            dataKey="margem"
            stroke={margemColor}
            strokeWidth={2}
            dot={lastDot(margemColor, lastIndex)}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

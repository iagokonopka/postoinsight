// ScatterQuadrants — Matriz de Categorias (Conveniência)
// Spec: FRONTEND_TODO Bloco 15 — scatterQuadrants()
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { fCurrency, fInt } from '@/lib/format'

export interface ScatterPoint {
  name: string
  qtd: number       // x-axis
  margem: number    // y-axis (%)
  receita: number   // bubble size base
  color: string
}

interface ScatterQuadrantsProps {
  data: ScatterPoint[]
}

// Custom dot — bubble sized by receita
function CustomDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: ScatterPoint }
  const r = Math.max(5, Math.sqrt((payload.receita || 0) / 200))
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={payload.color + 'cc'}
      stroke={payload.color}
      strokeWidth={1.5}
    />
  )
}

// Custom tooltip
function ScatterTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>{p.name}</div>
      <div style={{ color: 'hsl(var(--muted-foreground))' }}>Qtd: <b style={{ color: 'hsl(var(--foreground))' }}>{fInt(p.qtd)}</b></div>
      <div style={{ color: 'hsl(var(--muted-foreground))' }}>Margem: <b style={{ color: 'hsl(var(--foreground))' }}>{p.margem.toFixed(1).replace('.', ',')}%</b></div>
      <div style={{ color: 'hsl(var(--muted-foreground))' }}>Receita: <b style={{ color: 'hsl(var(--foreground))' }}>{fCurrency(p.receita)}</b></div>
    </div>
  )
}


export function ScatterQuadrants({ data }: ScatterQuadrantsProps) {
  const medQtd    = data.length ? data.reduce((s, d) => s + d.qtd, 0) / data.length : 0
  const medMargem = data.length ? data.reduce((s, d) => s + d.margem, 0) / data.length : 0

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{ top: 20, right: 20, bottom: 10, left: 10 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" />

        <XAxis
          type="number"
          dataKey="qtd"
          name="Qtd"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => fInt(v)}
        />

        <YAxis
          type="number"
          dataKey="margem"
          name="Margem %"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v.toFixed(0) + '%'}
          width={44}
        />

        {/* Median reference lines */}
        <ReferenceLine x={medQtd}    yAxisId={0} stroke="hsl(var(--muted-foreground) / 0.4)" strokeDasharray="3 3" />
        <ReferenceLine y={medMargem} yAxisId={0} stroke="hsl(var(--muted-foreground) / 0.4)" strokeDasharray="3 3" />

        <Tooltip content={<ScatterTooltip />} />

        <Scatter data={data} shape={<CustomDot cx={0} cy={0} payload={data[0]} />} />

        {/* Quadrant labels rendered as SVG text via customized label */}
      </ScatterChart>
    </ResponsiveContainer>
  )
}

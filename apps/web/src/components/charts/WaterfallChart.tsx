// WaterfallChart — DRE mensal
// Spec: FRONTEND_TODO Bloco 16 — waterfall()
// Implemented as Recharts BarChart with invisible offset bars
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts'
import { fCurrency } from '@/lib/format'

export interface WaterfallItem {
  label: string
  value: number
  type: 'start' | 'minus' | 'total'
}

interface WaterfallChartProps {
  items: WaterfallItem[]
}

const COLORS = {
  start: '#0073BB',
  minus: '#dc2626',
  total: '#16a34a',
}

function buildWaterfallData(items: WaterfallItem[]) {
  let running = 0
  return items.map(item => {
    let offset = 0
    let barVal = 0

    if (item.type === 'start') {
      offset = 0
      barVal = item.value
      running = item.value
    } else if (item.type === 'minus') {
      barVal = item.value
      offset = running - item.value
      running = running - item.value
    } else {
      // total — from 0
      offset = 0
      barVal = item.value
    }

    return {
      label: item.label,
      offset,
      barVal,
      type: item.type,
      original: item.value,
    }
  })
}

function WaterfallTooltip({ active, payload }: { active?: boolean; payload?: { payload: ReturnType<typeof buildWaterfallData>[0] }[] }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '4px' }}>{d.label}</div>
      <div style={{ color: 'hsl(var(--muted-foreground))' }}>
        {fCurrency(d.original)}
      </div>
    </div>
  )
}

export function WaterfallChart({ items }: WaterfallChartProps) {
  const data = buildWaterfallData(items)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: 0 }} barCategoryGap="30%">
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />

        <XAxis
          dataKey="label"
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />

        <YAxis
          tickFormatter={v => 'R$ ' + (v / 1000).toFixed(0) + 'k'}
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={64}
        />

        <Tooltip content={<WaterfallTooltip />} />

        {/* Invisible offset bar */}
        <Bar dataKey="offset" stackId="wf" fill="transparent" isAnimationActive={false} />

        {/* Visible value bar */}
        <Bar dataKey="barVal" stackId="wf" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((entry, i) => (
            <Cell key={i} fill={COLORS[entry.type]} />
          ))}
          <LabelList
            dataKey="original"
            position="top"
            formatter={(v: number) => 'R$ ' + (v / 1000).toFixed(1).replace('.', ',') + 'k'}
            style={{ fill: 'hsl(var(--muted-foreground))', fontSize: '11px' }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// DonutChart — Recharts PieChart — spec: FRONTEND_TODO Bloco 9
import { PieChart, Pie, Cell, Tooltip } from 'recharts'
import { ChartTooltip } from './ChartTooltip'

export interface DonutSlice {
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  centerLabel?: string   // uppercase tiny label above value
  centerValue?: string   // formatted value in center
  tooltipFormatter?: (v: number, name: string) => string
  size?: number          // diameter px, default 180
}

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  tooltipFormatter,
  size = 180,
}: DonutChartProps) {
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div>
      {/* Chart */}
      <div style={{ position: 'relative', width: size, height: size, margin: '8px auto' }}>
        <PieChart width={size} height={size}>
          <Pie
            data={data}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            strokeWidth={2}
            stroke="hsl(var(--card))"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                formatter={tooltipFormatter ?? ((v) => {
                  const pct = total > 0 ? ((v / total) * 100).toFixed(1).replace('.', ',') : '0,0'
                  return `${pct}%`
                })}
              />
            }
          />
        </PieChart>

        {/* Center text */}
        {(centerLabel || centerValue) && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            {centerLabel && (
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.8px',
                color: 'hsl(var(--muted-foreground))',
                textTransform: 'uppercase',
              }}>
                {centerLabel}
              </div>
            )}
            {centerValue && (
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: 'hsl(var(--foreground))',
                marginTop: '2px',
                fontVariantNumeric: 'tabular-nums',
              }}>
                {centerValue}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '10px 14px',
        marginTop: '16px',
      }}>
        {data.map((entry, i) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(1).replace('.', ',') + '%' : '0%'
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: '12px', color: 'hsl(var(--muted-foreground))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.label}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>
                {pct}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

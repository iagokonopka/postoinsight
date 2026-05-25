// Shared custom tooltip for Recharts — matches design_example tooltip style
import type { TooltipProps } from 'recharts'

interface ChartTooltipProps extends TooltipProps<number, string> {
  formatter?: (value: number, name: string) => string
}

export function ChartTooltip({ active, payload, label, formatter }: ChartTooltipProps) {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: 'var(--shadow-md)',
    }}>
      {label && (
        <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
          {label}
        </div>
      )}
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: i > 0 ? '4px' : 0 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: entry.color, flexShrink: 0 }} />
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>{entry.name}</span>
          <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginLeft: 'auto', paddingLeft: '12px', fontVariantNumeric: 'tabular-nums' }}>
            {formatter ? formatter(entry.value as number, entry.name as string) : entry.value}
          </span>
        </div>
      ))}
    </div>
  )
}

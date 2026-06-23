// MixBar — barra horizontal empilhada + legenda com % (réplica do design "Mix de receita").
// CSS puro (divs), não é gráfico SVG.
import { fPct } from '@/lib/format'

export interface MixSlice {
  label: string
  value: number
  color: string
}

export function MixBar({ data }: { data: MixSlice[] }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1
  return (
    <div>
      <div style={{ display: 'flex', height: 18, borderRadius: 9, overflow: 'hidden', width: '100%', gap: 2 }}>
        {data.map(d => (
          <div
            key={d.label}
            title={d.label}
            style={{ width: `${(d.value / total) * 100}%`, background: d.color }}
          />
        ))}
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11, marginTop: 20, padding: 0 }}>
        {data.map(d => (
          <li key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
            <span style={{ width: 9, height: 9, borderRadius: 9, background: d.color, flexShrink: 0 }} />
            <span style={{ flex: 1, color: 'hsl(var(--foreground))' }}>{d.label}</span>
            <span className="mono" style={{ fontSize: 13.5, color: 'hsl(var(--muted-foreground))' }}>
              {fPct((d.value / total) * 100, 1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

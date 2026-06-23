// HBars — lista de barras horizontais (label + valor + trilho), réplica do design (barsEl).
// CSS puro. Usada em "Por produto", "Por turno", "Por posto" e no drawer.

export interface HBarRow {
  name: string
  value: number
  label: string   // valor formatado (ex.: "R$ 234k")
  color?: string  // default: acento
}

export function HBars({ data }: { data: HBarRow[] }) {
  const max = Math.max(...data.map(r => r.value), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
      {data.map(r => (
        <div key={r.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8, fontSize: 13.5 }}>
            <span style={{ color: 'hsl(var(--foreground))', fontWeight: 550, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name}</span>
            <span className="mono" style={{ fontSize: 13, color: 'hsl(var(--muted-foreground))', flexShrink: 0 }}>{r.label}</span>
          </div>
          <div style={{ height: 9, background: 'hsl(var(--border))', borderRadius: 9, overflow: 'hidden' }}>
            <div style={{ width: `${(r.value / max) * 100}%`, height: '100%', background: r.color ?? 'hsl(var(--primary))', borderRadius: 9 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

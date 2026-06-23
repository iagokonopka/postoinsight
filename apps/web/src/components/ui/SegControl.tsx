// SegControl — segmented control no estilo do design (.segs/.preset). Reuso: métrica, toggles.
interface SegControlProps<T extends string> {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}

export function SegControl<T extends string>({ options, value, onChange }: SegControlProps<T>) {
  return (
    <div style={{ display: 'inline-flex', padding: 3, background: 'hsl(var(--muted))', borderRadius: 9, gap: 2 }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              height: 30, padding: '0 13px', border: 'none',
              background: active ? 'hsl(var(--card))' : 'transparent',
              fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
              color: active ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
              borderRadius: 7, cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: active ? 'var(--shadow-sm)' : 'none',
              transition: 'background 0.14s, color 0.14s',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

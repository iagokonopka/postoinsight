import Link from 'next/link'

const PRESETS = [
  { key: 'hoje', label: 'Hoje' },
  { key: 'semana', label: 'Esta semana' },
  { key: 'mes', label: 'Este mês' },
  { key: 'mes_anterior', label: 'Mês anterior' },
] as const

export type PeriodoPreset = (typeof PRESETS)[number]['key']

export function resolvePeriodo(preset: PeriodoPreset | undefined): {
  data_inicio: string
  data_fim: string
  preset: PeriodoPreset
} {
  const today = new Date()
  const tz = (d: Date) => d.toISOString().slice(0, 10)
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const endOfPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0)
  const startOfPrevMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const day = today.getDay()
  // Semana começando na segunda
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - ((day + 6) % 7))

  switch (preset) {
    case 'hoje':
      return { data_inicio: tz(today), data_fim: tz(today), preset: 'hoje' }
    case 'semana':
      return { data_inicio: tz(startOfWeek), data_fim: tz(today), preset: 'semana' }
    case 'mes_anterior':
      return {
        data_inicio: tz(startOfPrevMonth),
        data_fim: tz(endOfPrevMonth),
        preset: 'mes_anterior',
      }
    case 'mes':
    default:
      return { data_inicio: tz(startOfMonth), data_fim: tz(today), preset: 'mes' }
  }
}

export function PeriodoSelector({
  basePath,
  current,
}: {
  basePath: string
  current: PeriodoPreset
}) {
  return (
    <div
      role="tablist"
      style={{
        display: 'inline-flex',
        gap: 'var(--space-1)',
        background: 'var(--color-bg-muted)',
        padding: 4,
        borderRadius: 'var(--radius-md)',
      }}
    >
      {PRESETS.map((p) => {
        const active = p.key === current
        return (
          <Link
            key={p.key}
            href={`${basePath}?periodo=${p.key}`}
            role="tab"
            aria-selected={active}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              background: active ? 'var(--color-bg)' : 'transparent',
              color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
              boxShadow: active ? 'var(--shadow-xs)' : 'none',
            }}
          >
            {p.label}
          </Link>
        )
      })}
    </div>
  )
}

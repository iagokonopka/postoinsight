import { formatCurrency, formatNumber, formatPercent } from '@/lib/format'

type Format = 'currency' | 'number' | 'percent'

export function KpiCard({
  label,
  value,
  format,
}: {
  label: string
  value: number | null | undefined
  format: Format
}) {
  const formatted =
    format === 'currency'
      ? formatCurrency(value)
      : format === 'percent'
        ? formatPercent(value)
        : formatNumber(value)

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5)',
        boxShadow: 'var(--shadow-xs)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        minHeight: 96,
      }}
    >
      <div
        style={{
          color: 'var(--color-text-muted)',
          fontSize: 'var(--text-sm)',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
        }}
      >
        {formatted}
      </div>
    </div>
  )
}

export function KpiCardSkeleton() {
  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-5)',
        minHeight: 96,
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
      }}
    >
      <div
        style={{
          width: '60%',
          height: 12,
          background: 'var(--color-bg-muted)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
      <div
        style={{
          width: '80%',
          height: 26,
          background: 'var(--color-bg-muted)',
          borderRadius: 'var(--radius-sm)',
        }}
      />
    </div>
  )
}

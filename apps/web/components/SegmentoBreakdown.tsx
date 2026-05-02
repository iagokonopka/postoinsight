import { formatCurrency, formatPercent } from '@/lib/format'

type Segmento = 'combustivel' | 'lubrificantes' | 'servicos' | 'conveniencia'

export type SegmentoRow = {
  segmento: Segmento
  receita_bruta: number
  margem_bruta: number
  margem_pct: number
  participacao_pct: number
}

const LABELS: Record<Segmento, string> = {
  combustivel: 'Combustível',
  lubrificantes: 'Lubrificantes',
  servicos: 'Serviços',
  conveniencia: 'Conveniência',
}

const COLORS: Record<Segmento, string> = {
  combustivel: 'var(--color-segment-combustivel)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos: 'var(--color-segment-servicos)',
  conveniencia: 'var(--color-segment-conveniencia)',
}

const ALL: Segmento[] = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia']

export function SegmentoBreakdown({ rows }: { rows: SegmentoRow[] }) {
  // Garante todos os 4 segmentos no display (zero quando ausentes — spec §6.4).
  const byKey = new Map(rows.map((r) => [r.segmento, r]))
  const display = ALL.map(
    (s): SegmentoRow =>
      byKey.get(s) ?? {
        segmento: s,
        receita_bruta: 0,
        margem_bruta: 0,
        margem_pct: 0,
        participacao_pct: 0,
      },
  )

  return (
    <div
      style={{
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
      }}
    >
      <h3
        style={{
          margin: '0 0 var(--space-4)',
          fontSize: 'var(--text-lg)',
          fontWeight: 600,
        }}
      >
        Breakdown por segmento
      </h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 'var(--space-3)' }}>
        {display.map((row) => (
          <li key={row.segmento} style={{ display: 'grid', gap: 'var(--space-2)' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                gap: 'var(--space-3)',
              }}
            >
              <span style={{ fontSize: 'var(--text-md)', fontWeight: 500 }}>
                {LABELS[row.segmento]}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                {formatCurrency(row.receita_bruta)} · {formatPercent(row.participacao_pct)} ·
                margem {formatPercent(row.margem_pct)}
              </span>
            </div>
            <div
              style={{
                background: 'var(--color-bg-muted)',
                borderRadius: 'var(--radius-sm)',
                height: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: COLORS[row.segmento],
                  width: `${Math.min(100, Math.max(0, row.participacao_pct))}%`,
                  height: '100%',
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

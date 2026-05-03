import { fBRL, fNum, fPct, fLitros } from '@/lib/formatters';

type FormatType = 'brl' | 'pct' | 'num' | 'litros';

interface KpiCardProps {
  label: string;
  value: number | null | undefined;
  sub?: string;
  delta?: number | null;  // variação % vs período anterior
  format?: FormatType;
  accent?: string;        // cor CSS para a borda superior (ex: 'var(--color-primary)')
}

export function KpiCard({ label, value, sub, delta, format = 'brl', accent }: KpiCardProps) {
  const formatted =
    format === 'pct'    ? fPct(value, 2) :
    format === 'num'    ? fNum(value) :
    format === 'litros' ? fLitros(value) :
    fBRL(value);

  return (
    <div style={{
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      flex: 1,
      minWidth: 0,
      boxShadow: 'var(--shadow-sm)',
      borderTop: accent ? `2px solid ${accent}` : 'none',
    }}>
      <div style={{
        fontSize: 10,
        color: 'var(--color-text-muted)',
        fontWeight: 600,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '.08em',
      }}>
        {label}
      </div>

      <div style={{
        fontSize: 30,
        fontWeight: 600,
        color: 'var(--color-text)',
        letterSpacing: '-0.02em',
        fontFamily: 'var(--font-mono)',
        marginBottom: 6,
        lineHeight: 1,
      }}>
        {formatted}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 400 }}>
            {sub}
          </span>
        )}
        {delta != null && (
          <DeltaBadge value={delta} />
        )}
      </div>
    </div>
  );
}

function DeltaBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: positive ? 'var(--color-success)' : 'var(--color-danger)',
      background: positive ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
      padding: '2px 6px',
      borderRadius: 'var(--radius-sm)',
    }}>
      {positive ? '+' : ''}{fNum(value, 1)}%
    </span>
  );
}
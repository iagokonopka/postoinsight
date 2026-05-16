import { Sparkline } from '@/components/charts/Sparkline';
import { fBRL, fNum, fPct, fLitros } from '@/lib/formatters';

type FormatType = 'brl' | 'pct' | 'num' | 'litros';

interface KpiCardProps {
  label: string;
  value: number | null | undefined;
  sub?: string;
  delta?: number | null;       // variação % simples (legado)
  deltaMes?: number | null;    // delta vs mês anterior (exibe badge "mês")
  deltaAno?: number | null;    // delta vs ano anterior (exibe badge "ano")
  format?: FormatType;
  accent?: string;             // cor CSS para borda superior (ex: '#0073BB')
  sparklineData?: number[];    // série histórica para mini-gráfico
  sparklineColor?: string;     // cor do sparkline (default: accent ou primary)
}

export function KpiCard({
  label, value, sub, delta, deltaMes, deltaAno,
  format = 'brl', accent, sparklineData, sparklineColor,
}: KpiCardProps) {
  const formatted =
    format === 'pct'    ? fPct(value, 2) :
    format === 'num'    ? fNum(value) :
    format === 'litros' ? fLitros(value) :
    fBRL(value);

  // Cor do sparkline: preferência explícita → accent hex → azul primário
  const spColor = sparklineColor ?? (accent?.startsWith('#') ? accent : '#0073BB');
  const hasSparkline = sparklineData && sparklineData.length > 1;

  return (
    <div style={{
      background: 'var(--color-bg)',
      borderRadius: 'var(--radius-md)',
      padding: 'var(--space-5)',
      flex: 1,
      minWidth: 0,
      boxShadow: 'var(--shadow-sm)',
      borderTop: accent ? `2px solid ${accent}` : 'none',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Topo: label + sparkline inline */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
        <div style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          paddingTop: 2,
        }}>
          {label}
        </div>
        {hasSparkline && (
          <Sparkline data={sparklineData!} color={spColor} width={72} height={28} />
        )}
      </div>

      {/* Valor principal */}
      <div style={{
        fontSize: 28,
        fontWeight: 600,
        color: 'var(--color-text)',
        letterSpacing: '-0.02em',
        fontFamily: 'var(--font-mono)',
        marginBottom: 6,
        lineHeight: 1,
      }}>
        {formatted}
      </div>

      {/* Rodapé: sub + deltas */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        {sub && (
          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', fontWeight: 400 }}>
            {sub}
          </span>
        )}
        {/* delta simples (legado — sem label) */}
        {delta != null && deltaMes == null && deltaAno == null && (
          <DeltaBadge value={delta} />
        )}
        {/* deltas duais mês / ano */}
        {deltaMes != null && <DeltaBadge value={deltaMes} label="mês" />}
        {deltaAno  != null && <DeltaBadge value={deltaAno}  label="ano" />}
      </div>
    </div>
  );
}

function DeltaBadge({ value, label }: { value: number; label?: string }) {
  const positive = value >= 0;
  return (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: positive ? 'var(--color-success)' : 'var(--color-danger)',
      background: positive ? 'var(--color-success-subtle)' : 'var(--color-danger-subtle)',
      padding: '2px 6px',
      borderRadius: 'var(--radius-sm)',
      display: 'inline-flex',
      gap: 3,
      alignItems: 'center',
    }}>
      {positive ? '↑' : '↓'}{fNum(Math.abs(value), 1)}%
      {label && <span style={{ fontWeight: 400, opacity: 0.75 }}>{label}</span>}
    </span>
  );
}

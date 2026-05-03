import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { SectionCard } from '@/components/ui/SectionCard';
import { fBRL, fPct, fNum } from '@/lib/formatters';

const SEGS = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const;
type Seg = typeof SEGS[number];

const SEG_LABELS: Record<Seg, string> = {
  combustivel:   'Combustível',
  lubrificantes: 'Lubrificantes',
  servicos:      'Serviços',
  conveniencia:  'Conveniência',
};

const SEG_COLORS: Record<Seg, string> = {
  combustivel:   'var(--color-segment-combustivel)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos:      'var(--color-segment-servicos)',
  conveniencia:  'var(--color-segment-conveniencia)',
};

// Shapes da API
interface MesDisponivel {
  meses: string[];
}

type MetricKey = 'receita_bruta' | 'descontos' | 'receita_liquida' | 'cmv' | 'margem_bruta';

interface DreData {
  meses: string[];
  linhas: {
    segmento: Seg | '_total';
    periodos: Record<string, Record<MetricKey, number>>;
  }[];
}

function mesLabel(mes: string) {
  const [ano, m] = mes.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return `${meses[parseInt(m) - 1]}/${ano.slice(2)}`;
}

function varPct(a: number, b: number | null | undefined): number | null {
  if (b == null || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

export function DrePage() {
  // Busca os meses disponíveis
  const { data: mesesData } = useQuery<MesDisponivel>({
    queryKey: ['dre-meses'],
    queryFn: () => api.get('/api/v1/dre/meses-disponiveis'),
  });

  const meses = mesesData?.meses ?? [];
  const [mesSel, setMesSel] = useState<string | null>(null);

  // Usa o primeiro mês disponível por padrão
  const mesAtual = mesSel ?? meses[0] ?? null;
  const mesIdx = meses.indexOf(mesAtual ?? '');
  const mesAnterior = mesIdx >= 0 ? meses[mesIdx + 1] ?? null : null;

  // Busca dados do DRE para os 2 meses
  const queryMeses = [mesAtual, mesAnterior].filter(Boolean).join(',');
  const { data: dreData } = useQuery<DreData>({
    queryKey: ['dre-mensal', queryMeses],
    queryFn: () => api.get(`/api/v1/dre/mensal?meses=${queryMeses}`),
    enabled: !!mesAtual,
  });

  // Acessa os dados de cada segmento/mês a partir da estrutura de linhas
  function getVal(seg: Seg | '_total', mes: string, metric: MetricKey): number {
    if (!dreData) return 0;
    const linha = dreData.linhas.find((l) => l.segmento === seg);
    return linha?.periodos?.[mes]?.[metric] ?? 0;
  }

  const cols = '180px repeat(4, 1fr) 1fr 72px';

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          DRE Mensal
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Demonstrativo de Resultado por segmento
        </p>
      </div>

      {/* Seletor de mês */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 500 }}>Mês:</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {meses.map((m, i) => {
            const sel = mesAtual === m;
            return (
              <button
                key={m}
                onClick={() => setMesSel(m)}
                style={{
                  padding: '5px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${sel ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: sel ? 'var(--color-primary-subtle)' : 'var(--color-bg)',
                  color: sel ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontFamily: 'inherit', fontSize: 12,
                  fontWeight: sel ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.12s',
                }}
              >
                {mesLabel(m)}
                {i === 0 && (
                  <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.6 }}>(parcial)</span>
                )}
              </button>
            );
          })}
        </div>
        {mesAnterior && (
          <span style={{ fontSize: 11, color: 'var(--color-text-subtle)', marginLeft: 4 }}>
            Comparativo com {mesLabel(mesAnterior)}
          </span>
        )}
      </div>

      {/* Tabela DRE */}
      <SectionCard>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: cols,
          alignItems: 'center', gap: 12,
          padding: '0 var(--space-5)', height: 44,
          background: 'var(--color-bg-subtle)',
          borderBottom: '2px solid var(--color-border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
            Linha
          </div>
          {SEGS.map((s) => (
            <div key={s} style={{ textAlign: 'right' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: SEG_COLORS[s], display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text)' }}>{SEG_LABELS[s]}</span>
              </div>
            </div>
          ))}
          <div style={{ textAlign: 'right' }}>
            {mesAtual && (
              <>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>{mesLabel(mesAtual)}</div>
                {meses[0] === mesAtual && (
                  <div style={{ fontSize: 9, color: 'var(--color-warning)', fontWeight: 600 }}>PARCIAL</div>
                )}
              </>
            )}
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {mesAnterior ? `vs ${mesLabel(mesAnterior)}` : '—'}
          </div>
        </div>

        {/* Linhas da DRE */}
        {mesAtual && (
          <>
            <DreRow label="RECEITA BRUTA"     metric="receita_bruta"  bold mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} />
            <DreRow label="(-) Descontos"      metric="descontos"      mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} isCost />
            <DreRow label="(=) RECEITA LÍQUIDA" metric="receita_liquida" bold mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} />
            <DreRow label="(-) CMV"            metric="cmv"            bold isCost mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} />
            <DreRow label="(=) MARGEM BRUTA"   metric="margem_bruta"   bold highlight mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} />
            <MargPctRow mes={mesAtual} mesAnterior={mesAnterior} getVal={getVal} cols={cols} />
          </>
        )}

        {/* Nota de rodapé */}
        <div style={{
          padding: '10px var(--space-5)',
          display: 'flex', alignItems: 'flex-start', gap: 7,
          borderTop: '1px solid var(--color-border)',
        }}>
          <svg width={13} height={13} fill="none" stroke="var(--color-warning)" strokeWidth={2} viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx={12} cy={12} r={10} />
            <line x1={12} y1={8} x2={12} y2={12} />
            <line x1={12} y1={16} x2="12.01" y2={16} />
          </svg>
          <p style={{ margin: 0, fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Este DRE vai até <strong style={{ color: 'var(--color-text)' }}>Margem Bruta</strong>.
            Despesas operacionais (aluguel, folha, energia) não estão incluídas.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Componentes internos ───────────────────────────────────────────────────

interface DreRowProps {
  label: string;
  metric: MetricKey;
  bold?: boolean;
  highlight?: boolean;
  isCost?: boolean;
  mes: string;
  mesAnterior: string | null;
  getVal: (seg: Seg | '_total', mes: string, metric: MetricKey) => number;
  cols: string;
}

function DreRow({ label, metric, bold, highlight, isCost, mes, mesAnterior, getVal, cols }: DreRowProps) {
  const totalAtual   = SEGS.reduce((a, s) => a + getVal(s, mes, metric), 0);
  const totalAnterior = mesAnterior ? SEGS.reduce((a, s) => a + getVal(s, mesAnterior, metric), 0) : null;
  const delta = varPct(totalAtual, totalAnterior);

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols,
      alignItems: 'center', gap: 12,
      padding: '0 var(--space-5)',
      height: bold ? 48 : 'var(--table-row-height)',
      background: bold ? 'var(--color-bg-subtle)' : highlight ? 'var(--color-success-subtle)' : 'transparent',
      borderBottom: '1px solid var(--color-border)',
      borderTop: bold ? '1px solid var(--color-border)' : 'none',
    }}>
      <div style={{ fontSize: bold ? 13 : 12, fontWeight: bold ? 700 : 500, color: 'var(--color-text)' }}>
        {label}
      </div>
      {SEGS.map((s) => (
        <div key={s} style={{
          textAlign: 'right',
          fontSize: bold ? 13 : 12,
          fontWeight: bold ? 700 : 500,
          fontFamily: 'var(--font-mono)',
          color: highlight ? 'var(--color-success)' : 'var(--color-text)',
        }}>
          {fBRL(getVal(s, mes, metric))}
        </div>
      ))}
      <div style={{
        textAlign: 'right',
        fontSize: bold ? 14 : 13,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: highlight ? 'var(--color-success)' : 'var(--color-text)',
      }}>
        {fBRL(totalAtual)}
      </div>
      <div style={{ textAlign: 'right' }}>
        {delta != null ? (
          <VarCell value={delta} isCost={isCost} />
        ) : (
          <span style={{ color: 'var(--color-text-subtle)', fontSize: 11 }}>—</span>
        )}
      </div>
    </div>
  );
}

function MargPctRow({ mes, mesAnterior, getVal, cols }: Pick<DreRowProps, 'mes' | 'mesAnterior' | 'getVal' | 'cols'>) {
  const rl  = SEGS.reduce((a, s) => a + getVal(s, mes, 'receita_liquida'), 0);
  const mb  = SEGS.reduce((a, s) => a + getVal(s, mes, 'margem_bruta'), 0);
  const pct = rl > 0 ? (mb / rl) * 100 : 0;

  const rlA  = mesAnterior ? SEGS.reduce((a, s) => a + getVal(s, mesAnterior, 'receita_liquida'), 0) : null;
  const mbA  = mesAnterior ? SEGS.reduce((a, s) => a + getVal(s, mesAnterior, 'margem_bruta'), 0) : null;
  const pctA = rlA && rlA > 0 ? (mbA! / rlA) * 100 : null;
  const diff = pctA != null ? pct - pctA : null;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: cols,
      alignItems: 'center', gap: 12,
      padding: '0 var(--space-5)', height: 48,
      background: 'var(--color-bg-subtle)',
      borderTop: '2px solid var(--color-border)',
    }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>Margem Bruta %</div>
      {SEGS.map((s) => {
        const srl = getVal(s, mes, 'receita_liquida');
        const smb = getVal(s, mes, 'margem_bruta');
        const spct = srl > 0 ? (smb / srl) * 100 : 0;
        return (
          <div key={s} style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
            {fPct(spct, 2)}
          </div>
        );
      })}
      <div style={{ textAlign: 'right', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
        {fPct(pct, 2)}
      </div>
      <div style={{ textAlign: 'right' }}>
        {diff != null && (
          <span style={{
            fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
            color: diff >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
          }}>
            {diff >= 0 ? '+' : ''}{fNum(diff, 2)}pp
          </span>
        )}
      </div>
    </div>
  );
}

function VarCell({ value, isCost }: { value: number; isCost?: boolean }) {
  const positive = value >= 0;
  // Para linhas de custo, variação positiva é ruim (custo subiu)
  const good = isCost ? !positive : positive;
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
      color: good ? 'var(--color-success)' : 'var(--color-danger)',
    }}>
      {positive ? '+' : ''}{fNum(value, 1)}%
    </span>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { HorizBar } from '@/components/ui/HorizBar';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { fBRL, fPct, fNum } from '@/lib/formatters';

type Granularidade = 'dia' | 'semana' | 'mes';

// Shapes da API (ver prompt de especificação)
interface VendasResumo {
  totais: {
    receita_bruta: number;
    descontos: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    qtd_itens: number;
  };
  por_segmento: {
    segmento: string;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    participacao_pct: number;
  }[];
}

interface VendasEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number }[];
}

const SEG_COLORS: Record<string, string> = {
  combustivel:   'var(--color-segment-combustivel)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos:      'var(--color-segment-servicos)',
  conveniencia:  'var(--color-segment-conveniencia)',
};

const SEG_LABELS: Record<string, string> = {
  combustivel:   'Combustível',
  lubrificantes: 'Lubrificantes',
  servicos:      'Serviços',
  conveniencia:  'Conveniência',
};

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

export function DashboardPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [granularidade, setGranularidade] = useState<Granularidade>('dia');
  const [expandedSeg, setExpandedSeg] = useState<string | null>(null);

  const qs = buildParams(range, locationParam);

  const { data: resumo, isLoading: loadingResumo } = useQuery<VendasResumo>({
    queryKey: ['vendas-resumo', qs],
    queryFn: () => api.get(`/api/v1/vendas/resumo?${qs}`),
  });

  const evoQs = `${qs}&granularidade=${granularidade}`;
  const { data: evolucao } = useQuery<VendasEvolucao>({
    queryKey: ['vendas-evolucao', evoQs],
    queryFn: () => api.get(`/api/v1/vendas/evolucao?${evoQs}`),
  });

  const t = resumo?.totais;
  const evoData = (evolucao?.serie ?? []).map((p) => ({
    label: p.periodo,
    receita_bruta: p.receita_bruta,
    margem_bruta: p.margem_bruta,
  }));

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Visão Geral
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Consolidado de todas as categorias no período
        </p>
      </div>

      {/* KPIs */}
      {loadingResumo ? (
        <SkeletonKpiRow />
      ) : (
        <div className="kpi-row">
          <KpiCard label="Receita Bruta"   value={t?.receita_bruta}  />
          <KpiCard label="CMV"             value={t?.cmv}            sub="custo das mercadorias" />
          <KpiCard label="Margem Bruta"    value={t?.margem_bruta}   />
          <KpiCard label="Margem %"        value={t?.margem_pct}     format="pct" />
          <KpiCard label="Itens vendidos"  value={t?.qtd_itens}      format="num" sub="transações" />
        </div>
      )}

      {/* Evolução */}
      <SectionCard
        title="Evolução de Receita"
        action={<GranSwitcher value={granularidade} onChange={setGranularidade} />}
      >
        <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
          <LineAreaChart
            data={evoData}
            xKey="label"
            series={[
              { name: 'Receita Bruta', dataKey: 'receita_bruta', color: 'var(--color-primary)' },
              { name: 'Margem Bruta',  dataKey: 'margem_bruta',  color: 'var(--color-success)' },
            ]}
            height={220}
          />
          <ChartLegend items={[
            { color: 'var(--color-segment-combustivel)', label: 'Receita Bruta' },
            { color: 'var(--color-segment-servicos)',    label: 'Margem Bruta' },
          ]} />
        </div>
      </SectionCard>

      {/* Breakdown por segmento */}
      <SectionCard title="Breakdown por Segmento">
        {/* Header da tabela */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px',
          alignItems: 'center', gap: 14,
          padding: '0 var(--space-5)', height: 36,
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {['Segmento', '', 'Receita', 'Margem', 'Mg %', 'CMV', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i > 1 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {(resumo?.por_segmento ?? []).map((seg) => {
          const color = SEG_COLORS[seg.segmento] ?? 'var(--color-primary)';
          const exp = expandedSeg === seg.segmento;
          return (
            <div key={seg.segmento}>
              <button
                onClick={() => setExpandedSeg(exp ? null : seg.segmento)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px',
                  alignItems: 'center', gap: 14,
                  padding: '0 var(--space-5)', height: 'var(--table-row-height)',
                  background: exp ? 'var(--color-bg-subtle)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                {/* Nome do segmento */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                    {SEG_LABELS[seg.segmento] ?? seg.segmento}
                  </span>
                </div>

                {/* Barra de participação */}
                <HorizBar pct={seg.participacao_pct} color={color} />

                {/* Receita */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                    {fBRL(seg.receita_bruta)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {fPct(seg.participacao_pct)}
                  </div>
                </div>

                {/* Margem bruta */}
                <div style={{ textAlign: 'right', fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {fBRL(seg.margem_bruta)}
                </div>

                {/* Margem % */}
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {fPct(seg.margem_pct)}
                </div>

                {/* CMV */}
                <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {fBRL(seg.cmv)}
                </div>

                {/* Chevron */}
                <svg
                  width={13} height={13} fill="none"
                  stroke="var(--color-text-muted)" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          );
        })}

        {/* Total */}
        {resumo && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px',
            alignItems: 'center', gap: 14,
            padding: '0 var(--space-5)', height: 'var(--table-row-height)',
            background: 'var(--color-bg-subtle)',
            borderTop: '2px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total</div>
            <div />
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fBRL(t?.receita_bruta)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fBRL(t?.margem_bruta)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
              {fPct(t?.margem_pct)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              {fBRL(t?.cmv)}
            </div>
            <div />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// ── Componentes internos ───────────────────────────────────────────────────

function GranSwitcher({ value, onChange }: { value: Granularidade; onChange: (g: Granularidade) => void }) {
  const opts: { id: Granularidade; label: string }[] = [
    { id: 'dia',    label: 'Dia' },
    { id: 'semana', label: 'Semana' },
    { id: 'mes',    label: 'Mês' },
  ];
  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-bg-muted)',
      borderRadius: 'var(--radius-sm)',
      padding: 2, gap: 2,
    }}>
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '3px 9px',
            borderRadius: 4, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11,
            background: value === o.id ? 'var(--color-bg)' : 'transparent',
            color: value === o.id ? 'var(--color-text)' : 'var(--color-text-muted)',
            fontWeight: value === o.id ? 600 : 400,
            boxShadow: value === o.id ? 'var(--shadow-xs)' : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SkeletonKpiRow() {
  return (
    <div className="kpi-row">
      {[0,1,2,3,4].map((i) => (
        <div key={i} style={{
          flex: 1, height: 100,
          background: 'var(--color-bg)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-sm)',
          animation: 'pulse 1.5s ease-in-out infinite',
        }} />
      ))}
    </div>
  );
}

// Não usado diretamente, mas evita warnings de import não utilizado
void fNum;
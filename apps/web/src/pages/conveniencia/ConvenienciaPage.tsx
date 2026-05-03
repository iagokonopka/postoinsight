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

const SEG_COLORS: Record<string, string> = {
  conveniencia:  'var(--color-segment-conveniencia)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos:      'var(--color-segment-servicos)',
};

const SEG_LABELS: Record<string, string> = {
  conveniencia:  'Conveniência',
  lubrificantes: 'Lubrificantes',
  servicos:      'Serviços',
};

interface Categoria {
  categoria_codigo: string;
  categoria_descricao: string;
  receita_bruta: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  participacao_pct: number;
}

interface Segmento {
  segmento: string;
  receita_bruta: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  participacao_pct: number;
  categorias?: Categoria[];
}

interface ConvenienciaResumo {
  totais: {
    receita_bruta: number;
    descontos: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    qtd_itens: number;
  };
  por_segmento: Segmento[];
}

interface ConvenienciaEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number }[];
}

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

export function ConvenienciaPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [expandedSeg, setExpandedSeg] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<ConvenienciaResumo>({
    queryKey: ['conveniencia-resumo', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<ConvenienciaEvolucao>({
    queryKey: ['conveniencia-evolucao', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/evolucao?${qs}`),
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
          Conveniência e Serviços
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Loja, lubrificantes e serviços
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Receita Bruta"  value={t?.receita_bruta}  />
        <KpiCard label="CMV"            value={t?.cmv} />
        <KpiCard label="Margem Bruta"   value={t?.margem_bruta}  />
        <KpiCard label="Margem %"       value={t?.margem_pct}    format="pct" />
        <KpiCard label="Itens vendidos" value={t?.qtd_itens}     format="num" />
      </div>

      {/* Evolução */}
      <SectionCard title="Evolução — Receita de Loja">
        <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
          <LineAreaChart
            data={evoData}
            xKey="label"
            series={[
              { name: 'Receita Bruta', dataKey: 'receita_bruta', color: '#D97706' },
              { name: 'Margem Bruta',  dataKey: 'margem_bruta',  color: '#16A34A' },
            ]}
            height={200}
          />
          <ChartLegend items={[
            { color: '#D97706', label: 'Receita Bruta' },
            { color: '#16A34A', label: 'Margem Bruta' },
          ]} />
        </div>
      </SectionCard>

      {/* Breakdown por segmento com drill-down em categorias */}
      <SectionCard title="Breakdown por Segmento">
        {(resumo?.por_segmento ?? []).map((seg) => {
          const color = SEG_COLORS[seg.segmento] ?? 'var(--color-primary)';
          const segExp = expandedSeg === seg.segmento;

          return (
            <div key={seg.segmento}>
              {/* Linha do segmento */}
              <button
                onClick={() => { setExpandedSeg(segExp ? null : seg.segmento); setExpandedCat(null); }}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '160px 1fr 110px 90px 90px 28px',
                  alignItems: 'center', gap: 14,
                  padding: '0 var(--space-5)', height: 'var(--table-row-height)',
                  background: segExp ? 'var(--color-bg-subtle)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                    {SEG_LABELS[seg.segmento] ?? seg.segmento}
                  </span>
                </div>
                <HorizBar pct={seg.participacao_pct} color={color} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                    {fBRL(seg.receita_bruta)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                    {fPct(seg.participacao_pct)}
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {fPct(seg.margem_pct)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {fBRL(seg.cmv)}
                </div>
                <svg
                  width={13} height={13} fill="none"
                  stroke="var(--color-text-muted)" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ transform: segExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Categorias do segmento */}
              {segExp && (seg.categorias ?? []).map((cat) => {
                const catExp = expandedCat === cat.categoria_codigo;
                return (
                  <div key={cat.categoria_codigo} style={{ background: 'var(--color-bg-subtle)' }}>
                    <button
                      onClick={() => setExpandedCat(catExp ? null : cat.categoria_codigo)}
                      style={{
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '160px 1fr 110px 90px 90px 28px',
                        alignItems: 'center', gap: 14,
                        padding: '0 var(--space-5) 0 44px', height: 40,
                        background: catExp ? 'var(--color-bg-muted)' : 'transparent',
                        border: 'none', borderBottom: '1px solid var(--color-border)',
                        cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, color: color,
                          background: `${color}22`, padding: '1px 5px', borderRadius: 3,
                        }}>
                          {cat.categoria_codigo}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--color-text)' }}>{cat.categoria_descricao}</span>
                      </div>
                      <HorizBar pct={cat.participacao_pct} color={color} />
                      <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
                        {fBRL(cat.receita_bruta)}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 600 }}>
                        {fPct(cat.margem_pct)}
                      </div>
                      <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                        {fPct(cat.participacao_pct)}
                      </div>
                      <svg
                        width={12} height={12} fill="none"
                        stroke="var(--color-text-muted)" strokeWidth={2} viewBox="0 0 24 24"
                        style={{ transform: catExp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* Total */}
        {t && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 110px 90px 90px 28px',
            alignItems: 'center', gap: 14,
            padding: '0 var(--space-5)', height: 'var(--table-row-height)',
            background: 'var(--color-bg-subtle)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Loja</div>
            <div />
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fBRL(t.receita_bruta)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
              {fPct(t.margem_pct)}
            </div>
            <div /><div />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

// evita warning de unused import
void fNum;
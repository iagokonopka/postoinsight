import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { HorizBar } from '@/components/ui/HorizBar';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { DualAxisChart } from '@/components/charts/DualAxisChart';
import { DonutChart, DonutSlice } from '@/components/charts/DonutChart';
import { HeatmapChart, HeatmapData } from '@/components/charts/HeatmapChart';
import { fBRL, fPct, fNum } from '@/lib/formatters';

type Granularidade = 'dia' | 'semana' | 'mes';

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
    label?: string;
  }[];
}

interface VendasEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number; margem_pct: number }[];
}

interface TopProduto {
  rank: number;
  produto: string;
  categoria: string;
  receita: number;
  margem_pct: number;
  qtd: number | null;
  participacao_pct: number;
}

interface VendasTop {
  produtos: TopProduto[];
}

const SEG_COLORS: Record<string, string> = {
  combustivel:   'var(--color-segment-combustivel)',
  lubrificantes: 'var(--color-segment-lubrificantes)',
  servicos:      'var(--color-segment-servicos)',
  conveniencia:  'var(--color-segment-conveniencia)',
};

const SEG_COLORS_HEX: Record<string, string> = {
  combustivel:   '#0073BB',
  lubrificantes: '#6B40C4',
  servicos:      '#1D8102',
  conveniencia:  '#EC7211',
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
  const [sortBy, setSortBy] = useState<'receita' | 'margem'>('receita');

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

  const { data: topData } = useQuery<VendasTop>({
    queryKey: ['vendas-top', qs],
    queryFn: () => api.get(`/api/v1/vendas/top-produtos?${qs}&limit=10`),
  });

  const t = resumo?.totais;

  // Dados do gráfico dual-axis
  const evoChartData = (evolucao?.serie ?? []).map((p) => ({
    label: p.periodo,
    receita_bruta: p.receita_bruta,
    margem_pct: p.margem_pct ?? (p.receita_bruta > 0 ? (p.margem_bruta / p.receita_bruta) * 100 : 0),
  }));

  // Dados do donut de mix
  const donutData: DonutSlice[] = (resumo?.por_segmento ?? []).map((seg) => ({
    label: seg.label ?? SEG_LABELS[seg.segmento] ?? seg.segmento,
    value: seg.receita_bruta,
    color: SEG_COLORS_HEX[seg.segmento] ?? '#545B64',
  }));

  // Top produtos ordenados
  const produtos = topData?.produtos ?? [];
  const maxReceita = Math.max(...produtos.map((p) => p.receita), 1);
  const topSorted = [...produtos].sort((a, b) =>
    sortBy === 'margem' ? b.margem_pct - a.margem_pct : b.receita - a.receita
  );

  // Heatmap — placeholder (endpoint não existe ainda)
  const heatmapWeeks = ['S1', 'S2', 'S3', 'S4'];
  const heatmapDows = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const heatmapData: HeatmapData[] = [];

  // Sparklines derivadas da evolução de receita (série temporal de receita_bruta e margem_bruta)
  const spReceita  = (evolucao?.serie ?? []).map((p) => p.receita_bruta);
  const spMargem   = (evolucao?.serie ?? []).map((p) => p.margem_bruta);
  const spMargemPct = (evolucao?.serie ?? []).map((p) =>
    p.receita_bruta > 0 ? (p.margem_bruta / p.receita_bruta) * 100 : 0
  );

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
          <KpiCard label="Receita Bruta"   value={t?.receita_bruta}  sparklineData={spReceita}   sparklineColor="#0073BB" />
          <KpiCard label="CMV"             value={t?.cmv}            sub="custo das mercadorias" />
          <KpiCard label="Margem Bruta"    value={t?.margem_bruta}   sparklineData={spMargem}    sparklineColor="#1D8102" />
          <KpiCard label="Margem %"        value={t?.margem_pct}     format="pct" sparklineData={spMargemPct} sparklineColor="#1D8102" />
          <KpiCard label="Itens vendidos"  value={t?.qtd_itens}      format="num" sub="transações" />
        </div>
      )}

      {/* Evolução dual-axis + Mix (2 colunas) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 'var(--space-5)' }}>
        <SectionCard
          title="Evolução de Receita & Margem"
          subtitle="Receita bruta (barras) · Margem % (linha tracejada, eixo dir.)"
          action={<GranSwitcher value={granularidade} onChange={setGranularidade} />}
        >
          <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
            <DualAxisChart data={evoChartData} height={220} />
            <ChartLegend items={[
              { color: 'var(--color-primary)', label: 'Receita Bruta' },
              { color: '#8D6708', label: 'Margem % (eixo dir.)', dashed: true },
            ]} />
          </div>
        </SectionCard>

        <SectionCard title="Mix por Segmento" subtitle="% da receita bruta">
          <div style={{ padding: 'var(--space-5)', display: 'flex', justifyContent: 'center' }}>
            {donutData.length > 0 ? (
              <DonutChart data={donutData} size={160} thickness={22} />
            ) : (
              <Skeleton height={200} />
            )}
          </div>
        </SectionCard>
      </div>

      {/* Breakdown por segmento */}
      <SectionCard title="Breakdown por Segmento">
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 110px 110px 90px 90px 28px',
          alignItems: 'center', gap: 14,
          padding: '0 var(--space-5)', height: 36,
          background: 'var(--color-bg-subtle)',
          borderBottom: '1px solid var(--color-border)',
        }}>
          {['Segmento', '', 'Receita', 'CMV', 'Mg %', 'Margem', ''].map((h, i) => (
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
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {fBRL(seg.cmv)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {fPct(seg.margem_pct)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {fBRL(seg.margem_bruta)}
                </div>
                <svg
                  width={13} height={13} fill="none"
                  stroke="var(--color-text-muted)" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {exp && (
                <div style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: '12px 46px' }}>
                  <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Ver detalhes no dashboard de {SEG_LABELS[seg.segmento] ?? seg.segmento}.
                  </span>
                </div>
              )}
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
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              {fBRL(t?.cmv)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
              {fPct(t?.margem_pct)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fBRL(t?.margem_bruta)}
            </div>
            <div />
          </div>
        )}
      </SectionCard>

      {/* Top 10 produtos */}
      <SectionCard
        title="Top 10 Produtos por Receita"
        subtitle="Rede inteira · período atual"
        action={
          <div style={{ display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 }}>
            {([['receita', 'Receita'], ['margem', 'Margem %']] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setSortBy(id)}
                style={{
                  padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: 11,
                  background: sortBy === id ? 'var(--color-bg)' : 'transparent',
                  color: sortBy === id ? 'var(--color-text)' : 'var(--color-text-muted)',
                  fontWeight: sortBy === id ? 600 : 400,
                  boxShadow: sortBy === id ? 'var(--shadow-xs)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        }
      >
        {topSorted.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
            Endpoint /top-produtos não disponível — em breve
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '36px 1fr 130px 1fr 110px 90px 90px',
              gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
              borderBottom: '1px solid var(--color-border)',
              background: 'var(--color-bg-subtle)',
            }}>
              {['#', 'Produto', 'Categoria', 'Peso', 'Receita', 'Mg %', 'Qtd'].map((h, i) => (
                <div key={h} style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  textAlign: i >= 4 ? 'right' : 'left',
                }}>{h}</div>
              ))}
            </div>
            {topSorted.map((p, idx) => {
              const catColor = SEG_COLORS_HEX[p.categoria] ?? '#545B64';
              return (
                <div
                  key={p.rank}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 130px 1fr 110px 90px 90px',
                    gap: 12, padding: '0 var(--space-5)',
                    height: 'var(--table-row-height)', alignItems: 'center',
                    borderBottom: idx < topSorted.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                    {idx + 1}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.produto}
                  </div>
                  <div>
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: catColor,
                      background: `${catColor}20`, padding: '2px 6px',
                      borderRadius: 3, fontFamily: 'var(--font-mono)',
                    }}>
                      {SEG_LABELS[p.categoria] ?? p.categoria}
                    </span>
                  </div>
                  <HorizBar pct={(p.receita / maxReceita) * 100} color={catColor} />
                  <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
                    {fBRL(p.receita)}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 700 }}>
                    {fPct(p.margem_pct)}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                    {p.qtd != null ? fNum(p.qtd) : '—'}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </SectionCard>

      {/* Heatmap de padrão semanal */}
      <SectionCard title="Padrão Semanal de Receita" subtitle="Receita por dia × semana do período">
        {heatmapData.length > 0 ? (
          <HeatmapChart
            data={heatmapData}
            weeks={heatmapWeeks}
            dows={heatmapDows}
            colorBase="#0073BB"
          />
        ) : (
          <div style={{
            margin: 'var(--space-4)', padding: 'var(--space-8)',
            border: '1px dashed var(--color-border)', borderRadius: 'var(--radius-md)',
            background: 'var(--color-bg-subtle)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-warning)', background: 'var(--color-warning-subtle)', padding: '3px 8px', borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase' }}>
              Em breve
            </span>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              Mapa de calor de vendas por dia da semana
            </div>
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
    <div style={{ display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 }}>
      {opts.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          style={{
            padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
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

function Skeleton({ height = 80 }: { height?: number }) {
  return (
    <div style={{
      height, background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-md)',
      animation: 'pulse 1.5s ease-in-out infinite', width: '100%',
    }} />
  );
}

function SkeletonKpiRow() {
  return (
    <div className="kpi-row">
      {[0, 1, 2, 3, 4].map((i) => (
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

// evita warnings de import não utilizado
void fNum;
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { HorizBar } from '@/components/ui/HorizBar';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { DrillDownTable, DrillGrupo, SubgrupoRow } from '@/components/ui/DrillDownTable';
import { ProductDetailPanel } from '@/components/ui/ProductDetailPanel';
import { GroupDetailPanel } from '@/components/ui/GroupDetailPanel';
import { StackedAreaChart } from '@/components/charts/StackedAreaChart';
import { fBRL, fPct, fNum } from '@/lib/formatters';

const CONV_COLOR = '#EC7211';

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
}

interface ConvenienciaEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number }[];
}

interface TopGrupo {
  rank: number;
  grupo_id: number;
  grupo_descricao: string;
  segmento: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_itens: number;
  participacao_pct: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProdutoDetalhe = any;

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

export function ConvenienciaPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [selectedProduto, setSelectedProduto] = useState<ProdutoDetalhe | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ nome: string; nivel: 'grupo' | 'subgrupo'; receita_bruta: number; receita_liquida?: number; cmv: number; margem_bruta: number; margem_pct: number; participacao_pct: number; qtd_itens?: number; qtd_venda?: number } | null>(null);

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<ConvenienciaResumo>({
    queryKey: ['conveniencia-resumo', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<ConvenienciaEvolucao>({
    queryKey: ['conveniencia-evolucao', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/evolucao?${qs}&segmento=conveniencia`),
  });

  const { data: topGrupos } = useQuery<{ grupos: TopGrupo[] }>({
    queryKey: ['conveniencia-top-grupos', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/top-grupos?${qs}&limit=10`),
  });

  // Grupos no formato do DrillDownTable (para expansão grupo→subgrupo→produto)
  const { data: gruposData } = useQuery<{ grupos: TopGrupo[] }>({
    queryKey: ['conveniencia-grupos-drill', qs],
    queryFn: () => api.get(`/api/v1/conveniencia/top-grupos?${qs}&limit=50`),
  });

  const t = resumo?.totais;

  const evoData = (evolucao?.serie ?? []).map((p) => ({
    label: p.periodo,
    receita_bruta: p.receita_bruta,
    margem_bruta: p.margem_bruta,
  }));

  const spReceita   = (evolucao?.serie ?? []).map((p) => p.receita_bruta);
  const spMargem    = (evolucao?.serie ?? []).map((p) => p.margem_bruta);
  const spMargemPct = (evolucao?.serie ?? []).map((p) =>
    p.receita_bruta > 0 ? (p.margem_bruta / p.receita_bruta) * 100 : 0
  );

  const topList = topGrupos?.grupos ?? [];
  const maxTopReceita = Math.max(...topList.map((g) => g.receita_bruta), 1);

  // Grupos no formato do DrillDownTable
  const drillGrupos: DrillGrupo[] = (gruposData?.grupos ?? []).map((g) => ({
    grupo_id:        g.grupo_id,
    grupo_descricao: g.grupo_descricao,
    receita_bruta:   g.receita_bruta,
    receita_liquida: g.receita_liquida,
    cmv:             g.cmv,
    margem_bruta:    g.margem_bruta,
    margem_pct:      g.margem_pct,
    qtd_itens:       g.qtd_itens,
    participacao_pct: g.participacao_pct,
  }));

  return (
    <div className="page-content" style={{ position: 'relative' }}>
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Conveniência
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Loja, bebidas, lanches, tabacaria e cafés
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Receita Bruta"  value={t?.receita_bruta} accent={CONV_COLOR} sparklineData={spReceita}   sparklineColor={CONV_COLOR} />
        <KpiCard label="CMV"            value={t?.cmv} />
        <KpiCard label="Margem Bruta"   value={t?.margem_bruta}  sparklineData={spMargem}    sparklineColor="#1D8102" />
        <KpiCard label="Margem %"       value={t?.margem_pct}    format="pct" sparklineData={spMargemPct} sparklineColor="#1D8102" />
        <KpiCard label="Itens vendidos" value={t?.qtd_itens}     format="num" />
      </div>

      {/* Evolução */}
      <SectionCard title="Evolução de Receita" subtitle="Receita bruta e margem bruta no período">
        <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
          {evoData.length > 0 ? (
            <StackedAreaChart
              data={evoData}
              xKey="label"
              series={[
                { name: 'Receita Bruta', dataKey: 'receita_bruta', color: CONV_COLOR },
                { name: 'Margem Bruta',  dataKey: 'margem_bruta',  color: '#1D8102' },
              ]}
              height={200}
              formatY={fBRL}
            />
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
              Carregando...
            </div>
          )}
          <ChartLegend items={[
            { color: CONV_COLOR, label: 'Receita Bruta' },
            { color: '#1D8102', label: 'Margem Bruta' },
          ]} />
        </div>
      </SectionCard>

      {/* Top 10 grupos */}
      <SectionCard title="Top 10 Grupos por Receita" subtitle="Conveniência · período atual">
        {topList.length === 0 ? (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
            Carregando…
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '32px 1fr 1fr 110px 80px 70px',
              gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
              background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
            }}>
              {['#', 'Grupo', 'Peso', 'Receita', 'Mg %', 'Itens'].map((h, i) => (
                <div key={h} style={{
                  fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  textAlign: i >= 3 ? 'right' : 'left',
                }}>{h}</div>
              ))}
            </div>
            {topList.map((g, idx) => (
              <div key={g.grupo_id} style={{
                display: 'grid',
                gridTemplateColumns: '32px 1fr 1fr 110px 80px 70px',
                gap: 12, padding: '0 var(--space-5)',
                height: 'var(--table-row-height)', alignItems: 'center',
                borderBottom: idx < topList.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                  {g.rank}
                </div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {g.grupo_descricao}
                </div>
                <HorizBar pct={(g.receita_bruta / maxTopReceita) * 100} color={CONV_COLOR} />
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
                  {fBRL(g.receita_bruta)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-success)', fontWeight: 700 }}>
                  {fPct(g.margem_pct)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {fNum(g.qtd_itens)}
                </div>
              </div>
            ))}
          </>
        )}
      </SectionCard>

      {/* Breakdown drill-down: grupo → subgrupo → produto */}
      <SectionCard
        title="Grupos de Conveniência"
        subtitle="Clique num grupo para expandir subgrupos e produtos individuais"
      >
        {drillGrupos.length > 0 ? (
          <DrillDownTable
            grupos={drillGrupos}
            segmento="conveniencia"
            qs={qs}
            onSelectGrupo={(g) => setSelectedGroup({
              nome: g.grupo_descricao ?? `Grupo ${g.grupo_id}`,
              nivel: 'grupo',
              receita_bruta: g.receita_bruta,
              receita_liquida: g.receita_liquida,
              cmv: g.cmv,
              margem_bruta: g.margem_bruta,
              margem_pct: g.margem_pct,
              participacao_pct: g.participacao_pct,
              qtd_itens: g.qtd_itens,
            })}
            onSelectSubgrupo={(sg: SubgrupoRow) => setSelectedGroup({
              nome: sg.subgrupo_descricao,
              nivel: 'subgrupo',
              receita_bruta: sg.receita_bruta,
              receita_liquida: sg.receita_liquida,
              cmv: sg.cmv,
              margem_bruta: sg.margem_bruta,
              margem_pct: sg.margem_pct,
              participacao_pct: sg.participacao_pct,
              qtd_itens: sg.qtd_itens,
            })}
            onSelectProduto={(p) => { setSelectedGroup(null); setSelectedProduto(p as ProdutoDetalhe); }}
          />
        ) : (
          <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
            Carregando…
          </div>
        )}
      </SectionCard>

      {/* Side panels */}
      {selectedProduto && !selectedGroup && (
        <ProductDetailPanel
          produto={selectedProduto}
          qs={qs}
          onClose={() => setSelectedProduto(null)}
        />
      )}
      {selectedGroup && (
        <GroupDetailPanel
          item={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}
    </div>
  );
}
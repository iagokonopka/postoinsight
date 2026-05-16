import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { DrillDownTable, type DrillGrupo, type SubgrupoRow } from '@/components/ui/DrillDownTable';
import { ProductDetailPanel } from '@/components/ui/ProductDetailPanel';
import { GroupDetailPanel } from '@/components/ui/GroupDetailPanel';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { DonutChart } from '@/components/charts/DonutChart';
import { fBRL, fPct, fNum } from '@/lib/formatters';

// Paleta de cores para grupos de lubrificantes
const GRUPO_CORES = [
  '#7C3AED', '#A855F7', '#C084FC', '#DDD6FE',
  '#6D28D9', '#8B5CF6', '#4C1D95',
];

interface LubrificantesResumo {
  totais: {
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    qtd_itens: number;
  };
  por_grupo: {
    grupo_id: number;
    grupo_descricao: string | null;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    qtd_itens: number;
    participacao_pct: number;
  }[];
}

interface LubrificantesEvolucao {
  serie: { periodo: string; receita_bruta: number; margem_bruta: number; qtd_itens: number }[];
}

interface ProdutoDetalhe {
  source_produto_id: string;
  descricao_produto: string;
  segmento: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_venda: number;
  qtd_itens: number;
  participacao_pct: number;
}

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

export function LubrificantesPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [selectedProduto, setSelectedProduto] = useState<ProdutoDetalhe | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{ nome: string; nivel: 'grupo' | 'subgrupo'; receita_bruta: number; receita_liquida?: number; cmv: number; margem_bruta: number; margem_pct: number; participacao_pct: number; qtd_itens?: number; qtd_venda?: number } | null>(null);

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<LubrificantesResumo>({
    queryKey: ['lubrificantes-resumo', qs],
    queryFn: () => api.get(`/api/v1/lubrificantes/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<LubrificantesEvolucao>({
    queryKey: ['lubrificantes-evolucao', qs],
    queryFn: () => api.get(`/api/v1/lubrificantes/evolucao?${qs}&granularidade=dia`),
  });

  const t = resumo?.totais;
  const grupos = resumo?.por_grupo ?? [];
  const serie = evolucao?.serie ?? [];

  // Sparklines
  const spReceita = serie.map((r) => r.receita_bruta);
  const spMargem  = serie.map((r) => r.margem_bruta);

  // Evolução: 1 série total
  const evoData = serie.map((r) => ({ label: r.periodo, Receita: r.receita_bruta }));
  const LUBRIF_COLOR = '#7C3AED';

  // Donut: mix por grupo
  const donutData = grupos.slice(0, 7).map((g, i) => ({
    name:  g.grupo_descricao ?? `Grupo ${g.grupo_id}`,
    value: g.receita_bruta,
    color: GRUPO_CORES[i] ?? '#6D28D9',
  }));

  // Grupos para DrillDownTable
  const gruposParaDrill: DrillGrupo[] = grupos.map((g) => ({
    grupo_id:         g.grupo_id,
    grupo_descricao:  g.grupo_descricao,
    receita_bruta:    g.receita_bruta,
    receita_liquida:  g.receita_liquida,
    cmv:              g.cmv,
    margem_bruta:     g.margem_bruta,
    margem_pct:       g.margem_pct,
    qtd_itens:        g.qtd_itens,
    participacao_pct: g.participacao_pct,
  }));

  return (
    <div className="page-content">
      {/* Painel de detalhe do produto selecionado */}
      {selectedProduto && !selectedGroup && (
        <ProductDetailPanel
          produto={selectedProduto}
          qs={qs}
          onClose={() => setSelectedProduto(null)}
        />
      )}
      {/* Painel de detalhe de grupo/subgrupo */}
      {selectedGroup && (
        <GroupDetailPanel
          item={selectedGroup}
          onClose={() => setSelectedGroup(null)}
        />
      )}

      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Lubrificantes
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Receita, margem e mix por grupo de lubrificantes
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Receita Bruta"  value={t?.receita_bruta}  sparklineData={spReceita} sparklineColor={LUBRIF_COLOR} accent={LUBRIF_COLOR} />
        <KpiCard label="CMV"            value={t?.cmv} />
        <KpiCard label="Margem Bruta"   value={t?.margem_bruta}   sparklineData={spMargem} sparklineColor="#1D8102" />
        <KpiCard label="Margem %"       value={t?.margem_pct}     format="pct" sparklineData={spMargem.map((m, i) => spReceita[i] > 0 ? (m / spReceita[i]) * 100 : 0)} sparklineColor="#1D8102" />
        <KpiCard label="Itens vendidos" value={t?.qtd_itens} format="numero" />
      </div>

      {/* Evolução + Donut */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 'var(--space-4)' }}>
        <SectionCard title="Evolução de Receita">
          <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
            <LineAreaChart
              data={evoData}
              xKey="label"
              series={[{ name: 'Receita', dataKey: 'Receita', color: LUBRIF_COLOR, areaOpacity: 0.12 }]}
              height={200}
              formatY={fBRL}
            />
            <ChartLegend items={[{ color: LUBRIF_COLOR, label: 'Receita Bruta' }]} />
          </div>
        </SectionCard>

        <SectionCard title="Mix por Grupo">
          <div style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            {donutData.length > 0 ? (
              <>
                <DonutChart
                  data={donutData}
                  centerLabel="Lubrif."
                  centerValue={fBRL(t?.receita_bruta)}
                  size={180}
                />
                <div style={{ width: '100%' }}>
                  {donutData.map((d) => (
                    <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                        {fBRL(d.value)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Sem dados</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Drill-down: grupo → subgrupo → produto */}
      <SectionCard title="Grupos de Lubrificantes" subtitle="Clique num grupo para expandir subgrupos e produtos individuais">
        {gruposParaDrill.length > 0 ? (
          <DrillDownTable
            grupos={gruposParaDrill}
            segmento="lubrificantes"
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
          <EmptyState message="Nenhum dado de lubrificantes para o período selecionado." />
        )}
      </SectionCard>

      {/* Tabela simplificada por grupo */}
      {grupos.length > 0 && (
        <SectionCard title="Ranking por Grupo">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 110px 80px 110px 80px 70px',
            gap: 10, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
            background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
          }}>
            {['Grupo', 'Receita', 'Margem %', 'CMV', 'Itens', 'Part. %'].map((h, i) => (
              <div key={i} style={{
                fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: i === 0 ? 'left' : 'right',
              }}>{h}</div>
            ))}
          </div>

          {grupos.map((g, idx) => (
            <div
              key={g.grupo_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 110px 80px 110px 80px 70px',
                gap: 10, padding: '0 var(--space-5)',
                height: 'var(--table-row-height)', alignItems: 'center',
                borderBottom: idx < grupos.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: GRUPO_CORES[idx] ?? LUBRIF_COLOR, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {g.grupo_descricao ?? `Grupo ${g.grupo_id}`}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{fBRL(g.receita_bruta)}</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>{fPct(g.margem_pct)}</div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{fBRL(g.cmv)}</div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{fNum(g.qtd_itens)}</div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>{fPct(g.participacao_pct)}</div>
            </div>
          ))}
        </SectionCard>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{
      margin: 'var(--space-4)',
      padding: '36px var(--space-5)',
      border: '1px dashed var(--color-border)',
      borderRadius: 'var(--radius-md)',
      background: 'var(--color-bg-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>{message}</p>
    </div>
  );
}
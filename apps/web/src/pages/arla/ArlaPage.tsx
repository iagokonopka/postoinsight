import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { DrillDownTable, type DrillGrupo } from '@/components/ui/DrillDownTable';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { StackedAreaChart } from '@/components/charts/StackedAreaChart';
import { fBRL, fNum, fPct, fLitros } from '@/lib/formatters';

// Cor padrão Arla
const ARLA_COLOR = '#0891B2';

interface ArlaResumo {
  totais: {
    volume_litros: number;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
  };
  por_produto: {
    grupo_id: number;
    grupo_descricao: string | null;
    volume_litros: number;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    preco_medio_litro: number | null;
    custo_medio_litro: number | null;
    participacao_volume_pct: number;
    participacao_receita_pct: number;
  }[];
}

interface ArlaEvolucao {
  serie: { periodo: string; volume_litros: number; receita_bruta: number; margem_bruta: number }[];
}

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

type ChartType = 'line' | 'stacked';

export function ArlaPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [metric, setMetric] = useState<'volume' | 'receita'>('volume');
  const [chartType, setChartType] = useState<ChartType>('line');

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<ArlaResumo>({
    queryKey: ['arla-resumo', qs],
    queryFn: () => api.get(`/api/v1/arla/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<ArlaEvolucao>({
    queryKey: ['arla-evolucao', qs],
    queryFn: () => api.get(`/api/v1/arla/evolucao?${qs}&granularidade=dia`),
  });

  const t = resumo?.totais;
  const produtos = resumo?.por_produto ?? [];
  const serie = evolucao?.serie ?? [];

  // Sparklines
  const spVolume  = serie.map((r) => r.volume_litros);
  const spReceita = serie.map((r) => r.receita_bruta);
  const spMargem  = serie.map((r) => r.margem_bruta);

  // Evolução — cada produto como série
  const evoData = serie.map((row) => ({
    label: row.periodo,
    ...(metric === 'volume'
      ? { 'Arla 32': row.volume_litros }
      : { 'Arla 32': row.receita_bruta }),
  }));

  const chartSeries = [{ name: 'Arla 32', dataKey: 'Arla 32', color: ARLA_COLOR }];
  const formatY = metric === 'volume' ? (v: number) => fNum(v) + ' L' : fBRL;

  // Grupos para DrillDownTable
  const grupos: DrillGrupo[] = produtos.map((p) => ({
    grupo_id:         p.grupo_id,
    grupo_descricao:  p.grupo_descricao,
    receita_bruta:    p.receita_bruta,
    receita_liquida:  p.receita_liquida,
    cmv:              p.cmv,
    margem_bruta:     p.margem_bruta,
    margem_pct:       p.margem_pct,
    participacao_pct: p.participacao_receita_pct,
  }));

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Arla 32
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Volume, receita e margem de Arla 32 por produto
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Volume Total"  value={t?.volume_litros} format="litros" accent={ARLA_COLOR} sparklineData={spVolume}  sparklineColor={ARLA_COLOR} />
        <KpiCard label="Receita Bruta" value={t?.receita_bruta} sparklineData={spReceita} sparklineColor={ARLA_COLOR} />
        <KpiCard label="CMV"           value={t?.cmv} />
        <KpiCard label="Margem Bruta"  value={t?.margem_bruta}  sparklineData={spMargem}  sparklineColor="#1D8102" />
        <KpiCard label="Margem %"      value={t?.margem_pct}    format="pct" sparklineData={spMargem.map((m, i) => spReceita[i] > 0 ? (m / spReceita[i]) * 100 : 0)} sparklineColor="#1D8102" />
      </div>

      {/* Evolução */}
      <SectionCard
        title="Evolução"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SegSwitcher
              options={[['line', 'Linha'], ['stacked', 'Área']]}
              value={chartType}
              onChange={(v) => setChartType(v as ChartType)}
            />
            <SegSwitcher
              options={[['volume', 'Volume (L)'], ['receita', 'Receita']]}
              value={metric}
              onChange={(v) => setMetric(v as 'volume' | 'receita')}
            />
          </div>
        }
      >
        <div style={{ padding: 'var(--space-4) var(--space-5) var(--space-2)' }}>
          {chartType === 'stacked' ? (
            <StackedAreaChart
              data={evoData}
              xKey="label"
              series={chartSeries}
              height={220}
              formatY={formatY}
            />
          ) : (
            <LineAreaChart
              data={evoData}
              xKey="label"
              series={chartSeries.map((s) => ({ ...s, areaOpacity: 0.12 }))}
              height={220}
              formatY={formatY}
            />
          )}
          <ChartLegend items={[{ color: ARLA_COLOR, label: 'Arla 32' }]} />
        </div>
      </SectionCard>

      {/* Tabela de produtos com drill-down */}
      <SectionCard title="Produtos — Arla 32" subtitle="Clique num grupo para expandir subgrupos e produtos">
        {grupos.length > 0 ? (
          <DrillDownTable
            grupos={grupos}
            segmento="combustivel"
            qs={qs}
          />
        ) : (
          <EmptyState message="Nenhum dado de Arla 32 para o período selecionado." />
        )}
      </SectionCard>

      {/* Tabela volumétrica simplificada */}
      {produtos.length > 0 && (
        <SectionCard title="Breakdown por Produto">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px 100px 80px 110px 90px 90px 90px',
            gap: 10, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
            background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
          }}>
            {['Produto', 'Volume (L)', 'Part. %', 'Receita', 'Mg %', 'R$/L', 'Cst/L'].map((h, i) => (
              <div key={i} style={{
                fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                textAlign: i === 0 ? 'left' : 'right',
              }}>{h}</div>
            ))}
          </div>

          {produtos.map((p, idx) => (
            <div
              key={p.grupo_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 100px 80px 110px 90px 90px 90px',
                gap: 10, padding: '0 var(--space-5)',
                height: 'var(--table-row-height)', alignItems: 'center',
                borderBottom: idx < produtos.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: ARLA_COLOR, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {p.grupo_descricao ?? `Grupo ${p.grupo_id}`}
                </span>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {fNum(p.volume_litros)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {fPct(p.participacao_volume_pct)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                {fBRL(p.receita_bruta)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                {fPct(p.margem_pct)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                {p.preco_medio_litro != null ? `R$ ${p.preco_medio_litro.toFixed(2)}` : '—'}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                {p.custo_medio_litro != null ? `R$ ${p.custo_medio_litro.toFixed(2)}` : '—'}
              </div>
            </div>
          ))}

          {/* Total */}
          {t && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: '200px 100px 80px 110px 90px 90px 90px',
              gap: 10, padding: '0 var(--space-5)',
              height: 'var(--table-row-height)', alignItems: 'center',
              background: 'var(--color-bg-subtle)',
              borderTop: '2px solid var(--color-border)',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {fLitros(t.volume_litros)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>100%</div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {fBRL(t.receita_bruta)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                {fPct(t.margem_pct)}
              </div>
              <div /><div />
            </div>
          )}
        </SectionCard>
      )}
    </div>
  );
}

// ── Helpers internos ───────────────────────────────────────────────────────────

function SegSwitcher({
  options,
  value,
  onChange,
}: {
  options: [string, string][];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 }}>
      {options.map(([id, label]) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 11,
            background: value === id ? 'var(--color-bg)' : 'transparent',
            color: value === id ? 'var(--color-text)' : 'var(--color-text-muted)',
            fontWeight: value === id ? 600 : 400,
            boxShadow: value === id ? 'var(--shadow-xs)' : 'none',
          }}
        >
          {label}
        </button>
      ))}
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
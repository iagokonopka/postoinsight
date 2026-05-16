import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { StackedAreaChart } from '@/components/charts/StackedAreaChart';
import { fBRL, fNum, fPct, fLitros } from '@/lib/formatters';

// Tipos para a tabela de subgrupos/produtos
interface Subgrupo {
  subgrupo_id: number;
  subgrupo_descricao: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  volume_litros: number;
  participacao_receita_pct: number;
  participacao_volume_pct: number;
}

interface ProdutoDrill {
  source_produto_id: string;
  descricao_produto: string;
  receita_bruta: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
  qtd_venda: number;
  participacao_pct: number;
}

// Cores fixas por produto de combustível
const PRODUTO_CORES: Record<string, string> = {
  'Gasolina Comum': '#2563EB',
  'Diesel S-10':    '#7C3AED',
  'Etanol':         '#16A34A',
  'Arla 32':        '#0891B2',
};

interface CombustivelResumo {
  totais: {
    volume_litros: number;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
  };
  por_produto: {
    grupo_id: string;
    grupo_descricao: string;
    volume_litros: number;
    receita_bruta: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    preco_medio_litro: number;
    custo_medio_litro: number;
    participacao_volume_pct: number;
    participacao_receita_pct: number;
  }[];
}

interface CombustivelEvolucao {
  serie: Record<string, number | string>[];
}

function buildParams(range: { data_inicio: string; data_fim: string }, locationParam?: string) {
  const p = new URLSearchParams({ data_inicio: range.data_inicio, data_fim: range.data_fim });
  if (locationParam) p.set('location_id', locationParam);
  return p.toString();
}

type ChartType = 'line' | 'stacked';

export function CombustivelPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [showArla, setShowArla] = useState(false);
  const [metric, setMetric] = useState<'volume' | 'receita'>('volume');
  const [chartType, setChartType] = useState<ChartType>('line');

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<CombustivelResumo>({
    queryKey: ['combustivel-resumo', qs],
    queryFn: () => api.get(`/api/v1/combustivel/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<CombustivelEvolucao>({
    queryKey: ['combustivel-evolucao', qs],
    queryFn: () => api.get(`/api/v1/combustivel/evolucao?${qs}&granularidade=dia`),
  });

  // Subgrupos (Diesel / Gasolina) via fato_venda — breakdown real
  const [expandedSubgrupo, setExpandedSubgrupo] = useState<number | null>(null);
  const { data: subgruposData } = useQuery<{ subgrupos: Subgrupo[] }>({
    queryKey: ['combustivel-subgrupos', qs],
    queryFn: () => api.get(`/api/v1/combustivel/subgrupos?${qs}`),
  });

  // Produtos do subgrupo expandido
  const { data: drillData } = useQuery<{ produtos: ProdutoDrill[] }>({
    queryKey: ['combustivel-drill-produtos', qs, expandedSubgrupo],
    queryFn: () => api.get(`/api/v1/vendas/drill/produtos?${qs}&subgrupo_id=${expandedSubgrupo}`),
    enabled: expandedSubgrupo !== null,
  });

  const t = resumo?.totais;
  const produtos = resumo?.por_produto ?? [];
  const visiveis = showArla ? produtos : produtos.filter((p) => p.grupo_descricao !== 'Arla 32');
  // Monta dados do gráfico de evolução por produto
  const evoData = (evolucao?.serie ?? []).map((row) => {
    const out: Record<string, unknown> = { label: row['periodo'] ?? row['label'] };
    visiveis.forEach((p) => {
      const raw = row[p.grupo_descricao] as number ?? 0;
      out[p.grupo_descricao] =
        metric === 'volume' ? raw : Math.round(raw * p.preco_medio_litro);
    });
    return out;
  });

  const legendItems = visiveis.map((p) => ({
    color: PRODUTO_CORES[p.grupo_descricao] ?? '#2563EB',
    label: p.grupo_descricao,
  }));

  const chartSeries = visiveis.map((p) => ({
    name: p.grupo_descricao,
    dataKey: p.grupo_descricao,
    color: PRODUTO_CORES[p.grupo_descricao] ?? '#2563EB',
  }));

  const formatY = metric === 'volume' ? (v: number) => fNum(v) + ' L' : fBRL;

  // Sparklines: série total de volume e receita bruta da evolução
  const serie = evolucao?.serie ?? [];
  // Soma todos os produtos visíveis por período para o sparkline de volume e receita
  const spVolume  = serie.map((row) =>
    visiveis.reduce((acc, p) => acc + ((row[p.grupo_descricao] as number) ?? 0), 0)
  );
  const spReceita = serie.map((row) =>
    visiveis.reduce((acc, p) => {
      const vol = (row[p.grupo_descricao] as number) ?? 0;
      return acc + Math.round(vol * p.preco_medio_litro);
    }, 0)
  );
  const spMargem = spReceita.map((rec, i) => {
    const cmvTotal = visiveis.reduce((acc, p) => {
      const vol = (serie[i]?.[p.grupo_descricao] as number) ?? 0;
      return acc + Math.round(vol * p.custo_medio_litro);
    }, 0);
    return rec > 0 ? ((rec - cmvTotal) / rec) * 100 : 0;
  });

  return (
    <div className="page-content">
      {/* Cabeçalho */}
      <div>
        <h1 style={{ fontSize: 'var(--text-heading)', fontWeight: 500, color: 'var(--color-text)', margin: '0 0 2px', letterSpacing: '-0.01em' }}>
          Combustível
        </h1>
        <p style={{ fontSize: 11, color: 'var(--color-text-muted)', margin: 0 }}>
          Volume, receita e margem por produto
        </p>
      </div>

      {/* KPIs */}
      <div className="kpi-row">
        <KpiCard label="Volume Total"  value={t?.volume_litros} format="litros" accent="#2563EB" sparklineData={spVolume}  sparklineColor="#2563EB" />
        <KpiCard label="Receita Bruta" value={t?.receita_bruta} sparklineData={spReceita} sparklineColor="#0073BB" />
        <KpiCard label="CMV"           value={t?.cmv} />
        <KpiCard label="Margem Bruta"  value={t?.margem_bruta}  sparklineData={spReceita} sparklineColor="#1D8102" />
        <KpiCard label="Margem %"      value={t?.margem_pct}    format="pct" sparklineData={spMargem} sparklineColor="#1D8102" />
      </div>

      {/* Evolução por produto — toggle linha / empilhado */}
      <SectionCard
        title="Evolução por Produto"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Toggle linha / empilhado */}
            <SegSwitcher
              options={[['line', 'Linha'], ['stacked', 'Empilhado']]}
              value={chartType}
              onChange={(v) => setChartType(v as ChartType)}
            />
            {/* Toggle volume / receita */}
            <SegSwitcher
              options={[['volume', 'Volume (L)'], ['receita', 'Receita']]}
              value={metric}
              onChange={(v) => setMetric(v as 'volume' | 'receita')}
            />
            {/* Arla 32 */}
            <button
              onClick={() => setShowArla((v) => !v)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                background: showArla ? 'var(--color-info-subtle)' : 'transparent',
                color: showArla ? 'var(--color-info)' : 'var(--color-text-muted)',
                fontFamily: 'inherit', fontSize: 11, cursor: 'pointer',
              }}
            >
              {showArla ? '✓ ' : '+ '}Arla 32
            </button>
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
              series={chartSeries.map((s) => ({ ...s, areaOpacity: 0.08 }))}
              height={220}
              formatY={formatY}
            />
          )}
          <ChartLegend items={legendItems} />
        </div>
      </SectionCard>

      {/* Breakdown por Subgrupo (Diesel / Gasolina) — com drill-down por produto */}
      <SectionCard title="Breakdown por Subgrupo" subtitle="Clique para expandir produtos individuais">
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 100px 80px 110px 90px 28px',
          gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
          background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
        }}>
          {['Subgrupo', 'Volume (L)', 'Part. %', 'Receita', 'Mg %', ''].map((h, i) => (
            <div key={i} style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i === 0 ? 'left' : i === 5 ? 'center' : 'right',
            }}>{h}</div>
          ))}
        </div>

        {(subgruposData?.subgrupos ?? []).map((sg, idx) => {
          const SUBGRUPO_CORES: Record<string, string> = {
            'Diseis': '#7C3AED', 'Gasolinas': '#2563EB', 'Etanol': '#16A34A',
          };
          const color = SUBGRUPO_CORES[sg.subgrupo_descricao] ?? '#0073BB';
          const exp = expandedSubgrupo === sg.subgrupo_id;
          const drill = exp ? (drillData?.produtos ?? []) : [];

          return (
            <div key={sg.subgrupo_id}>
              {/* Linha do subgrupo */}
              <button
                onClick={() => setExpandedSubgrupo(exp ? null : sg.subgrupo_id)}
                style={{
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 80px 110px 90px 28px',
                  gap: 12, padding: '0 var(--space-5)',
                  height: 'var(--table-row-height)', alignItems: 'center',
                  background: exp ? 'var(--color-bg-subtle)' : 'transparent',
                  border: 'none', borderBottom: '1px solid var(--color-border)',
                  cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                    {sg.subgrupo_descricao}
                  </span>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
                  {fNum(sg.volume_litros)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                  {fPct(sg.participacao_volume_pct)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                  {fBRL(sg.receita_bruta)}
                </div>
                <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                  {fPct(sg.margem_pct)}
                </div>
                <svg
                  width={13} height={13} fill="none"
                  stroke="var(--color-text-muted)" strokeWidth={2} viewBox="0 0 24 24"
                  style={{ transform: exp ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', justifySelf: 'center' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Drill-down: produtos do subgrupo */}
              {exp && (
                <div style={{ background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)' }}>
                  {/* Header drill */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '24px 1fr 100px 110px 90px',
                    gap: 12, padding: '0 var(--space-5) 0 40px', height: 28, alignItems: 'center',
                    borderBottom: '1px solid var(--color-border)',
                  }}>
                    {['', 'Produto', 'Vol (L)', 'Receita', 'Mg %'].map((h, i) => (
                      <div key={i} style={{
                        fontSize: 9, fontWeight: 600, color: 'var(--color-text-muted)',
                        textTransform: 'uppercase', letterSpacing: '0.05em',
                        textAlign: i <= 1 ? 'left' : 'right',
                      }}>{h}</div>
                    ))}
                  </div>
                  {drill.length === 0 ? (
                    <div style={{ padding: '10px 40px', fontSize: 12, color: 'var(--color-text-muted)' }}>
                      Carregando…
                    </div>
                  ) : (
                    drill.map((prod, pi) => (
                      <div
                        key={prod.source_produto_id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '24px 1fr 100px 110px 90px',
                          gap: 12, padding: '0 var(--space-5) 0 40px',
                          height: 'var(--table-row-height)', alignItems: 'center',
                          borderBottom: pi < drill.length - 1 ? '1px solid var(--color-border)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--color-text-subtle)' }}>
                          {pi + 1}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {prod.descricao_produto}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                          {fNum(prod.qtd_venda)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                          {fBRL(prod.receita_bruta)}
                        </div>
                        <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                          {fPct(prod.margem_pct)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Total */}
        {t && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 100px 80px 110px 90px 28px',
            gap: 12, padding: '0 var(--space-5)',
            height: 'var(--table-row-height)', alignItems: 'center',
            background: 'var(--color-bg-subtle)',
            borderTop: '2px solid var(--color-border)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total</div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fLitros(t.volume_litros)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>100%</div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
              {fBRL(t.receita_bruta)}
            </div>
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
              {fPct(t.margem_pct)}
            </div>
            <div />
          </div>
        )}
      </SectionCard>

      {/* Ranking de Bicos — Em breve */}
      <SectionCard title="Ranking de Bicos" subtitle="Volume e receita por bico de bomba">
        <div style={{
          margin: 'var(--space-4)',
          padding: '36px var(--space-5)',
          border: '1px dashed var(--color-border)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--color-bg-subtle)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: 'var(--color-warning)',
            background: 'var(--color-warning-subtle)', padding: '3px 8px',
            borderRadius: 100, letterSpacing: '.06em', textTransform: 'uppercase',
          }}>
            Em breve
          </span>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)' }}>
            Ranking por bico de bomba
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0, textAlign: 'center', maxWidth: 420, lineHeight: 1.5 }}>
            Volume vendido, receita e margem por bico (B01, B02…). Identifique bombas ociosas,
            picos e fluxo desbalanceado entre bicos do mesmo produto.
          </p>
          {/* Preview visual de bicos */}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {['B01','B02','B03','B04','B05','B06'].map((b) => (
              <div key={b} style={{
                width: 44, padding: '6px 0',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                textAlign: 'center',
                fontFamily: 'var(--font-mono)', fontSize: 10,
                color: 'var(--color-text-subtle)',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--color-text-muted)' }}>{b}</div>
                <div style={{ fontSize: 9, marginTop: 2, opacity: 0.6 }}>— L</div>
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ── Componentes internos ───────────────────────────────────────────────────

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
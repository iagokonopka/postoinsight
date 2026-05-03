import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { usePeriodo } from '@/hooks/use-periodo';
import { useLocationFilter } from '@/hooks/use-location-filter';
import { KpiCard } from '@/components/ui/KpiCard';
import { SectionCard } from '@/components/ui/SectionCard';
import { ChartLegend } from '@/components/ui/ChartLegend';
import { LineAreaChart } from '@/components/charts/LineAreaChart';
import { fBRL, fNum, fPct, fLitros } from '@/lib/formatters';

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

export function CombustivelPage() {
  const { range } = usePeriodo();
  const { locationParam } = useLocationFilter();
  const [showArla, setShowArla] = useState(false);
  const [metric, setMetric] = useState<'volume' | 'receita'>('volume');

  const qs = buildParams(range, locationParam);

  const { data: resumo } = useQuery<CombustivelResumo>({
    queryKey: ['combustivel-resumo', qs],
    queryFn: () => api.get(`/api/v1/combustivel/resumo?${qs}`),
  });

  const { data: evolucao } = useQuery<CombustivelEvolucao>({
    queryKey: ['combustivel-evolucao', qs],
    queryFn: () => api.get(`/api/v1/combustivel/evolucao?${qs}&granularidade=dia`),
  });

  const t = resumo?.totais;
  const produtos = resumo?.por_produto ?? [];
  const visiveis = showArla ? produtos : produtos.filter((p) => p.grupo_descricao !== 'Arla 32');
  const maxVol = Math.max(...produtos.map((p) => p.volume_litros), 1);

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
        <KpiCard label="Volume Total"  value={t?.volume_litros} format="litros" accent="#2563EB" />
        <KpiCard label="Receita Bruta" value={t?.receita_bruta} />
        <KpiCard label="CMV"           value={t?.cmv} />
        <KpiCard label="Margem Bruta"  value={t?.margem_bruta} />
        <KpiCard label="Margem %"      value={t?.margem_pct}   format="pct" />
      </div>

      {/* Evolução por produto */}
      <SectionCard
        title="Evolução por Produto"
        action={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Toggle volume / receita */}
            <div style={{ display: 'flex', background: 'var(--color-bg-muted)', borderRadius: 'var(--radius-sm)', padding: 2, gap: 2 }}>
              {([['volume', 'Volume (L)'], ['receita', 'Receita']] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setMetric(id)}
                  style={{
                    padding: '3px 9px', borderRadius: 4, border: 'none', cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: 11,
                    background: metric === id ? 'var(--color-bg)' : 'transparent',
                    color: metric === id ? 'var(--color-text)' : 'var(--color-text-muted)',
                    fontWeight: metric === id ? 600 : 400,
                    boxShadow: metric === id ? 'var(--shadow-xs)' : 'none',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Toggle Arla 32 */}
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
          <LineAreaChart
            data={evoData}
            xKey="label"
            series={visiveis.map((p) => ({
              name: p.grupo_descricao,
              dataKey: p.grupo_descricao,
              color: PRODUTO_CORES[p.grupo_descricao] ?? '#2563EB',
            }))}
            height={220}
            formatY={metric === 'volume' ? (v) => fNum(v) + ' L' : fBRL}
          />
          <ChartLegend
            items={visiveis.map((p) => ({
              color: PRODUTO_CORES[p.grupo_descricao] ?? '#2563EB',
              label: p.grupo_descricao,
            }))}
          />
        </div>
      </SectionCard>

      {/* Breakdown por produto — tabela */}
      <SectionCard title="Breakdown por Produto">
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px',
          gap: 12, padding: '0 var(--space-5)', height: 36, alignItems: 'center',
          background: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)',
        }}>
          {['Produto', 'Volume (L)', 'Part. %', 'Receita', 'CMV', 'Mg %', 'R$/L', 'Cst/L'].map((h, i) => (
            <div key={h} style={{
              fontSize: 10, fontWeight: 600, color: 'var(--color-text-muted)',
              textTransform: 'uppercase', letterSpacing: '0.05em',
              textAlign: i > 0 ? 'right' : 'left',
            }}>{h}</div>
          ))}
        </div>

        {/* Linhas */}
        {produtos.map((p, idx) => {
          const color = PRODUTO_CORES[p.grupo_descricao] ?? '#2563EB';
          return (
            <div
              key={p.grupo_descricao}
              style={{
                display: 'grid',
                gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px',
                gap: 12, padding: '0 var(--space-5)',
                height: 'var(--table-row-height)', alignItems: 'center',
                borderBottom: idx < produtos.length - 1 ? '1px solid var(--color-border)' : 'none',
              }}
            >
              {/* Produto */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text)' }}>
                  {p.grupo_descricao}
                </span>
              </div>
              {/* Volume com mini-bar */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
                  {fNum(p.volume_litros)}
                </div>
                <div style={{ height: 3, background: 'var(--color-bg-muted)', borderRadius: 2, marginTop: 3 }}>
                  <div style={{ height: '100%', width: `${(p.volume_litros / maxVol) * 100}%`, background: color, borderRadius: 2 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                {fPct(p.participacao_volume_pct)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                {fBRL(p.receita_bruta)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                {fBRL(p.cmv)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                {fPct(p.margem_pct)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text)' }}>
                R$&nbsp;{p.preco_medio_litro.toFixed(2)}
              </div>
              <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
                R$&nbsp;{p.custo_medio_litro.toFixed(2)}
              </div>
            </div>
          );
        })}

        {/* Linha de total */}
        {t && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '150px 100px 70px 110px 110px 90px 78px 78px',
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
            <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)' }}>
              {fBRL(t.cmv)}
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
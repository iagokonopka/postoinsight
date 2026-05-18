/**
 * CombustivelPage — /combustivel
 * Spec: FRONTEND_SPEC.md secao 6
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { api, buildQuery } from '@/lib/api';
import { fBRL, fPct, fLitros, fNum } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/kpi/KpiCard';
import { SectionCard } from '@/components/kpi/SectionCard';
import { EChart } from '@/components/charts/EChart';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import type { EChartsOption } from 'echarts';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface CombustivelResumo {
  totais: {
    volume_litros: number;
    receita_bruta: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
  };
  por_produto: Array<{
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
  }>;
}

interface EvolucaoPorProduto {
  por_produto: true;
  produtos: Array<{
    grupo_id: number;
    grupo_descricao: string;
    serie: Array<{ periodo: string; volume_litros: number; receita_bruta: number }>;
  }>;
}

// Cores sequenciais para os produtos combustivel
const PRODUTO_COLORS = ['#0073BB', '#EC7211', '#6B40C4', '#1D8102', '#0d9488', '#e11d48'];

type MetricaToggle = 'volume' | 'receita';
type ChartToggle = 'linha' | 'area';

export function CombustivelPage() {
  const { resolveDates, locationId } = useFilters();
  const { data_inicio, data_fim } = resolveDates();
  const locParam = locationId !== 'all' ? locationId : undefined;

  const [metrica, setMetrica] = useState<MetricaToggle>('volume');
  const [chartType, setChartType] = useState<ChartToggle>('linha');

  const baseQuery = buildQuery({ data_inicio, data_fim, location_id: locParam });
  const qKey = [data_inicio, data_fim, locParam];

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['combustivel-resumo', ...qKey],
    queryFn: () => api.get<CombustivelResumo>('/api/v1/combustivel/resumo' + baseQuery),
  });

  const { data: evolucao, isLoading: loadingEvolucao } = useQuery({
    queryKey: ['combustivel-evolucao', ...qKey],
    queryFn: () => api.get<EvolucaoPorProduto>(
      '/api/v1/combustivel/evolucao' + buildQuery({
        data_inicio, data_fim, location_id: locParam, por_produto: true,
      }),
    ),
  });

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const t = resumo?.totais;
  const sparkline = resumo?.por_produto.map(p => p.volume_litros) ?? [];
  const precoMedio = t && t.volume_litros > 0 ? t.receita_bruta / t.volume_litros : 0;

  // ── Grafico evolucao multi-serie ─────────────────────────────────────────────
  const evolucaoOption = useMemo<EChartsOption>(() => {
    const produtos = evolucao?.produtos ?? [];
    // Coletar todos os periodos unicos (eixo X)
    const periodosSet = new Set<string>();
    produtos.forEach(p => p.serie.forEach(s => periodosSet.add(s.periodo)));
    const periodos = Array.from(periodosSet).sort();

    return {
      grid: { top: 8, right: 8, bottom: 48, left: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: periodos.map(p => p.slice(5)),
        axisLabel: { fontSize: 11 },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: metrica === 'volume'
            ? (v: number) => (v / 1000).toFixed(0) + 'kL'
            : (v: number) => 'R$' + (v / 1000).toFixed(0) + 'k',
          fontSize: 11,
        },
      },
      series: produtos.map((produto, idx) => {
        const mapaValores = new Map(produto.serie.map(s => [s.periodo, metrica === 'volume' ? s.volume_litros : s.receita_bruta]));
        return {
          name: produto.grupo_descricao,
          type: 'line' as const,
          data: periodos.map(p => mapaValores.get(p) ?? 0),
          lineStyle: { color: PRODUTO_COLORS[idx % PRODUTO_COLORS.length], width: 2 },
          itemStyle: { color: PRODUTO_COLORS[idx % PRODUTO_COLORS.length] },
          symbol: 'none',
          areaStyle: chartType === 'area' ? { opacity: 0.12 } : undefined,
        };
      }),
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, type: 'scroll' },
    };
  }, [evolucao, metrica, chartType]);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      <PageHeader title="Combustível" subtitle="Volumes, receitas e margens por produto." />

      <div className="flex flex-col gap-6">
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard label="Volume Total"   value={fLitros(t?.volume_litros ?? 0)} sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="Receita Bruta"  value={fBRL(t?.receita_bruta ?? 0)}    sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="Margem Bruta %" value={fPct(t?.margem_pct ?? 0)}       sparkline={sparkline} sparklineColor="#EC7211" loading={loadingResumo} />
          <KpiCard label="Preco Medio/L"  value={fBRL(precoMedio)}               sparkline={sparkline} loading={loadingResumo} />
        </div>

        {/* Grafico de evolucao */}
        <SectionCard
          title="Evolucao por Produto"
          action={
            <div className="flex items-center gap-2">
              <Tabs value={chartType} onValueChange={v => setChartType(v as ChartToggle)}>
                <TabsList className="h-7">
                  <TabsTrigger value="linha" className="text-xs px-2">Linha</TabsTrigger>
                  <TabsTrigger value="area" className="text-xs px-2">Area</TabsTrigger>
                </TabsList>
              </Tabs>
              <Tabs value={metrica} onValueChange={v => setMetrica(v as MetricaToggle)}>
                <TabsList className="h-7">
                  <TabsTrigger value="volume" className="text-xs px-2">Volume</TabsTrigger>
                  <TabsTrigger value="receita" className="text-xs px-2">Receita</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          }
        >
          <EChart option={evolucaoOption} height={300} loading={loadingEvolucao} />
        </SectionCard>

        {/* Tabela de breakdown por produto */}
        <SectionCard title="Breakdown por Produto" noPadding>
          {loadingResumo ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Volume (L)</TableHead>
                  <TableHead className="text-right">Part. Vol %</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">CMV</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                  <TableHead className="text-right">Preco/L</TableHead>
                  <TableHead className="text-right">Custo/L</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(resumo?.por_produto ?? []).map((p, idx) => (
                  <TableRow key={p.grupo_id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: PRODUTO_COLORS[idx % PRODUTO_COLORS.length] }}
                        />
                        <span className="font-medium">{p.grupo_descricao ?? 'Produto ' + p.grupo_id}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{fNum(p.volume_litros, 1)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fPct(p.participacao_volume_pct)}</TableCell>
                    <TableCell className="text-right">{fBRL(p.receita_bruta)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fBRL(p.cmv)}</TableCell>
                    <TableCell className={'text-right font-medium ' + (p.margem_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {fPct(p.margem_pct)}
                    </TableCell>
                    <TableCell className="text-right">{p.preco_medio_litro != null ? fBRL(p.preco_medio_litro) : '-'}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{p.custo_medio_litro != null ? fBRL(p.custo_medio_litro) : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

/**
 * DashboardPage — /dashboard
 * Spec: FRONTEND_SPEC.md secao 5
 */
import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { api, buildQuery } from '@/lib/api';
import { fBRL, fPct, fNum } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/kpi/KpiCard';
import { SectionCard } from '@/components/kpi/SectionCard';
import { EChart } from '@/components/charts/EChart';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { EChartsOption, ECElementEvent } from 'echarts';

interface Resumo {
  totais: {
    receita_bruta: number;
    descontos: number;
    receita_liquida: number;
    cmv: number;
    margem_bruta: number;
    margem_pct: number;
    qtd_itens: number;
  };
  por_segmento: Array<{
    segmento: string;
    receita_bruta: number;
    margem_pct: number;
    participacao_pct: number;
  }>;
}

interface EvolucaoItem { periodo: string; receita_bruta: number; margem_pct: number; }
interface Evolucao { serie: EvolucaoItem[] }

interface TopProduto {
  rank: number;
  produto: string;
  categoria: string;
  receita: number;
  margem_pct: number;
  participacao_pct: number;
}
interface TopProdutos { produtos: TopProduto[] }

const SEG_COLORS: Record<string, string> = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  servicos:      '#0d9488',
};
const SEG_LABELS: Record<string, string> = {
  combustivel:   'Combustivel',
  conveniencia:  'Conveniencia',
  lubrificantes: 'Lubrificantes',
  servicos:      'Servicos',
};

export function DashboardPage() {
  const { resolveDates, locationId } = useFilters();
  const { data_inicio, data_fim } = resolveDates();
  const locParam = locationId !== 'all' ? locationId : undefined;
  const [segmentoAtivo, setSegmentoAtivo] = useState<string | null>(null);

  const baseQuery = buildQuery({ data_inicio, data_fim, location_id: locParam });
  const qKey = [data_inicio, data_fim, locParam];

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['dashboard-resumo', ...qKey],
    queryFn: () => api.get<Resumo>('/api/v1/vendas/resumo' + baseQuery),
  });

  const { data: evolucao, isLoading: loadingEvolucao } = useQuery({
    queryKey: ['dashboard-evolucao', ...qKey],
    queryFn: () => api.get<Evolucao>('/api/v1/vendas/evolucao' + baseQuery),
  });

  const { data: topProdutos, isLoading: loadingTop } = useQuery({
    queryKey: ['dashboard-top', ...qKey, segmentoAtivo],
    queryFn: () => api.get<TopProdutos>(
      '/api/v1/vendas/top-produtos' + buildQuery({
        data_inicio,
        data_fim,
        location_id: locParam,
        segmento: segmentoAtivo ?? undefined,
        limit: 10,
      }),
    ),
  });

  const t = resumo?.totais;
  const ticketMedio = t && t.qtd_itens > 0 ? t.receita_bruta / t.qtd_itens : 0;
  const cmvPct = t && t.receita_bruta > 0 ? (t.cmv / t.receita_bruta) * 100 : 0;
  const sparkline = evolucao?.serie.map(s => s.receita_bruta) ?? [];

  const dualAxisOption = useMemo<EChartsOption>(() => {
    const serie = evolucao?.serie ?? [];
    return {
      grid: { top: 8, right: 52, bottom: 24, left: 0, containLabel: true },
      xAxis: {
        type: 'category',
        data: serie.map(s => s.periodo.slice(5)),
        axisLabel: { fontSize: 11 },
      },
      yAxis: [
        {
          type: 'value',
          axisLabel: { formatter: (v: number) => (v / 1000).toFixed(0) + 'k', fontSize: 11 },
        },
        {
          type: 'value',
          axisLabel: { formatter: (v: number) => v.toFixed(1) + '%', fontSize: 11 },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'Receita Bruta',
          type: 'bar',
          data: serie.map(s => s.receita_bruta),
          itemStyle: { color: '#0073BB', borderRadius: [4, 4, 0, 0] },
          barMaxWidth: 32,
        },
        {
          name: 'Margem %',
          type: 'line',
          yAxisIndex: 1,
          data: serie.map(s => s.margem_pct),
          lineStyle: { color: '#EC7211', width: 2 },
          itemStyle: { color: '#EC7211' },
          symbol: 'none',
        },
      ],
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Receita Bruta', 'Margem %'] },
    };
  }, [evolucao]);

  const donutOption = useMemo<EChartsOption>(() => {
    const segs = resumo?.por_segmento ?? [];
    return {
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        data: segs.map(s => ({
          name: SEG_LABELS[s.segmento] ?? s.segmento,
          value: s.receita_bruta,
          itemStyle: { color: SEG_COLORS[s.segmento] ?? '#94a3b8' },
          selected: segmentoAtivo === s.segmento,
        })),
        selectedOffset: 8,
        selectedMode: 'single',
        label: { formatter: '{b}: {d}%', fontSize: 11 },
      }],
      tooltip: {
        formatter: (p: any) =>
          p.name + '<br/>R$ ' + fNum(p.value) + ' (' + (p.percent as number).toFixed(1) + '%)',
      },
    };
  }, [resumo, segmentoAtivo]);

  const handleDonutClick = useCallback((params: ECElementEvent) => {
    const nome = params.name as string;
    const seg = Object.entries(SEG_LABELS).find(([, v]) => v === nome)?.[0] ?? null;
    setSegmentoAtivo(prev => prev === seg ? null : seg);
  }, []);

  return (
    <div className="flex flex-col">
      <PageHeader title="Dashboard" subtitle="Consolidado da rede — vendas, margens e padrão de demanda." />

      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-5 gap-4">
          <KpiCard label="Receita Bruta"  value={fBRL(t?.receita_bruta ?? 0)} sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="Margem Bruta %" value={fPct(t?.margem_pct ?? 0)}    sparkline={sparkline} sparklineColor="#EC7211" loading={loadingResumo} />
          <KpiCard label="Itens Vendidos" value={fNum(t?.qtd_itens ?? 0)}     sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="Ticket Medio"   value={fBRL(ticketMedio)}            sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="CMV %"          value={fPct(cmvPct)}                 sparkline={sparkline} sparklineColor="#6B40C4" loading={loadingResumo} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SectionCard title="Evolucao de Receita e Margem" className="col-span-2">
            <EChart option={dualAxisOption} height={320} loading={loadingEvolucao} />
          </SectionCard>

          <SectionCard
            title="Mix por Segmento"
            action={segmentoAtivo ? (
              <button
                onClick={() => setSegmentoAtivo(null)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                {(SEG_LABELS[segmentoAtivo] ?? segmentoAtivo) + ' x'}
              </button>
            ) : undefined}
          >
            <EChart option={donutOption} height={280} onChartClick={handleDonutClick} />
          </SectionCard>
        </div>

        <SectionCard
          title={segmentoAtivo ? 'Top produtos - ' + (SEG_LABELS[segmentoAtivo] ?? segmentoAtivo) : 'Top produtos'}
          action={segmentoAtivo ? (
            <Badge variant="outline" className="cursor-pointer text-xs" onClick={() => setSegmentoAtivo(null)}>
              {(SEG_LABELS[segmentoAtivo] ?? segmentoAtivo) + ' x'}
            </Badge>
          ) : undefined}
          noPadding
        >
          {loadingTop ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-right">Receita</TableHead>
                  <TableHead className="text-right">Part. %</TableHead>
                  <TableHead className="text-right">Margem %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(topProdutos?.produtos ?? []).map(p => (
                  <TableRow key={p.rank}>
                    <TableCell className="text-muted-foreground">{p.rank}</TableCell>
                    <TableCell className="font-medium">{p.produto}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1.5">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: SEG_COLORS[p.categoria] ?? '#94a3b8' }} />
                        {SEG_LABELS[p.categoria] ?? p.categoria}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{fBRL(p.receita)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{fPct(p.participacao_pct)}</TableCell>
                    <TableCell className={'text-right font-medium ' + (p.margem_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                      {fPct(p.margem_pct)}
                    </TableCell>
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

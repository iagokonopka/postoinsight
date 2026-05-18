/**
 * ConvenienciaPage — /conveniencia
 * Spec: FRONTEND_SPEC.md secao 7
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
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { EChartsOption, ECElementEvent } from 'echarts';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ConvResumo {
  totais: {
    receita_bruta: number;
    margem_pct: number;
    qtd_itens: number;
    ticket_medio: number | null;
  };
}

interface EvolucaoItem { periodo: string; receita_bruta: number; margem_bruta: number; }
interface Evolucao { serie: EvolucaoItem[] }

interface Categoria {
  categoria_codigo: string;
  categoria_descricao: string | null;
  receita_bruta: number;
  cmv: number;
  margem_pct: number;
  participacao_pct: number;
  qtd_total: number;
}
interface Categorias { categorias: Categoria[] }

interface TopGrupo {
  rank: number;
  grupo_id: number;
  grupo_descricao: string;
  receita_bruta: number;
  margem_pct: number;
  participacao_pct: number;
  qtd_itens: number;
  categorias: Array<{
    categoria_codigo: string;
    categoria_descricao: string | null;
    receita_bruta: number;
    margem_pct: number;
    qtd_itens: number;
  }>;
}
interface TopGrupos { grupos: TopGrupo[] }

// ── Componente ───────────────────────────────────────────────────────────────

export function ConvenienciaPage() {
  const { resolveDates, locationId } = useFilters();
  const { data_inicio, data_fim } = resolveDates();
  const locParam = locationId !== 'all' ? locationId : undefined;
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);

  const baseQuery = buildQuery({ data_inicio, data_fim, location_id: locParam });
  const qKey = [data_inicio, data_fim, locParam];

  const { data: resumo, isLoading: loadingResumo } = useQuery({
    queryKey: ['conv-resumo', ...qKey],
    queryFn: () => api.get<ConvResumo>('/api/v1/conveniencia/resumo' + baseQuery),
  });

  const { data: evolucao, isLoading: loadingEvolucao } = useQuery({
    queryKey: ['conv-evolucao', ...qKey],
    queryFn: () => api.get<Evolucao>('/api/v1/conveniencia/evolucao' + baseQuery),
  });

  const { data: categorias, isLoading: loadingCat } = useQuery({
    queryKey: ['conv-categorias', ...qKey],
    queryFn: () => api.get<Categorias>('/api/v1/conveniencia/categorias' + buildQuery({
      data_inicio, data_fim, location_id: locParam, segmento: 'conveniencia',
    })),
  });

  const { data: topGrupos, isLoading: loadingGrupos } = useQuery({
    queryKey: ['conv-top-grupos', ...qKey],
    queryFn: () => api.get<TopGrupos>('/api/v1/conveniencia/top-grupos' + baseQuery),
  });

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const t = resumo?.totais;
  const sparkline = evolucao?.serie.map(s => s.receita_bruta) ?? [];

  // ── Area empilhada ────────────────────────────────────────────────────────────
  const areaOption = useMemo<EChartsOption>(() => {
    const serie = evolucao?.serie ?? [];
    return {
      grid: { top: 8, right: 8, bottom: 0, left: 0, containLabel: true },
      xAxis: { type: 'category', data: serie.map(s => s.periodo.slice(5)), axisLabel: { fontSize: 11 } },
      yAxis: [
        { type: 'value', axisLabel: { formatter: (v: number) => (v / 1000).toFixed(0) + 'k', fontSize: 11 } },
        { type: 'value', axisLabel: { formatter: (v: number) => v.toFixed(1) + '%', fontSize: 11 }, splitLine: { show: false } },
      ],
      series: [
        {
          name: 'Receita',
          type: 'line',
          data: serie.map(s => s.receita_bruta),
          areaStyle: { color: '#EC7211', opacity: 0.15 },
          lineStyle: { color: '#EC7211', width: 2 },
          itemStyle: { color: '#EC7211' },
          symbol: 'none',
        },
        {
          name: 'Margem',
          type: 'line',
          yAxisIndex: 1,
          data: serie.map(s => s.margem_bruta),
          lineStyle: { color: '#6B40C4', width: 2 },
          itemStyle: { color: '#6B40C4' },
          symbol: 'none',
        },
      ],
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, data: ['Receita', 'Margem'] },
    };
  }, [evolucao]);

  // ── Scatter cross-filter ────────────────────────────────────────────────────
  const scatterOption = useMemo<EChartsOption>(() => {
    const cats = categorias?.categorias ?? [];
    const maxReceita = Math.max(...cats.map(c => c.receita_bruta), 1);
    const medianaX = cats.length > 0
      ? [...cats].sort((a, b) => a.qtd_total - b.qtd_total)[Math.floor(cats.length / 2)]?.qtd_total ?? 0
      : 0;
    const medianaY = cats.length > 0
      ? [...cats].sort((a, b) => a.margem_pct - b.margem_pct)[Math.floor(cats.length / 2)]?.margem_pct ?? 0
      : 0;

    return {
      grid: { top: 16, right: 16, bottom: 0, left: 0, containLabel: true },
      xAxis: { type: 'value', name: 'Qtd', axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', name: 'Margem %', axisLabel: { formatter: (v: number) => v.toFixed(0) + '%', fontSize: 11 } },
      series: [{
        type: 'scatter',
        data: cats.map(c => ({
          name: c.categoria_descricao ?? c.categoria_codigo,
          value: [c.qtd_total, c.margem_pct, c.receita_bruta, c.categoria_codigo],
          symbolSize: Math.max(8, Math.sqrt(c.receita_bruta / maxReceita) * 40),
          itemStyle: {
            color: categoriaAtiva === c.categoria_codigo ? '#0073BB' : '#EC7211',
            opacity: categoriaAtiva && categoriaAtiva !== c.categoria_codigo ? 0.3 : 0.8,
            borderColor: categoriaAtiva === c.categoria_codigo ? '#004a78' : 'transparent',
            borderWidth: categoriaAtiva === c.categoria_codigo ? 2 : 0,
          },
        })),
        markLine: {
          silent: true,
          lineStyle: { color: '#94a3b8', type: 'dashed', width: 1 },
          data: [{ xAxis: medianaX }, { yAxis: medianaY }],
        },
      }],
      tooltip: {
        formatter: (p: any) => {
          const [qtd, margem, receita] = p.value as number[];
          return p.name + '<br/>Qtd: ' + fNum(qtd) + '<br/>Margem: ' + fPct(margem) + '<br/>Receita: ' + fBRL(receita);
        },
      },
    };
  }, [categorias, categoriaAtiva]);

  const handleScatterClick = useCallback((params: ECElementEvent) => {
    const codigo = (params.value as any[])[3] as string;
    setCategoriaAtiva(prev => prev === codigo ? null : codigo);
  }, []);

  // Categorias exibidas na tabela (filtradas pelo scatter se houver seleção)
  const categoriasFiltradas = categoriaAtiva
    ? (categorias?.categorias ?? []).filter(c => c.categoria_codigo === categoriaAtiva)
    : (categorias?.categorias ?? []);

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col">
      <PageHeader title="Conveniência & Serviços" subtitle="Loja, lubrificantes e serviços — período selecionado." />

      <div className="flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Receita Bruta"  value={fBRL(t?.receita_bruta ?? 0)} sparkline={sparkline} loading={loadingResumo} />
          <KpiCard label="Margem Bruta %" value={fPct(t?.margem_pct ?? 0)}    sparkline={sparkline} sparklineColor="#EC7211" loading={loadingResumo} />
          <KpiCard label="Ticket Medio"   value={fBRL(t?.ticket_medio ?? 0)}  sparkline={sparkline} loading={loadingResumo} />
        </div>

        {/* Area + Top Grupos */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Evolucao Receita e Margem">
            <EChart option={areaOption} height={260} loading={loadingEvolucao} />
          </SectionCard>

          <SectionCard title="Top 10 Grupos" noPadding>
            {loadingGrupos ? (
              <div className="flex flex-col gap-1 p-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : (
              <Accordion type="multiple" className="px-0">
                {(topGrupos?.grupos ?? []).map(g => (
                  <AccordionItem key={g.grupo_id} value={String(g.grupo_id)} className="border-b border-border last:border-0">
                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                      <div className="flex w-full items-center gap-3 text-left">
                        <span className="flex-1 text-sm font-medium">{g.grupo_descricao}</span>
                        <span className="text-sm text-muted-foreground">{fBRL(g.receita_bruta)}</span>
                        <span className={'text-sm font-medium ' + (g.margem_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {fPct(g.margem_pct)}
                        </span>
                        <Badge variant="outline" className="text-xs">{fPct(g.participacao_pct)}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-0">
                      {g.categorias.map(c => (
                        <div key={c.categoria_codigo} className="flex items-center gap-3 border-t border-border px-8 py-2 text-sm">
                          <span className="flex-1 text-muted-foreground">{c.categoria_descricao ?? c.categoria_codigo}</span>
                          <span>{fBRL(c.receita_bruta)}</span>
                          <span className={'font-medium ' + (c.margem_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                            {fPct(c.margem_pct)}
                          </span>
                          <span className="text-muted-foreground">{fNum(c.qtd_itens)}</span>
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </SectionCard>
        </div>

        {/* Scatter + Tabela */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Categorias — Qtd x Margem">
            <EChart option={scatterOption} height={300} loading={loadingCat} onChartClick={handleScatterClick} />
          </SectionCard>

          <SectionCard
            title={categoriaAtiva ? 'Categoria: ' + (categorias?.categorias.find(c => c.categoria_codigo === categoriaAtiva)?.categoria_descricao ?? categoriaAtiva) : 'Todas as categorias'}
            action={categoriaAtiva ? (
              <button onClick={() => setCategoriaAtiva(null)} className="text-xs text-muted-foreground hover:text-foreground">
                Limpar filtro x
              </button>
            ) : undefined}
            noPadding
          >
            {loadingCat ? (
              <div className="flex flex-col gap-2 p-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Receita</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">Margem %</TableHead>
                    <TableHead className="text-right">Part. %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasFiltradas.map(c => (
                    <TableRow
                      key={c.categoria_codigo}
                      className="cursor-pointer"
                      onClick={() => setCategoriaAtiva(prev => prev === c.categoria_codigo ? null : c.categoria_codigo)}
                    >
                      <TableCell className="font-medium">{c.categoria_descricao ?? c.categoria_codigo}</TableCell>
                      <TableCell className="text-right">{fBRL(c.receita_bruta)}</TableCell>
                      <TableCell className="text-right">{fNum(c.qtd_total)}</TableCell>
                      <TableCell className={'text-right font-medium ' + (c.margem_pct >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {fPct(c.margem_pct)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{fPct(c.participacao_pct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

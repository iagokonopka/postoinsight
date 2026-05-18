/**
 * Dashboard — Visão Geral de Vendas (/dashboard)
 * Fase 9: KPI Row + Gráfico Dual-axis + Donut + Top Produtos
 */
import { useState } from 'react';
import { Package } from 'lucide-react';

import { PageHeader } from '@/components/layout/PageHeader';
import { SectionCard } from '@/components/ui/SectionCard';
import { KpiCard } from '@/components/ui/KpiCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { KpiSkeleton, ChartSkeleton, TableSkeleton } from '@/components/ui/SkeletonLoader';
import { DataTable, RankCell, ProgressCell } from '@/components/ui/DataTable';
import type { Column } from '@/components/ui/DataTable';
import { ComposedChart } from '@/components/charts/ComposedChart';
import { DonutChart } from '@/components/charts/DonutChart';
import type { DonutSlice } from '@/components/charts/DonutChart';
import { DeltaTag } from '@/components/ui/DeltaTag';

import { usePeriod } from '@/hooks/usePeriod';
import { useLocationFilter } from '@/hooks/useLocationFilter';
import { CHART_COLORS } from '@/lib/chart-theme';
import { fmtBRL, fmtBRLk, fmtLitros, fmtPct } from '@/lib/formatters';

import {
  useVendasResumo,
  useVendasEvolucao,
  useVendasSegmentos,
  useVendasTopProdutos,
  type VendasTopProduto,
} from './hooks';

// ── Segment display names ──────────────────────────────────────────────────────

const SEGMENT_NAMES: Record<string, string> = {
  combustivel: 'Combustível',
  conveniencia: 'Conveniência',
  lubrificantes: 'Lubrificantes',
  arla: 'Arla 32',
};

const SEGMENT_COLORS: Record<string, string> = {
  combustivel: CHART_COLORS.combustivel,
  conveniencia: CHART_COLORS.conveniencia,
  lubrificantes: CHART_COLORS.lubrificantes,
  arla: CHART_COLORS.arla,
};

// ── Loading skeleton ───────────────────────────────────────────────────────────

function DashboardSkeleton() {
  return (
    <div className="px-5 pb-5 flex flex-col gap-4">
      {/* KPI row */}
      <div className="grid gap-[14px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <KpiSkeleton key={i} />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr]">
        <ChartSkeleton height={320} />
        <ChartSkeleton height={320} />
      </div>
      {/* Table */}
      <TableSkeleton rows={10} cols={5} />
    </div>
  );
}

// ── Top Produtos columns ───────────────────────────────────────────────────────

function buildColumns(total: number): Column<VendasTopProduto>[] {
  return [
    {
      key: 'rank',
      header: '#',
      className: 'w-8',
      render: (_row, index) => <RankCell rank={index + 1} />,
    },
    {
      key: 'grupo',
      header: 'Produto',
      render: (row) => (
        <span className="text-sm text-foreground font-medium">{row.grupo}</span>
      ),
    },
    {
      key: 'receita_bruta',
      header: 'Receita',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-right font-mono text-sm">
          {fmtBRL(row.receita_bruta)}
        </span>
      ),
    },
    {
      key: 'participacao_pct',
      header: 'Participação',
      className: 'min-w-[140px]',
      render: (row) => <ProgressCell pct={row.participacao_pct} />,
    },
    {
      key: 'margem_pct',
      header: 'Margem %',
      align: 'right',
      render: (row) => (
        <span className="tabular-nums text-right text-sm">
          <DeltaTag value={row.margem_pct} compact />
        </span>
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { dateRange } = usePeriod('this_month');
  const { locationId } = useLocationFilter();
  const filters = { dateRange, locationId };

  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  const resumoQ = useVendasResumo(filters);
  const evolucaoQ = useVendasEvolucao(filters);
  const segmentosQ = useVendasSegmentos(filters);
  const topProdutosQ = useVendasTopProdutos(filters, selectedSegment ?? undefined);

  const isLoading =
    resumoQ.isLoading || evolucaoQ.isLoading || segmentosQ.isLoading;

  if (isLoading) {
    return (
      <>
        <PageHeader title="Visão Geral" />
        <DashboardSkeleton />
      </>
    );
  }

  const resumo = resumoQ.data;
  const evolucao = evolucaoQ.data;
  const segmentos = segmentosQ.data ?? [];
  const topProdutos = topProdutosQ.data ?? [];

  // Sparkline data from evolucao.dia (last 30 points)
  const sparklineSeries = evolucao?.dia ?? [];
  const sparklineReceita = sparklineSeries.map((p) => p.receita_bruta);
  const sparklineMargem = sparklineSeries.map((p) => p.margem_pct);
  const sparklineVolume = sparklineSeries.map((p) => p.volume_combustivel);
  const sparklineTicket = sparklineSeries.map((p) =>
    p.receita_bruta > 0 ? p.receita_bruta : 0
  );
  const sparklineCmv = sparklineSeries.map((p) => p.margem_pct);

  // Composed chart data
  const chartData = sparklineSeries.map((p) => ({
    label: p.label,
    receita_bruta: p.receita_bruta,
    margem_pct: p.margem_pct,
  }));

  // Donut slices from segmentos
  const donutData: DonutSlice[] = segmentos.map((s) => ({
    name: SEGMENT_NAMES[s.segmento] ?? s.segmento,
    value: s.receita_bruta,
    color: SEGMENT_COLORS[s.segmento] ?? CHART_COLORS.servicos,
  }));

  const totalReceita = segmentos.reduce((sum, s) => sum + s.receita_bruta, 0);

  // Toggle segment filter on donut click
  function handleSliceClick(slice: DonutSlice) {
    const key = Object.entries(SEGMENT_NAMES).find(([, v]) => v === slice.name)?.[0] ?? null;
    setSelectedSegment((prev) => (prev === key ? null : key));
  }

  // Active slice name for donut highlight
  const activeSliceName = selectedSegment ? (SEGMENT_NAMES[selectedSegment] ?? null) : null;

  // Top produtos columns
  const columns = buildColumns(totalReceita);

  return (
    <>
      <PageHeader title="Visão Geral" subtitle="Desempenho consolidado de vendas no período" />

      <div className="px-5 pb-5 flex flex-col gap-4">
        {/* ── KPI Row ── */}
        <div className="grid gap-[14px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard
            label="Receita Bruta"
            value={resumo ? fmtBRL(resumo.receita_bruta) : '—'}
            delta={resumo?.delta_receita_bruta ?? undefined}
            deltaLabel="vs período ant."
            sparklineData={sparklineReceita}
            sparklineColor={CHART_COLORS.combustivel}
          />
          <KpiCard
            label="Margem Bruta %"
            value={resumo ? fmtPct(resumo.margem_pct) : '—'}
            delta={resumo?.delta_margem_pct ?? undefined}
            deltaLabel="vs período ant."
            sparklineData={sparklineMargem}
            sparklineColor={CHART_COLORS.combustivel}
          />
          <KpiCard
            label="Volume Combustível"
            value={resumo ? fmtLitros(resumo.volume_combustivel) : '—'}
            delta={resumo?.delta_volume_combustivel ?? undefined}
            deltaLabel="vs período ant."
            sparklineData={sparklineVolume}
            sparklineColor={CHART_COLORS.combustivel}
          />
          <KpiCard
            label="Ticket Médio"
            value={resumo ? fmtBRL(resumo.ticket_medio) : '—'}
            delta={resumo?.delta_ticket_medio ?? undefined}
            deltaLabel="vs período ant."
            sparklineData={sparklineTicket}
            sparklineColor={CHART_COLORS.combustivel}
          />
          <KpiCard
            label="CMV %"
            value={resumo ? fmtPct(resumo.cmv_pct) : '—'}
            delta={resumo?.delta_cmv_pct ?? undefined}
            deltaLabel="vs período ant."
            sparklineData={sparklineCmv}
            sparklineColor={CHART_COLORS.combustivel}
            invertColors
          />
        </div>

        {/* ── Charts Row: Evolução + Mix ── */}
        <div className="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr]">
          <SectionCard title="Evolução de Vendas" description="Receita bruta e margem no período">
            {chartData.length > 0 ? (
              <ComposedChart
                data={chartData}
                xKey="label"
                barKey="receita_bruta"
                barName="Receita Bruta"
                barColor={CHART_COLORS.combustivel}
                barFormatter={fmtBRLk}
                lineKey="margem_pct"
                lineName="Margem %"
                lineColor={CHART_COLORS.conveniencia}
                lineFormatter={(v) => fmtPct(v)}
                height={260}
              />
            ) : (
              <div className="h-[260px] flex items-center justify-center">
                <EmptyState title="Sem dados no período" />
              </div>
            )}
          </SectionCard>

          <SectionCard title="Mix de Vendas" description="Participação por segmento">
            {donutData.length > 0 ? (
              <DonutChart
                data={donutData}
                centerLabel="Total"
                centerValue={fmtBRLk(totalReceita)}
                height={180}
                showLegend
                onSliceClick={handleSliceClick}
                activeSlice={activeSliceName}
              />
            ) : (
              <div className="h-[180px] flex items-center justify-center">
                <EmptyState title="Sem dados no período" />
              </div>
            )}
          </SectionCard>
        </div>

        {/* ── Top 10 Produtos ── */}
        <SectionCard
          title="Top produtos"
          description={
            selectedSegment
              ? `Mostrando: ${SEGMENT_NAMES[selectedSegment] ?? selectedSegment}`
              : undefined
          }
          actions={
            selectedSegment ? (
              <button
                type="button"
                onClick={() => setSelectedSegment(null)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpar filtro ×
              </button>
            ) : undefined
          }
          noPadding
        >
          {topProdutosQ.isLoading ? (
            <TableSkeleton rows={10} cols={5} />
          ) : topProdutos.length === 0 ? (
            <div className="px-[16px] pb-[14px] pt-2">
              <EmptyState
                icon={Package}
                title="Nenhum produto no período selecionado"
              />
            </div>
          ) : (
            <DataTable<VendasTopProduto>
              columns={columns}
              rows={topProdutos}
            />
          )}
        </SectionCard>
      </div>
    </>
  );
}

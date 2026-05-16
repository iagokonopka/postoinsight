// Gráfico de área empilhada — usado em Combustível (evolução por produto) e Conveniência (horário)
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface StackedAreaSeries {
  name: string;
  dataKey: string;
  color: string;
}

interface StackedAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: StackedAreaSeries[];
  height?: number;
  formatY?: (v: number) => string;
  smooth?: boolean;
}

export function StackedAreaChart({
  data,
  xKey,
  series,
  height = 220,
  formatY = fBRL,
  smooth = true,
}: StackedAreaChartProps) {
  if (!data || data.length === 0) return null;

  const xAxisData = data.map((d) => String(d[xKey] ?? ''));

  const option = {
    animation: false,
    grid: { top: 14, right: 12, bottom: 28, left: 62, containLabel: false },
    xAxis: {
      type: 'category',
      data: xAxisData,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 9,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        interval: data.length > 14 ? Math.ceil(data.length / 10) - 1 : 0,
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 9,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        formatter: (v: number) => formatY(v),
      },
      splitLine: { lineStyle: { color: 'var(--color-border-subtle)', width: 1 } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: { fontSize: 11, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' },
      formatter: (params: { seriesName: string; value: number; color: string; axisValueLabel: string }[]) => {
        if (!Array.isArray(params) || !params.length) return '';
        let html = `<div style="font-weight:700;margin-bottom:4px;font-size:11px">${params[0].axisValueLabel}</div>`;
        for (const p of params) {
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
            <span style="width:10px;height:2px;border-radius:1px;background:${p.color};display:inline-block"></span>
            <span style="color:var(--color-text-muted);font-size:10px">${p.seriesName}:</span>
            <span style="font-family:var(--font-mono);font-weight:600">${formatY(p.value)}</span>
          </div>`;
        }
        return html;
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'var(--color-border)', type: 'dashed', width: 1 },
      },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      stack: 'total',
      smooth,
      symbol: 'none',
      lineStyle: { color: s.color, width: 1.5 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: hexToRgba(s.color, 0.6),
      },
      data: data.map((d) => (d[s.dataKey] as number) ?? 0),
    })),
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
}

function hexToRgba(color: string, opacity: number): string {
  if (!color.startsWith('#')) return `rgba(0,115,187,${opacity})`;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
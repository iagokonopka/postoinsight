import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface BarSeries {
  name: string;
  dataKey: string;
  color: string;
}

interface BarChartProps {
  data: Record<string, unknown>[];
  xKey: string;
  series: BarSeries[];
  height?: number;
  formatY?: (v: number) => string;
  stacked?: boolean;
}

export function BarChart({
  data,
  xKey,
  series,
  height = 220,
  formatY = fBRL,
  stacked = false,
}: BarChartProps) {
  if (!data || data.length === 0) return null;

  const xAxisData = data.map((d) => String(d[xKey] ?? ''));

  const echartsOption = {
    animation: false,
    grid: {
      top: 14, right: 12, bottom: 28, left: 62,
      containLabel: false,
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 9,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        interval: data.length > 14 ? Math.ceil(data.length / 10) - 1 : 0,
      },
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
      splitLine: {
        lineStyle: { color: 'var(--color-border-subtle)', width: 1 },
      },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: {
        fontSize: 11,
        color: 'var(--color-text)',
        fontFamily: 'var(--font-sans)',
      },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'bar',
      stack: stacked ? 'total' : undefined,
      data: data.map((d) => d[s.dataKey] as number ?? 0),
      itemStyle: { color: s.color, borderRadius: [2, 2, 0, 0] },
      barMaxWidth: 32,
    })),
  };

  return (
    <ReactECharts
      option={echartsOption}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
}
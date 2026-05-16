// Gráfico de dispersão: quantidade × margem por categoria, tamanho = receita
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fNum, fPct, fBRL } from '@/lib/formatters';

export interface ScatterPoint {
  name: string;
  qtd: number;
  margem_pct: number;
  receita: number;
  color?: string;
}

interface ScatterChartProps {
  data: ScatterPoint[];
  height?: number;
  xLabel?: string;
  yLabel?: string;
}

export function ScatterChart({ data, height = 320, xLabel = 'Qtd vendida', yLabel = 'Margem %' }: ScatterChartProps) {
  if (!data || data.length === 0) return null;

  const maxReceita = Math.max(...data.map((d) => d.receita), 1);
  const medQtd = median(data.map((d) => d.qtd));
  const medMargem = median(data.map((d) => d.margem_pct));

  const option = {
    animation: false,
    grid: { top: 20, right: 20, bottom: 40, left: 60, containLabel: false },
    xAxis: {
      type: 'value',
      name: xLabel,
      nameLocation: 'middle',
      nameGap: 28,
      nameTextStyle: { fontSize: 10, color: 'var(--color-text-muted)' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', formatter: (v: number) => fNum(v) },
      splitLine: { lineStyle: { color: 'var(--color-border-subtle)' } },
    },
    yAxis: {
      type: 'value',
      name: yLabel,
      nameLocation: 'middle',
      nameGap: 44,
      nameTextStyle: { fontSize: 10, color: 'var(--color-text-muted)' },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 9, color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', formatter: (v: number) => fPct(v, 0) },
      splitLine: { lineStyle: { color: 'var(--color-border-subtle)' } },
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: { fontSize: 11, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' },
      formatter: (p: { data: number[] & { name?: string }; name: string }) => {
        const d = data[p.data[3] as number];
        return `<strong>${d.name}</strong><br/>
          Qtd: ${fNum(d.qtd)}<br/>
          Margem: ${fPct(d.margem_pct, 1)}<br/>
          Receita: ${fBRL(d.receita)}`;
      },
    },
    // Linhas de mediana (quadrantes)
    markLine: {},
    series: [{
      type: 'scatter',
      data: data.map((d, i) => [d.qtd, d.margem_pct, d.receita, i]),
      symbolSize: (val: number[]) => Math.max(8, Math.sqrt((val[2] / maxReceita) * 2400)),
      itemStyle: {
        color: (params: { dataIndex: number }) => data[params.dataIndex]?.color ?? '#0073BB',
        opacity: 0.75,
        borderColor: '#fff',
        borderWidth: 1,
      },
      label: {
        show: data.length <= 12,
        formatter: (params: { dataIndex: number }) => data[params.dataIndex]?.name ?? '',
        fontSize: 9,
        color: 'var(--color-text-muted)',
        position: 'top',
      },
      markLine: {
        silent: true,
        lineStyle: { color: 'var(--color-border)', type: 'dashed', width: 1 },
        label: { show: false },
        data: [
          { xAxis: medQtd },
          { yAxis: medMargem },
        ],
      },
    }],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
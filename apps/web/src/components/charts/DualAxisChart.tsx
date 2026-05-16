// Gráfico dual-axis: barras de receita (eixo esquerdo) + linha de margem % (eixo direito)
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL, fPct } from '@/lib/formatters';

interface DualAxisPoint {
  label: string;
  receita_bruta: number;
  margem_pct: number;
}

interface DualAxisChartProps {
  data: DualAxisPoint[];
  height?: number;
}

export function DualAxisChart({ data, height = 240 }: DualAxisChartProps) {
  if (!data || data.length === 0) return null;

  const labels = data.map((d) => d.label);

  const option = {
    animation: false,
    grid: { top: 14, right: 60, bottom: 28, left: 62, containLabel: false },
    xAxis: {
      type: 'category',
      data: labels,
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
    yAxis: [
      {
        type: 'value',
        name: 'Receita',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 9,
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          formatter: (v: number) => fBRL(v),
        },
        splitLine: { lineStyle: { color: 'var(--color-border-subtle)', width: 1 } },
      },
      {
        type: 'value',
        name: 'Margem %',
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 9,
          color: '#8D6708',
          fontFamily: 'var(--font-mono)',
          formatter: (v: number) => fPct(v, 0),
        },
        splitLine: { show: false },
      },
    ],
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
          const fmt = p.seriesName === 'Margem %' ? fPct(p.value, 1) : fBRL(p.value);
          html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:2px">
            <span style="width:10px;height:2px;border-radius:1px;background:${p.color};display:inline-block"></span>
            <span style="color:var(--color-text-muted);font-size:10px">${p.seriesName}:</span>
            <span style="font-family:var(--font-mono);font-weight:600">${fmt}</span>
          </div>`;
        }
        return html;
      },
      axisPointer: {
        type: 'line',
        lineStyle: { color: 'var(--color-border)', type: 'dashed', width: 1 },
      },
    },
    series: [
      {
        name: 'Receita Bruta',
        type: 'bar',
        yAxisIndex: 0,
        data: data.map((d) => d.receita_bruta),
        itemStyle: {
          color: 'rgba(0,115,187,0.75)',
          borderRadius: [2, 2, 0, 0],
        },
        barMaxWidth: 32,
      },
      {
        name: 'Margem %',
        type: 'line',
        yAxisIndex: 1,
        data: data.map((d) => d.margem_pct),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        lineStyle: { color: '#8D6708', width: 2, type: 'dashed' },
        itemStyle: { color: '#8D6708' },
      },
    ],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
    />
  );
}
// Gráfico cascata para DRE: Receita Bruta → Descontos → Receita Líquida → CMV → Margem Bruta
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface WaterfallStep {
  label: string;
  value: number;
  type: 'start' | 'sub' | 'total';
}

interface WaterfallChartProps {
  steps: WaterfallStep[];
  height?: number;
  formatValue?: (v: number) => string;
}

export function WaterfallChart({ steps, height = 300, formatValue = fBRL }: WaterfallChartProps) {
  if (!steps || steps.length === 0) return null;

  // Calcula os offsets (barras invisíveis de base para simular cascata)
  const bases: number[] = [];
  const values: number[] = [];
  const colors: string[] = [];

  let running = 0;
  for (const step of steps) {
    if (step.type === 'start') {
      bases.push(0);
      values.push(step.value);
      colors.push('#0073BB'); // primary
      running = step.value;
    } else if (step.type === 'sub') {
      const base = running - step.value;
      bases.push(base);
      values.push(step.value);
      colors.push('#D13212'); // danger
      running = base;
    } else {
      // total — âncora no zero
      bases.push(0);
      values.push(running);
      colors.push('#1D8102'); // success
    }
  }

  const labels = steps.map((s) => s.label);
  const displayValues = steps.map((s) =>
    s.type === 'sub' ? `-${formatValue(s.value)}` : formatValue(s.value)
  );

  const option = {
    animation: false,
    grid: { top: 32, right: 16, bottom: 40, left: 16, containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 11,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-sans)',
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
        formatter: (v: number) => formatValue(v),
      },
      splitLine: { lineStyle: { color: 'var(--color-border-subtle)', width: 1 } },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: { fontSize: 11, color: 'var(--color-text)' },
      formatter: (params: { dataIndex: number }[]) => {
        if (!params.length) return '';
        const i = params[0].dataIndex;
        const step = steps[i];
        return `<strong>${step.label}</strong><br/>${step.type === 'sub' ? '−' : ''}${formatValue(step.value)}`;
      },
    },
    series: [
      // Barra de base invisível (offset)
      {
        type: 'bar',
        stack: 'waterfall',
        itemStyle: { color: 'transparent', borderColor: 'transparent' },
        data: bases,
        tooltip: { show: false },
      },
      // Barra visível
      {
        type: 'bar',
        stack: 'waterfall',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            color: colors[i],
            borderRadius: [3, 3, 0, 0],
          },
          label: {
            show: true,
            position: 'top',
            formatter: () => displayValues[i],
            fontSize: 10,
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--color-text)',
          },
        })),
        barMaxWidth: 64,
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
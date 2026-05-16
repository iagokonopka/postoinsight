// Mapa de calor de receita — eixo X: semanas do período, eixo Y: dias da semana
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface HeatmapData {
  // weekIndex (0-based), dowIndex (0=Seg … 6=Dom), value
  week: number;
  dow: number;
  value: number;
}

interface HeatmapChartProps {
  data: HeatmapData[];
  weeks: string[];   // ex: ['S1','S2','S3','S4']
  dows: string[];    // ex: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom']
  colorBase?: string;
  height?: number;
  formatValue?: (v: number) => string;
}

export function HeatmapChart({
  data,
  weeks,
  dows,
  colorBase = '#0073BB',
  height = 160,
  formatValue = fBRL,
}: HeatmapChartProps) {
  if (!data || data.length === 0) return (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 12 }}>
      Dados insuficientes para o mapa de calor
    </div>
  );

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const echartsData = data.map((d) => [d.week, d.dow, d.value]);

  const option = {
    animation: false,
    grid: { top: 10, right: 16, bottom: 30, left: 50 },
    xAxis: {
      type: 'category',
      data: weeks,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: 'var(--color-text-muted)' },
      splitArea: { show: true, areaStyle: { color: ['transparent'] } },
    },
    yAxis: {
      type: 'category',
      data: dows,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { fontSize: 10, color: 'var(--color-text-muted)' },
      splitArea: { show: true, areaStyle: { color: ['transparent'] } },
    },
    visualMap: {
      min: 0,
      max: maxVal,
      calculable: false,
      show: false,
      inRange: {
        color: [hexToRgba(colorBase, 0.08), hexToRgba(colorBase, 1)],
      },
    },
    tooltip: {
      position: 'top',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: { fontSize: 11, color: 'var(--color-text)' },
      formatter: (p: { data: [number, number, number] }) => {
        const [wi, di, val] = p.data;
        return `${dows[di]} · ${weeks[wi]}<br/><strong>${formatValue(val)}</strong>`;
      },
    },
    series: [{
      type: 'heatmap',
      data: echartsData,
      label: { show: false },
      itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: 'var(--color-bg)' },
      emphasis: { itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' } },
    }],
  };

  return (
    <div style={{ padding: '0 var(--space-5) var(--space-4)' }}>
      <ReactECharts
        option={option}
        style={{ height, width: '100%' }}
        notMerge
      />
    </div>
  );
}

function hexToRgba(color: string, opacity: number): string {
  if (!color.startsWith('#')) return `rgba(0,115,187,${opacity})`;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
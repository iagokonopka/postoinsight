// Mini gráfico de linha inline — usado em KpiCard e tabelas de combustível
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function Sparkline({ data, color = '#0073BB', width = 80, height = 24 }: SparklineProps) {
  if (!data || data.length === 0) return null;

  const option = {
    animation: false,
    grid: { top: 2, right: 2, bottom: 2, left: 2 },
    xAxis: { type: 'category', show: false },
    yAxis: { type: 'value', show: false },
    tooltip: { show: false },
    series: [{
      type: 'line',
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: { color, width: 1.5 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(color, 0.25) },
            { offset: 1, color: hexToRgba(color, 0) },
          ],
        },
      },
    }],
  };

  return (
    <ReactECharts
      option={option}
      style={{ height, width }}
      notMerge
    />
  );
}

// Converte hex para rgba
function hexToRgba(color: string, opacity: number): string {
  if (!color.startsWith('#')) return `rgba(0,115,187,${opacity})`;
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
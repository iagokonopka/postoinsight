// Importa a instância já configurada com tree-shaking (ADR-011)
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface LineAreaSeries {
  name: string;
  dataKey: string;
  color: string;
  areaOpacity?: number; // 0–1, padrão 0.12
}

interface LineAreaChartProps {
  data: Record<string, unknown>[];
  xKey: string;                      // chave do eixo X nos dados
  series: LineAreaSeries[];
  height?: number;
  formatY?: (v: number) => string;   // padrão: fBRL
  smooth?: boolean;
}

export function LineAreaChart({
  data,
  xKey,
  series,
  height = 220,
  formatY = fBRL,
  smooth = true,
}: LineAreaChartProps) {
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
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        fontSize: 9,
        color: 'var(--color-text-muted)',
        fontFamily: 'var(--font-mono)',
        // Mostra no máximo ~10 labels para não poluir
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
      data: data.map((d) => d[s.dataKey] as number ?? 0),
      smooth,
      symbol: 'circle',
      symbolSize: 5,
      showSymbol: false,
      lineStyle: { color: s.color, width: 1.75 },
      itemStyle: { color: s.color },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: hexToRgba(s.color, s.areaOpacity ?? 0.12) },
            { offset: 1, color: hexToRgba(s.color, 0) },
          ],
        },
      },
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

// Converte CSS var ou hex para rgba — suporte básico para as cores de área
function hexToRgba(color: string, opacity: number): string {
  // Se for uma var() CSS, retorna com opacity hardcoded (ECharts não resolve vars)
  if (color.startsWith('var(')) {
    // Fallback para cores conhecidas do design
    const MAP: Record<string, string> = {
      'var(--color-primary)':  `rgba(0,115,187,${opacity})`,
      'var(--color-success)':  `rgba(29,129,2,${opacity})`,
      'var(--color-cta)':      `rgba(236,114,17,${opacity})`,
      'var(--color-segment-combustivel)':   `rgba(0,115,187,${opacity})`,
      'var(--color-segment-lubrificantes)': `rgba(107,64,196,${opacity})`,
      'var(--color-segment-servicos)':      `rgba(29,129,2,${opacity})`,
      'var(--color-segment-conveniencia)':  `rgba(236,114,17,${opacity})`,
    };
    return MAP[color] ?? `rgba(0,115,187,${opacity})`;
  }
  // Hex #RRGGBB
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
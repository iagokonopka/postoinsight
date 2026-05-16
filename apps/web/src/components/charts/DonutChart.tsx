// Gráfico de rosca para distribuição por segmento
import '@/lib/echarts';
import ReactECharts from 'echarts-for-react';
import { fBRL } from '@/lib/formatters';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSlice[];
  size?: number;         // diâmetro em px
  thickness?: number;    // espessura do anel em px
  centerLabel?: string;  // texto no centro
  formatValue?: (v: number) => string;
}

export function DonutChart({
  data,
  size = 180,
  thickness = 24,
  centerLabel = 'Total',
  formatValue = fBRL,
}: DonutChartProps) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const outerPct = 100;
  const innerPct = Math.round(((size / 2 - thickness) / (size / 2)) * 100);

  const option = {
    animation: false,
    tooltip: {
      trigger: 'item',
      backgroundColor: 'var(--color-bg)',
      borderColor: 'var(--color-border)',
      borderWidth: 1,
      textStyle: { fontSize: 11, color: 'var(--color-text)', fontFamily: 'var(--font-sans)' },
      formatter: (p: { name: string; value: number; percent: number }) =>
        `<strong>${p.name}</strong><br/>${formatValue(p.value)} · ${p.percent.toFixed(1)}%`,
    },
    graphic: [{
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: `${centerLabel}\n${formatValue(total)}`,
        textAlign: 'center',
        fill: 'var(--color-text)',
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        lineHeight: 16,
      },
    }],
    series: [{
      type: 'pie',
      radius: [`${innerPct}%`, `${outerPct}%`],
      data: data.map((d) => ({
        name: d.label,
        value: d.value,
        itemStyle: { color: d.color },
      })),
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' },
        scale: false,
      },
    }],
  };

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ height: size, width: size }}
        notMerge
      />
      {/* Legenda abaixo do donut */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color, flexShrink: 0 }} />
            <span style={{ color: 'var(--color-text-muted)', flex: 1 }}>{d.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-text)', fontWeight: 600 }}>
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
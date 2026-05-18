/**
 * Tema ECharts — PostoInsight
 * Derivado de: docs/design/design-tokens.md seção 10
 * Registrado via: echarts.registerTheme('postoinsight', postoinsightTheme)
 */

export const postoinsightTheme = {
  color: [
    '#0073BB', // data-combustivel
    '#EC7211', // data-conveniencia
    '#6B40C4', // data-lubrificantes
    '#1D8102', // data-arla
    '#0d9488', // data-servicos
    '#e11d48', // data-series-6
  ],

  backgroundColor: 'transparent',

  textStyle: {
    fontFamily: 'DM Sans, system-ui, sans-serif',
    fontSize: 12,
    color: '#64748b', // slate-500
  },

  title: {
    textStyle: {
      color: '#0f172a', // slate-900
      fontSize: 14,
      fontWeight: '600',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    subtextStyle: {
      color: '#64748b',
      fontSize: 12,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
  },

  grid: {
    left: 0,
    right: 0,
    top: 8,
    bottom: 0,
    containLabel: true,
  },

  categoryAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#64748b',
      fontSize: 12,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    splitLine: { show: false },
  },

  valueAxis: {
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: {
      color: '#64748b',
      fontSize: 12,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    splitLine: {
      show: true,
      lineStyle: {
        color: '#e2e8f0', // slate-200
        type: 'solid' as const,
        width: 1,
      },
    },
  },

  tooltip: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: {
      color: '#0f172a',
      fontSize: 13,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    extraCssText:
      'box-shadow: 0 4px 6px -1px rgba(15,23,42,0.1); border-radius: 8px; padding: 10px 14px;',
  },

  legend: {
    textStyle: {
      color: '#475569', // slate-600
      fontSize: 12,
      fontFamily: 'DM Sans, system-ui, sans-serif',
    },
    icon: 'circle',
    itemWidth: 8,
    itemHeight: 8,
  },

  line: {
    smooth: false,
    symbol: 'none',
    lineStyle: { width: 2 },
    areaStyle: { opacity: 0.08 },
  },

  bar: {
    barMaxWidth: 48,
    itemStyle: { borderRadius: [4, 4, 0, 0] },
  },

  animation: true,
  animationDuration: 300,
  animationEasing: 'cubicOut' as const,
} as const;

/** Variante dark do tema — usada quando .dark está ativo */
export const postoinsightThemeDark = {
  ...postoinsightTheme,
  color: [
    '#1a90d4',
    '#f08030',
    '#8a5fd4',
    '#2da832',
    '#14b8a6',
    '#fb7185',
  ],
  textStyle: { ...postoinsightTheme.textStyle, color: '#94a3b8' },
  title: {
    textStyle: { ...postoinsightTheme.title.textStyle, color: '#f1f5f9' },
    subtextStyle: { ...postoinsightTheme.title.subtextStyle, color: '#94a3b8' },
  },
  categoryAxis: {
    ...postoinsightTheme.categoryAxis,
    axisLabel: { ...postoinsightTheme.categoryAxis.axisLabel, color: '#94a3b8' },
  },
  valueAxis: {
    ...postoinsightTheme.valueAxis,
    axisLabel: { ...postoinsightTheme.valueAxis.axisLabel, color: '#94a3b8' },
    splitLine: {
      ...postoinsightTheme.valueAxis.splitLine,
      lineStyle: { color: '#334155', type: 'solid' as const, width: 1 },
    },
  },
  tooltip: {
    ...postoinsightTheme.tooltip,
    backgroundColor: '#1e293b',
    borderColor: '#334155',
    textStyle: { ...postoinsightTheme.tooltip.textStyle, color: '#f1f5f9' },
    extraCssText:
      'box-shadow: 0 4px 6px -1px rgba(2,6,23,0.4); border-radius: 8px; padding: 10px 14px;',
  },
  legend: { ...postoinsightTheme.legend, textStyle: { ...postoinsightTheme.legend.textStyle, color: '#94a3b8' } },
} as const;

// Chart color constants — matches design_example/postoinsight/charts.js

export const CHART_COLORS = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  arla:          '#1D8102',
  servicos:      '#0891b2',
  s1: '#0073BB',
  s2: '#EC7211',
  s3: '#6B40C4',
  s4: '#1D8102',
  s5: '#0891b2',
  s6: '#db2777',
  pos:     '#16a34a',
  neg:     '#dc2626',
  neutral: '#64748b',
} as const

export type ChartColorKey = keyof typeof CHART_COLORS

// Theme-aware tokens for Recharts (grid, tick, tooltip)
export function chartThemeTokens(isDark: boolean) {
  return isDark ? {
    grid:          '#1f2937',
    tick:          '#94a3b8',
    tooltipBg:     '#0f172a',
    tooltipBorder: '#1f2937',
    titleColor:    '#f1f5f9',
    bodyColor:     '#94a3b8',
    surface:       '#0f172a',
  } : {
    grid:          '#e2e8f0',
    tick:          '#64748b',
    tooltipBg:     '#ffffff',
    tooltipBorder: '#e2e8f0',
    titleColor:    '#0f172a',
    bodyColor:     '#64748b',
    surface:       '#ffffff',
  }
}

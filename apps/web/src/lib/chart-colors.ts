// Chart color constants — matches design_example/postoinsight/charts.js

// Paleta de segmentos — identidade "Executivo" (ADR-017), espelha o design (SEGS):
// combustível = ink (foreground), conveniência = acento Petróleo, serviços/lubrificantes = neutros.
// Usamos hsl(var(--token)) onde precisa ser theme-aware — o Recharts resolve var() em
// atributos SVG (já usado no projeto, ex.: CartesianGrid stroke="hsl(var(--border))").
export const CHART_COLORS = {
  combustivel:   'hsl(var(--foreground))',
  conveniencia:  'hsl(var(--primary))',
  lubrificantes: '#c7c4bb',
  arla:          'hsl(var(--hero2-bar))',
  servicos:      '#9bb0a6',
  // séries genéricas (produtos de combustível etc.)
  s1: 'hsl(var(--primary))',
  s2: 'hsl(var(--hero2-bar))',
  s3: '#e09f3e',
  s4: 'hsl(var(--success))',
  s5: '#7a6ff0',
  s6: 'hsl(var(--danger))',
  pos:     'hsl(var(--success))',
  neg:     'hsl(var(--danger))',
  neutral: 'hsl(var(--muted-foreground))',
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

// Chart colors — fixed, do not change between light/dark (ADR-011)
export const CHART_COLORS = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  servicos:      '#0891B2',
  arla:          '#1D8102',
  positive:      '#16A34A',
  negative:      '#DC2626',
  // Extra series
  extra1: '#DB2777',
  extra2: '#D97706',
  extra3: '#7C3AED',
} as const;

export type ChartColorKey = keyof typeof CHART_COLORS;

// Grid — uses CSS variables so it responds to dark mode
export const CHART_GRID = {
  stroke: 'hsl(var(--border))',
  strokeDasharray: '0',
  vertical: false,
} as const;

// Tick style for axes
export const CHART_TICK = {
  fill: 'hsl(var(--muted-foreground))',
  fontSize: 11,
  fontFamily: 'Geist, system-ui, sans-serif',
} as const;

// Tooltip content style
export const CHART_TOOLTIP_STYLE = {
  contentStyle: {
    background: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'Geist, system-ui, sans-serif',
    color: 'hsl(var(--foreground))',
    boxShadow: 'var(--shadow-md)',
  },
  labelStyle: {
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '4px',
  },
  itemStyle: {
    color: 'hsl(var(--foreground))',
  },
  cursor: {
    fill: 'hsl(var(--muted) / 0.4)',
  },
} as const;

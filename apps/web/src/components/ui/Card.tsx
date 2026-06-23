// SectionCard + layout grids — spec: FRONTEND_TODO Bloco 7
import type { ReactNode, CSSProperties } from 'react'

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
  children: ReactNode
  style?: CSSProperties
}

export function Card({ children, style }: CardProps) {
  return (
    <div style={{
      background: 'hsl(var(--card))',
      color: 'hsl(var(--card-foreground))',
      borderRadius: 'var(--radius)',
      boxShadow: 'var(--shadow-card)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Card Header ─────────────────────────────────────────────────────────────

interface CardHeaderProps {
  title: string
  description?: string
  eyebrow?: string    // sobretítulo uppercase (cabeçalho dos chart cards do design)
  action?: ReactNode  // right-side slot (buttons, selects, legenda)
}

export function CardHeader({ title, description, eyebrow, action }: CardHeaderProps) {
  return (
    <div style={{
      padding: 'var(--pad-card-y) var(--pad-card) 14px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: '12px',
    }}>
      <div style={{ minWidth: 0 }}>
        {eyebrow && (
          <div className="mono" style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '5px' }}>
            {eyebrow}
          </div>
        )}
        <div style={{ fontSize: eyebrow ? '16px' : '14px', fontWeight: 600, color: 'hsl(var(--foreground))', letterSpacing: '-0.01em' }}>
          {title}
        </div>
        {description && (
          <div style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
            {description}
          </div>
        )}
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

// ─── Legenda discreta (canto sup-direito dos chart cards) ─────────────────────

export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
      {items.map(it => (
        <span key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: 'hsl(var(--muted-foreground))' }}>
          <span style={{ width: 8, height: 8, borderRadius: 8, background: it.color }} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

// ─── Card Body ───────────────────────────────────────────────────────────────

export function CardBody({ children, style }: CardProps) {
  return (
    <div style={{
      padding: '0 var(--pad-card) var(--pad-card-y)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Chart Box ───────────────────────────────────────────────────────────────

type ChartBoxSize = 'default' | 'tall' | 'short'

const CHART_HEIGHTS: Record<ChartBoxSize, string> = {
  default: '280px',
  tall: '320px',
  short: '200px',
}

interface ChartBoxProps {
  children: ReactNode
  size?: ChartBoxSize
  style?: CSSProperties
}

export function ChartBox({ children, size = 'default', style }: ChartBoxProps) {
  return (
    <div style={{ position: 'relative', height: CHART_HEIGHTS[size], ...style }}>
      {children}
    </div>
  )
}

// ─── KPI Grid ────────────────────────────────────────────────────────────────

type KpiGridCols = 3 | 4 | 5

const GRID_MIN: Record<KpiGridCols, string> = {
  5: '160px',
  4: '190px',
  3: '220px',
}

interface KpiGridProps {
  cols?: KpiGridCols
  template?: string   // override do grid-template-columns (ex.: heros mais largos)
  children: ReactNode
}

export function KpiGrid({ cols = 4, template, children }: KpiGridProps) {
  return (
    <div
      className="kpi-grid-responsive"
      style={{
        display: 'grid',
        gap: 'var(--gap-grid)',
        gridTemplateColumns: template ?? `repeat(auto-fit, minmax(${GRID_MIN[cols]}, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

// ─── Row grid (2-1 / 1-1 / 3-2) ─────────────────────────────────────────────

type RowVariant = '2-1' | '1-1' | '3-2'

const ROW_COLS: Record<RowVariant, string> = {
  '2-1': '2fr 1fr',
  '1-1': '1fr 1fr',
  '3-2': '3fr 2fr',
}

interface RowProps {
  variant?: RowVariant
  children: ReactNode
  style?: CSSProperties
}

export function Row({ variant = '2-1', children, style }: RowProps) {
  return (
    <div
      className="row-responsive"
      style={{
        display: 'grid',
        gap: 'var(--gap-grid)',
        gridTemplateColumns: ROW_COLS[variant],
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Page (vertical stack of sections) ───────────────────────────────────────

export function Page({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-row)' }}>
      {children}
    </div>
  )
}

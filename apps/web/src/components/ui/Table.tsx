// Table components — spec: FRONTEND_TODO Bloco 8
import type { ReactNode, CSSProperties, TdHTMLAttributes, ThHTMLAttributes } from 'react'

// ─── Wrappers ─────────────────────────────────────────────────────────────────

export function TableWrap({ children }: { children: ReactNode }) {
  return <div style={{ overflowX: 'auto' }}>{children}</div>
}

export function Table({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', ...style }}>
      {children}
    </table>
  )
}

// ─── Head ─────────────────────────────────────────────────────────────────────

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead>
      <tr style={{ borderBottom: '1px solid hsl(var(--border))' }}>
        {children}
      </tr>
    </thead>
  )
}

interface ThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  right?: boolean
  sortable?: boolean
  first?: boolean
  last?: boolean
}

export function Th({ right, sortable, first, last, children, style, ...props }: ThProps) {
  return (
    <th
      {...props}
      style={{
        padding: '9px 14px',
        paddingLeft:  first ? '20px' : '14px',
        paddingRight: last  ? '20px' : '14px',
        textAlign: right ? 'right' : 'left',
        fontFamily: 'var(--font-mono)',
        fontSize: '10.5px',
        fontWeight: 500,
        textTransform: 'uppercase',
        color: 'hsl(var(--muted-foreground))',
        whiteSpace: 'nowrap',
        letterSpacing: '0.09em',
        cursor: sortable ? 'pointer' : undefined,
        userSelect: sortable ? 'none' : undefined,
        ...style,
      }}
    >
      {children}
    </th>
  )
}

// ─── Body ─────────────────────────────────────────────────────────────────────

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

interface TrProps {
  children: ReactNode
  clickable?: boolean
  onClick?: () => void
  style?: CSSProperties
}

export function Tr({ children, clickable, onClick, style }: TrProps) {
  return (
    <tr
      onClick={onClick}
      style={{
        cursor: clickable ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={clickable ? e => {
        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
          td => ((td as HTMLElement).style.background = 'hsl(var(--muted) / 0.6)')
        )
      } : undefined}
      onMouseLeave={clickable ? e => {
        Array.from((e.currentTarget as HTMLTableRowElement).cells).forEach(
          td => ((td as HTMLElement).style.background = '')
        )
      } : undefined}
    >
      {children}
    </tr>
  )
}

interface TdProps extends TdHTMLAttributes<HTMLTableCellElement> {
  right?: boolean
  first?: boolean
  last?: boolean
}

export function Td({ right, first, last, children, style, ...props }: TdProps) {
  return (
    <td
      {...props}
      style={{
        padding: 'var(--row-pad-y) 14px',
        paddingLeft:  first ? '20px' : '14px',
        paddingRight: last  ? '20px' : '14px',
        color: 'hsl(var(--foreground))',
        borderBottom: '1px solid hsl(var(--border))',
        verticalAlign: 'middle',
        fontVariantNumeric: right ? 'tabular-nums' : undefined,
        textAlign: right ? 'right' : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  )
}

// ─── Tfoot ────────────────────────────────────────────────────────────────────

// Tfoot already includes a <tr> — use TfootTd directly as children
export function Tfoot({ children }: { children: ReactNode }) {
  return <tfoot><tr>{children}</tr></tfoot>
}

export function TfootTd({ right, first, last, children, style, ...props }: TdProps) {
  return (
    <td
      {...props}
      style={{
        borderTop: '1px solid hsl(var(--border))',
        borderBottom: 0,
        fontWeight: 600,
        color: 'hsl(var(--foreground))',
        padding: '12px 14px',
        paddingLeft:  first ? '20px' : '14px',
        paddingRight: last  ? '20px' : '14px',
        background: 'hsl(var(--muted) / 0.4)',
        fontVariantNumeric: right ? 'tabular-nums' : undefined,
        textAlign: right ? 'right' : undefined,
        ...style,
      }}
    >
      {children}
    </td>
  )
}

// ─── Cell helpers ─────────────────────────────────────────────────────────────

/** Rank number (#1, #2 …) */
export function RankCell({ rank }: { rank: number }) {
  return (
    <span style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums' }}>
      #{rank}
    </span>
  )
}

/** Colored dot + text */
export function SegCell({ color, children }: { color: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: color, flexShrink: 0 }} />
      {children}
    </div>
  )
}

/** Inline progress bar */
export function BarCell({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
      <div style={{ flex: 1, height: '5px', background: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: 'hsl(var(--primary))' }} />
      </div>
      {label && <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', fontVariantNumeric: 'tabular-nums', minWidth: '38px', textAlign: 'right' }}>{label}</span>}
    </div>
  )
}

/** Trend indicator: ↑ ↓ → */
export function TrendCell({ trend }: { trend: number }) {
  if (trend > 0.02)  return <span style={{ color: 'hsl(var(--success))', fontSize: '11px', fontWeight: 600 }}>↑ {(trend * 100).toFixed(1).replace('.', ',')}%</span>
  if (trend < -0.02) return <span style={{ color: 'hsl(var(--danger))',  fontSize: '11px', fontWeight: 600 }}>↓ {(Math.abs(trend) * 100).toFixed(1).replace('.', ',')}%</span>
  return <span style={{ color: 'hsl(var(--muted-foreground))', fontSize: '11px' }}>→</span>
}

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

// ─── Column definition ────────────────────────────────────────────────────────

export type ColumnAlign = 'left' | 'right' | 'center'

export interface Column<T = Record<string, unknown>> {
  key: string
  header: string
  align?: ColumnAlign
  /** Width hint — e.g. "w-8" for rank column */
  className?: string
  render?: (row: T, index: number) => ReactNode
}

// ─── Row type ─────────────────────────────────────────────────────────────────

export type Row = Record<string, unknown>

// ─── Footer definition ────────────────────────────────────────────────────────

export interface FooterCell {
  key: string
  value: ReactNode
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface DataTableProps<T extends Row = Row> {
  columns: Column<T>[]
  rows: T[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyText?: string
  /** Rendered inside <tfoot> — pass an array of cells matching column keys */
  footer?: FooterCell[]
  className?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function alignClass(align?: ColumnAlign) {
  if (align === 'right') return 'text-right'
  if (align === 'center') return 'text-center'
  return 'text-left'
}

// ─── Loading skeleton rows ─────────────────────────────────────────────────────

function SkeletonRows({ columns }: { columns: Column[] }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-border">
          {columns.map((col) => (
            <td
              key={col.key}
              className={cn('px-3.5 py-[10px] first:pl-5 last:pr-5', col.className)}
            >
              <div
                className={cn(
                  'h-4 rounded bg-muted animate-pulse',
                  col.align === 'right' ? 'ml-auto w-20' : 'w-32',
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataTable<T extends Row = Row>({
  columns,
  rows,
  onRowClick,
  loading = false,
  emptyText = 'Nenhum dado no período selecionado.',
  footer,
  className,
}: DataTableProps<T>) {
  const isClickable = Boolean(onRowClick)

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm border-collapse">
        {/* ── Head ── */}
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'text-[11px] font-medium text-muted-foreground px-3.5 py-2.5',
                  'first:pl-5 last:pr-5 whitespace-nowrap',
                  alignClass(col.align),
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* ── Body ── */}
        <tbody>
          {loading ? (
            <SkeletonRows columns={columns} />
          ) : rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-sm text-muted-foreground"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={index}
                onClick={isClickable ? () => onRowClick!(row) : undefined}
                className={cn(
                  'border-b border-border last:border-0 transition-colors duration-100',
                  isClickable && 'hover:bg-muted/60 cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-3.5 py-[10px] first:pl-5 last:pr-5 text-foreground',
                      col.align === 'right' && 'tabular-nums',
                      alignClass(col.align),
                      col.className,
                    )}
                  >
                    {col.render
                      ? col.render(row, index)
                      : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>

        {/* ── Footer ── */}
        {footer && footer.length > 0 && (
          <tfoot>
            <tr className="border-t border-border bg-muted/40">
              {columns.map((col, i) => {
                const cell = footer.find((f) => f.key === col.key)
                return (
                  <td
                    key={col.key}
                    className={cn(
                      'py-3 font-semibold text-foreground',
                      i === 0 ? 'px-5' : 'px-3.5',
                      col.align === 'right' && 'tabular-nums',
                      alignClass(col.align),
                    )}
                  >
                    {cell?.value ?? null}
                  </td>
                )
              })}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  )
}

// ─── Inline cell helpers (exported for page use) ──────────────────────────────

/** Rank cell: #1, #2 ... */
export function RankCell({ rank }: { rank: number }) {
  return (
    <span className="text-[12px] font-medium text-muted-foreground tabular-nums">
      #{rank}
    </span>
  )
}

/** Dot + label cell */
export function DotCell({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className="w-2 h-2 rounded-[2px] flex-shrink-0"
        style={{ background: color }}
      />
      {label}
    </span>
  )
}

/** Inline progress bar + percentage */
export function ProgressCell({ pct, color = 'bg-primary' }: { pct: number; color?: string }) {
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-[5px] bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
        />
      </div>
      <span className="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
        {pct.toFixed(1)}%
      </span>
    </div>
  )
}

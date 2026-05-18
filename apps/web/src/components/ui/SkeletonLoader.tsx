import { cn } from '@/lib/cn'

// ─── Primitivo ────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('rounded bg-muted animate-pulse', className)} />
}

// ─── KPI ──────────────────────────────────────────────────────────────────────

export function KpiSkeleton({ className }: { className?: string }) {
  return <Skeleton className={cn('h-[108px]', className)} />
}

// ─── Chart ────────────────────────────────────────────────────────────────────

export function ChartSkeleton({ height = 260, className }: { height?: number; className?: string }) {
  return <Skeleton className={cn('w-full', className)} style={{ height }} />
}

// ─── Table Row ────────────────────────────────────────────────────────────────

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {/* First col wider */}
      <td className="px-5 py-[10px]">
        <Skeleton className="h-4 w-36" />
      </td>
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <td key={i} className="px-3.5 py-[10px]">
          <Skeleton className="h-4 w-20 ml-auto" />
        </td>
      ))}
    </tr>
  )
}

// ─── Full Table ────────────────────────────────────────────────────────────────

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-3.5 py-2.5 first:pl-5">
                <Skeleton className={cn('h-3', i === 0 ? 'w-24' : 'w-16 ml-auto')} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <TableRowSkeleton key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

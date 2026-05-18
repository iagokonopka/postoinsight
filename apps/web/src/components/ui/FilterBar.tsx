import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface FilterBarProps {
  /** Filter controls (Selects, PeriodSelector, etc.) */
  children: ReactNode
  /** Action buttons on the right side (Export, etc.) */
  actions?: ReactNode
  className?: string
}

export function FilterBar({ children, actions, className }: FilterBarProps) {
  return (
    <div className={cn('flex items-center gap-2.5 flex-wrap px-5 pb-4', className)}>
      {children}
      {actions && (
        <>
          <div className="flex-1" aria-hidden />
          {actions}
        </>
      )}
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { BarChart2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  className?: string
}

export function EmptyState({ icon: Icon = BarChart2, title, description, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-10 px-6',
        'border-[1.5px] border-dashed border-border rounded bg-muted/30',
        className,
      )}
    >
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
        <Icon size={18} className="text-muted-foreground" strokeWidth={1.6} />
      </div>
      <p className="text-sm font-semibold text-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground max-w-xs">{description}</p>
      )}
    </div>
  )
}

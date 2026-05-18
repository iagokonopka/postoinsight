import { useState } from 'react'
import { cn } from '@/lib/cn'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import type { DateRange } from 'react-day-picker'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Period =
  | 'today'
  | 'yesterday'
  | '7d'
  | 'this_week'
  | 'this_month'
  | 'custom'

export interface CustomRange {
  from: Date
  to: Date
}

export interface PeriodValue {
  period: Period
  customRange?: CustomRange
}

// ─── Period labels ────────────────────────────────────────────────────────────

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: 'yesterday', label: 'Ontem' },
  { value: '7d', label: '7 dias' },
  { value: 'this_week', label: 'Esta semana' },
  { value: 'this_month', label: 'Este mês' },
  { value: 'custom', label: 'Personalizado' },
]

// Max 90 days for custom range
const MAX_RANGE_DAYS = 90

function diffDays(from: Date, to: Date) {
  return Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
}

// ─── Component ────────────────────────────────────────────────────────────────

interface PeriodSelectorProps {
  value: Period
  onChange: (v: PeriodValue) => void
  customRange?: CustomRange
  className?: string
}

export function PeriodSelector({
  value,
  onChange,
  customRange,
  className,
}: PeriodSelectorProps) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [pendingRange, setPendingRange] = useState<DateRange | undefined>(
    customRange ? { from: customRange.from, to: customRange.to } : undefined,
  )
  const [rangeError, setRangeError] = useState(false)

  function handlePeriodClick(period: Period) {
    if (period !== 'custom') {
      onChange({ period })
      return
    }
    // Open popover for custom
    setPopoverOpen(true)
    setPendingRange(customRange ? { from: customRange.from, to: customRange.to } : undefined)
    setRangeError(false)
  }

  function handleApply() {
    if (!pendingRange?.from || !pendingRange?.to) return
    const days = diffDays(pendingRange.from, pendingRange.to)
    if (days > MAX_RANGE_DAYS) {
      setRangeError(true)
      return
    }
    setRangeError(false)
    setPopoverOpen(false)
    onChange({ period: 'custom', customRange: { from: pendingRange.from, to: pendingRange.to } })
  }

  function handleRangeSelect(range: DateRange | undefined) {
    setPendingRange(range)
    if (range?.from && range?.to) {
      const days = diffDays(range.from, range.to)
      setRangeError(days > MAX_RANGE_DAYS)
    } else {
      setRangeError(false)
    }
  }

  return (
    <div className={cn('inline-flex p-[3px] bg-muted rounded-[7px] gap-0.5', className)}>
      {PERIODS.map((p) =>
        p.value === 'custom' ? (
          <Popover key="custom" open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => handlePeriodClick('custom')}
                className={cn(
                  'h-7 px-3 text-xs font-medium rounded-[5px] transition-all duration-100',
                  value === 'custom'
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p.label}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="end">
              <Calendar
                mode="range"
                selected={pendingRange}
                onSelect={handleRangeSelect}
                numberOfMonths={2}
                disabled={{ after: new Date() }}
              />
              {rangeError && (
                <p className="mt-2 text-xs text-danger">
                  O período máximo é {MAX_RANGE_DAYS} dias.
                </p>
              )}
              <div className="flex justify-end gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPopoverOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!pendingRange?.from || !pendingRange?.to || rangeError}
                  onClick={handleApply}
                >
                  Aplicar
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <button
            key={p.value}
            onClick={() => handlePeriodClick(p.value)}
            className={cn(
              'h-7 px-3 text-xs font-medium rounded-[5px] transition-all duration-100',
              value === p.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ),
      )}
    </div>
  )
}

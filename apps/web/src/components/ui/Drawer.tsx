import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'

// ─── DrawerRow ─────────────────────────────────────────────────────────────────

interface DrawerRowProps {
  label: string
  value: ReactNode
}

export function DrawerRow({ label, value }: DrawerRowProps) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </div>
  )
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
}

export function Drawer({ open, onClose, title, icon, children }: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-40 bg-foreground/40',
          'transition-opacity duration-[180ms]',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className={cn(
          'fixed right-0 top-0 bottom-0 z-[41] w-[420px] max-w-[92vw]',
          'bg-card border-l border-border shadow-md',
          'flex flex-col overflow-hidden',
          'transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-2.5 px-5 py-[18px] border-b border-border flex-shrink-0">
          <h2
            id="drawer-title"
            className="flex-1 text-[15px] font-semibold text-foreground flex items-center gap-2.5"
          >
            {icon}
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar painel"
            className={cn(
              'inline-flex items-center justify-center rounded',
              'w-8 h-8 text-muted-foreground',
              'hover:bg-muted hover:text-foreground transition-colors duration-100',
            )}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </>
  )
}

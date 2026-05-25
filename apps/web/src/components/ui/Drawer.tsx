// Drawer — spec: FRONTEND_TODO Bloco 10
// Slides in from the right. Uses CSS transition (no animation library).
import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
  titleIcon?: ReactNode
}

export function Drawer({ open, onClose, title, children, titleIcon }: DrawerProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'hsl(222 47% 11% / 0.4)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.18s',
          zIndex: 40,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '420px',
        maxWidth: '92vw',
        background: 'hsl(var(--card))',
        borderLeft: '1px solid hsl(var(--border))',
        boxShadow: 'var(--shadow-md)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        zIndex: 41,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'hsl(var(--foreground))', flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
            {titleIcon}
            {title}
          </div>
          <button
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px',
              border: 'none', background: 'transparent',
              color: 'hsl(var(--muted-foreground))',
              cursor: 'pointer', borderRadius: '6px',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {children}
        </div>
      </div>
    </>
  )
}

// ─── Drawer Row helper ────────────────────────────────────────────────────────

interface DrawerRowProps {
  label: string
  value: ReactNode
  last?: boolean
}

export function DrawerRow({ label, value, last }: DrawerRowProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: last ? 'none' : '1px solid hsl(var(--border))',
      fontSize: '13px',
    }}>
      <span style={{ color: 'hsl(var(--muted-foreground))' }}>{label}</span>
      <span style={{ fontWeight: 600, color: 'hsl(var(--foreground))', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  )
}

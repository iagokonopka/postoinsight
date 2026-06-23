// KpiCard — identidade "Executivo" (ADR-017). Cards uniformes e compactos.
// Clicável: hover revela o hint "ABRIR" (sem azul) + leve elevação.
import { useState, type ReactNode } from 'react'

interface DeltaTagProps {
  value: number
  isPP?: boolean // percentage points — shows "p.p." instead of "%"
}

export function DeltaTag({ value, isPP }: DeltaTagProps) {
  const unit = isPP ? ' p.p.' : '%'
  const abs  = Math.abs(value).toFixed(1).replace('.', ',')

  if (Math.abs(value) < 0.15) {
    return <span style={{ color: 'hsl(var(--muted-foreground))' }}>→ {abs}{unit}</span>
  }
  const isPos = value >= 0
  return (
    <span style={{ color: isPos ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
      {isPos ? '↑' : '↓'} {abs}{unit}
    </span>
  )
}

interface KpiCardProps {
  label: string
  value: string           // valor formatado — caller formata
  valueTitle?: string     // tooltip com o valor cheio
  delta?: number          // variação vs. período anterior (% ou p.p.)
  deltaPP?: boolean        // se true, unidade é "p.p."
  deltaLabel?: string      // legenda do delta (default "vs. período anterior")
  icon?: ReactNode
  onClick?: () => void     // torna o card clicável (abre drawer) + mostra hint
  hint?: string            // rótulo no hover de card clicável (default "ABRIR")
  // compat (ignorados no visual compacto):
  sparkData?: number[]
  sparkColor?: string
  deltaMonth?: number
  deltaYear?: number
}

export function KpiCard({ label, value, valueTitle, delta, deltaPP, deltaLabel = 'vs. período anterior', icon, onClick, hint = 'ABRIR' }: KpiCardProps) {
  const [hover, setHover] = useState(false)
  const clickable = !!onClick

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'hsl(var(--card))',
        borderRadius: 'var(--radius)',
        padding: '14px 16px',
        boxShadow: clickable && hover ? 'var(--shadow-pop)' : 'var(--shadow-card)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        minHeight: '90px',
        cursor: clickable ? 'pointer' : 'default',
        transform: clickable && hover ? 'translateY(-1px)' : 'none',
        transition: 'box-shadow 0.16s, transform 0.16s',
      }}
    >
      {/* Label + hint "ABRIR" */}
      <div style={{
        fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))',
        display: 'flex', alignItems: 'center', gap: '7px',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {icon && <span style={{ width: '12px', height: '12px', opacity: 0.7, flexShrink: 0 }}>{icon}</span>}
        {label}
        {clickable && (
          <span className="mono" style={{
            marginLeft: 'auto', fontSize: '9.5px', letterSpacing: '0.1em', textTransform: 'uppercase',
            color: 'hsl(var(--muted-foreground))', opacity: hover ? 1 : 0, transition: 'opacity 0.16s', flexShrink: 0,
          }}>
            {hint}
          </span>
        )}
      </div>

      {/* Valor */}
      <div className="mono" title={valueTitle} style={{
        fontSize: 'var(--kpi-val-size)', fontWeight: 600, letterSpacing: '-0.02em',
        color: 'hsl(var(--foreground))', lineHeight: 1.05,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {value}
      </div>

      {/* Delta vs. período anterior — sinal +/− */}
      {delta !== undefined && (() => {
        const zero = Math.abs(delta) < 0.05
        const sign = delta > 0 ? '+' : delta < 0 ? '−' : ''
        const unit = deltaPP ? ' p.p.' : '%'
        const color = zero ? 'hsl(var(--muted-foreground))' : delta > 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'
        return (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '7px', marginTop: 'auto' }}>
            <span className="mono" style={{ fontWeight: 600, fontSize: '12px', color }}>{sign}{Math.abs(delta).toFixed(1).replace('.', ',')}{unit}</span>
            <span style={{ color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap', fontSize: '11px' }}>{deltaLabel}</span>
          </div>
        )
      })()}
    </div>
  )
}

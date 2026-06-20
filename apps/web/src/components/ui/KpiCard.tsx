// KpiCard — spec: FRONTEND_TODO Bloco 5
import type { ReactNode } from 'react'
import { Sparkline } from './Sparkline'

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
  value: string           // formatted value — caller does the formatting
  deltaMonth?: number     // % vs mês ant. (undefined = hide)
  deltaYear?: number      // % vs ano ant. (undefined = hide)
  deltaPP?: boolean       // if true, unit is "p.p." instead of "%"
  sparkData?: number[]    // series for sparkline
  sparkColor?: string     // sparkline stroke/fill color
  icon?: ReactNode        // 12×12 icon (optional)
}

export function KpiCard({ label, value, deltaMonth, deltaYear, deltaPP, sparkData, sparkColor = '#0073BB', icon }: KpiCardProps) {
  return (
    <div style={{
      position: 'relative',
      background: 'hsl(var(--card))',
      borderRadius: 'var(--radius)',
      padding: 'var(--kpi-pad)',
      paddingLeft: 'calc(var(--kpi-pad) + 3px)',
      boxShadow: 'var(--shadow-card)',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '116px',
    }}>
      {/* Faixa de acento — identidade "Executivo" (ADR-017) */}
      <span style={{
        display: 'var(--accent-strip-display, none)' as 'block' | 'none',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '3px',
        background: 'hsl(var(--primary))',
      }} />
      {/* Label */}
      <div style={{
        fontSize: '11px',
        fontWeight: 500,
        color: 'hsl(var(--muted-foreground))',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        position: 'relative',
        zIndex: 1,
      }}>
        {icon && <span style={{ width: '12px', height: '12px', opacity: 0.7, flexShrink: 0 }}>{icon}</span>}
        {label}
      </div>

      {/* Value */}
      <div style={{
        fontSize: 'var(--kpi-val-size)',
        fontWeight: 600,
        letterSpacing: '-0.6px',
        color: 'hsl(var(--foreground))',
        margin: '6px 0 8px',
        lineHeight: 1.1,
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        position: 'relative',
        zIndex: 1,
      }}>
        {value}
      </div>

      {/* Deltas */}
      {(deltaMonth !== undefined || deltaYear !== undefined) && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontSize: '11px',
          color: 'hsl(var(--muted-foreground))',
          marginTop: 'auto',
          position: 'relative',
          zIndex: 1,
        }}>
          {deltaMonth !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DeltaTag value={deltaMonth} isPP={deltaPP} />
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                vs mês ant.
              </span>
            </div>
          )}
          {deltaYear !== undefined && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DeltaTag value={deltaYear} isPP={deltaPP} />
              <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', whiteSpace: 'nowrap' }}>
                vs ano ant.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Sparkline — absolute background */}
      {sparkData && sparkData.length >= 2 && (
        <div style={{
          position: 'absolute',
          left: '-2px',
          right: '-2px',
          top: 0,
          bottom: '-1px',
          opacity: 0.28,
          pointerEvents: 'none',
          zIndex: 0,
        }}>
          <Sparkline data={sparkData} color={sparkColor} width="100%" height="100%" />
        </div>
      )}
    </div>
  )
}

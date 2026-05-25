// Heatmap — Padrão Semanal (7 dias × 4 semanas)
// Spec: FRONTEND_TODO Bloco 10 — CSS Grid, cor via hsl alpha
import { fCurrency } from '@/lib/format'

// data[dayIndex][weekIndex] = value  (dayIndex 0=Dom..6=Sáb, weekIndex 0=S1..3=S4)
interface HeatmapProps {
  data: number[][]
  formatter?: (v: number) => string
}

const DAYS  = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const WEEKS = ['S1', 'S2', 'S3', 'S4']

function cellColor(value: number, min: number, max: number): { bg: string; text: string } {
  const t = max > min ? (value - min) / (max - min) : 0
  const alpha = 0.08 + t * 0.92
  return {
    bg: `hsl(204 100% 37% / ${alpha.toFixed(3)})`,
    text: t > 0.55 ? '#fff' : 'hsl(var(--foreground))',
  }
}

export function Heatmap({ data, formatter = fCurrency }: HeatmapProps) {
  const allValues = data.flat().filter(v => v > 0)
  const min = allValues.length ? Math.min(...allValues) : 0
  const max = allValues.length ? Math.max(...allValues) : 1

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', paddingTop: '22px' }}>
          {DAYS.map(d => (
            <div key={d} style={{ height: '36px', fontSize: '11px', color: 'hsl(var(--muted-foreground))', display: 'flex', alignItems: 'center', paddingRight: '4px' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div style={{ flex: 1 }}>
          {/* Week headers */}
          <div style={{ display: 'flex', gap: '5px', marginBottom: '4px' }}>
            {WEEKS.map(w => (
              <div key={w} style={{ flex: 1, textAlign: 'center', fontSize: '10px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Cells: row = day, col = week */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {DAYS.map((_, dayIdx) => (
              <div key={dayIdx} style={{ display: 'flex', gap: '5px' }}>
                {WEEKS.map((_, wkIdx) => {
                  const val = data[dayIdx]?.[wkIdx] ?? 0
                  const { bg, text } = cellColor(val, min, max)
                  return (
                    <div
                      key={wkIdx}
                      title={formatter(val)}
                      style={{
                        flex: 1,
                        height: '36px',
                        borderRadius: '5px',
                        background: val > 0 ? bg : 'hsl(var(--muted) / 0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px',
                        fontWeight: 500,
                        fontVariantNumeric: 'tabular-nums',
                        color: val > 0 ? text : 'hsl(var(--muted-foreground))',
                        transition: 'transform 0.1s',
                        cursor: 'default',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = '')}
                    >
                      {val > 0 ? formatter(val) : '—'}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', fontSize: '10px', color: 'hsl(var(--muted-foreground))' }}>
        <span>{formatter(min)}</span>
        <div style={{ flex: 1, height: '6px', margin: '0 10px', borderRadius: '999px', background: 'linear-gradient(to right, hsl(204 100% 37% / 0.1), hsl(204 100% 37%))' }} />
        <span>{formatter(max)}</span>
      </div>
    </div>
  )
}

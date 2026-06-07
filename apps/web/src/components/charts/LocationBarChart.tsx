// LocationBarChart — comparativo de unidades por receita ou margem
// Integrado como terceiro card no primeiro Row das páginas analíticas.
// Interações: toggle de métrica, clique para filtrar a página, tooltip rico.
import { useState } from 'react'
import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { fCurrency, fPct } from '@/lib/format'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LocationBarItem {
  location_id: string
  location_nome: string
  receita_bruta: number
  margem_pct?: number
  participacao_pct: number
}

interface LocationBarChartProps {
  locations?: LocationBarItem[]
  loading?: boolean
  onLocationClick?: (locationId: string) => void
  selectedLocationId?: string | null
}

type Metric = 'receita_bruta' | 'margem_pct'

// ─── Tooltip customizado ──────────────────────────────────────────────────────

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const d: LocationBarItem = payload[0]?.payload
  if (!d) return null
  return (
    <div style={{
      background: 'hsl(var(--card))',
      border: '1px solid hsl(var(--border))',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '12px',
      boxShadow: 'var(--shadow-md)',
      minWidth: '160px',
    }}>
      <div style={{ fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '8px' }}>
        {d.location_nome}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '3px' }}>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Receita</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fCurrency(d.receita_bruta)}</span>
      </div>
      {d.margem_pct !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '3px' }}>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Margem</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fPct(d.margem_pct, 1)}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
        <span style={{ color: 'hsl(var(--muted-foreground))' }}>Participação</span>
        <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fPct(d.participacao_pct, 1)}</span>
      </div>
    </div>
  )
}

// ─── Toggle de métrica ────────────────────────────────────────────────────────

function MetricToggle({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) {
  const opts: { value: Metric; label: string }[] = [
    { value: 'receita_bruta', label: 'Receita' },
    { value: 'margem_pct',    label: 'Margem %' },
  ]
  return (
    <div style={{ display: 'inline-flex', padding: '2px', background: 'hsl(var(--muted))', borderRadius: '6px', gap: '2px' }}>
      {opts.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            height: '24px',
            padding: '0 8px',
            border: 'none',
            borderRadius: '4px',
            background: value === opt.value ? 'hsl(var(--card))' : 'transparent',
            color: value === opt.value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            fontSize: '11px',
            fontWeight: 500,
            fontFamily: 'inherit',
            cursor: 'pointer',
            boxShadow: value === opt.value ? 'var(--shadow-sm)' : 'none',
            transition: 'background 0.12s, color 0.12s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function LocationBarChart({
  locations,
  loading,
  onLocationClick,
  selectedLocationId,
}: LocationBarChartProps) {
  const [metric, setMetric] = useState<Metric>('receita_bruta')

  const hasSelection = !!selectedLocationId

  function handleClick(data: any) {
    if (!onLocationClick || !data?.activePayload?.[0]?.payload) return
    const id: string = data.activePayload[0].payload.location_id
    onLocationClick(id)
  }

  // Altura dinâmica: mínimo 160px, 36px por barra
  const chartH = Math.max(160, (locations?.length ?? 0) * 36)

  return (
    <Card>
      <CardHeader
        title="Por Unidade"
        description={metric === 'receita_bruta' ? 'Receita no período' : 'Margem bruta no período'}
        action={<MetricToggle value={metric} onChange={setMetric} />}
      />
      <CardBody>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
            <Spinner size="lg" />
          </div>
        ) : !locations || locations.length === 0 ? (
          <EmptyState title="Sem dados" />
        ) : (
          <ResponsiveContainer width="100%" height={chartH}>
            <ReBarChart
              layout="vertical"
              data={locations}
              margin={{ top: 0, right: 12, bottom: 0, left: 0 }}
              onClick={handleClick}
              style={{ cursor: onLocationClick ? 'pointer' : 'default' }}
            >
              <XAxis
                type="number"
                hide
                domain={[0, 'dataMax']}
              />
              <YAxis
                type="category"
                dataKey="location_nome"
                width={96}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontFamily: 'inherit' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: 'hsl(var(--muted) / 0.4)' }}
              />
              <Bar
                dataKey={metric}
                fill="hsl(var(--primary))"
                radius={[0, 3, 3, 0]}
                maxBarSize={22}
                label={false}
              >
                {locations.map((entry) => (
                  <Cell
                    key={entry.location_id}
                    fill="hsl(var(--primary))"
                    opacity={!hasSelection || selectedLocationId === entry.location_id ? 1 : 0.3}
                  />
                ))}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        )}
      </CardBody>
    </Card>
  )
}

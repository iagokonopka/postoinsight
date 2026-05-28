// Painel de comparativo entre unidades — exibido quando "Todas as unidades" está selecionado
// e o tenant possui mais de 1 location.
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { BarCell } from '@/components/ui/Table'
import { fCurrency, fPct } from '@/lib/format'

export interface LocationRow {
  location_id: string
  location_nome: string
  receita_bruta: number
  participacao_pct: number
  // métrica secundária opcional (ex: margem_pct, volume_litros)
  [key: string]: unknown
}

interface SecondaryMetric {
  key: string
  label: string
  format: (v: number) => string
}

interface LocationComparisonPanelProps {
  locations?: LocationRow[]
  loading?: boolean
  /** Métrica secundária exibida à direita da barra (ex: margem %, volume) */
  secondaryMetric?: SecondaryMetric
  title?: string
  description?: string
}

export function LocationComparisonPanel({
  locations,
  loading,
  secondaryMetric,
  title = 'Comparativo de Unidades',
  description = 'Receita por unidade no período selecionado',
}: LocationComparisonPanelProps) {
  const barMax = locations?.[0]?.receita_bruta ?? 1

  return (
    <Card>
      <CardHeader title={title} description={description} />
      <CardBody>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
            <Spinner size="lg" />
          </div>
        ) : !locations || locations.length === 0 ? (
          <EmptyState title="Sem dados" />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {locations.map((loc, i) => (
              <div
                key={loc.location_id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: secondaryMetric
                    ? '180px 1fr 90px 70px'
                    : '180px 1fr 90px',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                {/* Posição + nome */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'hsl(var(--muted-foreground))',
                    minWidth: '16px',
                    textAlign: 'right',
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'hsl(var(--foreground))',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {loc.location_nome}
                  </span>
                </div>

                {/* Barra de participação */}
                <BarCell
                  value={loc.receita_bruta}
                  max={barMax}
                  label={fPct(loc.participacao_pct, 1)}
                />

                {/* Receita bruta */}
                <span style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  fontVariantNumeric: 'tabular-nums',
                  textAlign: 'right',
                }}>
                  {fCurrency(loc.receita_bruta)}
                </span>

                {/* Métrica secundária (opcional) */}
                {secondaryMetric && (
                  <span style={{
                    fontSize: '12px',
                    color: 'hsl(var(--muted-foreground))',
                    fontVariantNumeric: 'tabular-nums',
                    textAlign: 'right',
                  }}>
                    {secondaryMetric.format(loc[secondaryMetric.key] as number)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  )
}
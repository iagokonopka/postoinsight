// Página de análise de produto individual — /produto/:id
// Acessível via Drawer Nível 3 (botão "Ver análise completa")
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

import { useProdutoEvolucao, useProdutoPorLocation } from '@/hooks/useVendas'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, BarCell,
} from '@/components/ui/Table'
import { fCurrency, fInt, fPct, fDayMonth, fMonthShort } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── Segment control de granularidade ────────────────────────────────────────

type Gran = 'day' | 'week' | 'month'
const GRAN_OPTIONS: { value: Gran; label: string }[] = [
  { value: 'day',   label: 'Dia' },
  { value: 'week',  label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

function GranControl({ value, onChange }: { value: Gran; onChange: (v: Gran) => void }) {
  return (
    <div style={{ display: 'inline-flex', padding: '3px', background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px' }}>
      {GRAN_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            height: '28px', padding: '0 12px', border: 'none',
            background: value === opt.value ? 'hsl(var(--card))' : 'transparent',
            fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
            color: value === opt.value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
            borderRadius: '5px', cursor: 'pointer',
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

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ProdutoPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [gran, setGran] = useState<Gran>('day')

  const sourceProdutoId = id ? decodeURIComponent(id) : null

  const { data: evoData,  isLoading: loadingEvo  } = useProdutoEvolucao(sourceProdutoId, gran)
  const { data: locData,  isLoading: loadingLoc  } = useProdutoPorLocation(sourceProdutoId)

  const produto = evoData?.product ?? locData?.product
  const serie   = evoData?.series ?? []

  // ── KPIs totalizados da série ──
  const totReceita   = serie.reduce((s, p) => s + p.gross_revenue, 0)
  const totMargem    = serie.reduce((s, p) => s + p.gross_margin, 0)
  const totQtd       = serie.reduce((s, p) => s + p.quantity, 0)
  const margemPct    = totReceita > 0 ? (totMargem / totReceita) * 100 : 0
  const ticketMedio  = totQtd > 0 ? totReceita / totQtd : 0

  // ── Dados do gráfico ──
  const chartData = serie.map(p => ({
    label:       gran === 'month'
                   ? fMonthShort(p.period)
                   : p.period.length === 10 ? fDayMonth(p.period) : p.period,
    receita:     p.gross_revenue,
    margemBruta: p.gross_margin,
    margemPct:   p.margin_pct,
  }))

  // ── Locations ──
  const locations = locData?.locations ?? []
  const locMax    = locations[0]?.gross_revenue ?? 1

  // ── Breadcrumb / título ──
  const nomeGrupo    = evoData?.product.group    ?? null
  const nomeSubgrupo = evoData?.product.subgroup ?? null
  const nomeProduto  = produto?.name ?? sourceProdutoId ?? '—'

  const breadcrumb = [nomeGrupo, nomeSubgrupo, nomeProduto].filter(Boolean).join(' › ')

  return (
    <Page>
      {/* PageHeader com botão voltar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          {/* Botão voltar */}
          <button
            onClick={() => navigate(-1)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'hsl(var(--muted-foreground))',
              padding: '0 0 8px 0', fontFamily: 'inherit',
            }}
          >
            <ArrowLeft size={13} /> Voltar
          </button>
          {/* Breadcrumb */}
          {(nomeGrupo || nomeSubgrupo) && (
            <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
              {breadcrumb}
            </p>
          )}
          <h1 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', color: 'hsl(var(--foreground))', lineHeight: 1.2 }}>
            {nomeProduto}
          </h1>
          <p style={{ fontSize: '13px', color: 'hsl(var(--muted-foreground))', marginTop: '3px' }}>
            Análise de produto individual — período selecionado.
          </p>
        </div>
        <div style={{ paddingTop: '24px' }}>
          <GranControl value={gran} onChange={setGran} />
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Receita Total"
          value={loadingEvo ? '—' : fCurrency(totReceita)}
          sparkData={serie.map(p => p.gross_revenue)}
          sparkColor={CHART_COLORS.conveniencia}
        />
        <KpiCard
          label="Margem %"
          value={loadingEvo ? '—' : fPct(margemPct, 1)}
          sparkData={serie.map(p => p.margin_pct)}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Qtd Vendida"
          value={loadingEvo ? '—' : fInt(totQtd)}
          sparkData={serie.map(p => p.quantity)}
          sparkColor={CHART_COLORS.combustivel}
        />
        <KpiCard
          label="Ticket Médio"
          value={loadingEvo ? '—' : fCurrency(ticketMedio)}
          sparkData={[]}
          sparkColor={CHART_COLORS.lubrificantes}
        />
      </KpiGrid>

      {/* Gráfico evolução + Tabela locations */}
      <Row variant="3-2">
        <Card>
          <CardHeader title="Evolução de Receita & Margem" />
          <CardBody>
            <ChartBox>
              {loadingEvo
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhuma venda do produto no período." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      tooltipFormatter={fCurrency}
                      series={[
                        { key: 'receita',     label: 'Receita',      color: CHART_COLORS.conveniencia, type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,          type: 'area', yAxisId: 'left' },
                        { key: 'margemPct',   label: 'Margem %',     color: CHART_COLORS.combustivel,  type: 'line', dashed: true, yAxisId: 'right', hide: true },
                      ]}
                      showRightAxis
                      yRightFormatter={v => v.toFixed(1) + '%'}
                    />
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Vendas por Unidade" description="Onde o produto mais vende" />
          {loadingLoc
            ? <CardBody><LoadingBox /></CardBody>
            : locations.length === 0
              ? <CardBody><EmptyState title="Sem dados" /></CardBody>
              : <TableWrap>
                  <Table>
                    <Thead>
                      <Th first>Unidade</Th>
                      <Th>Participação</Th>
                      <Th right>Receita</Th>
                      <Th right last>Margem %</Th>
                    </Thead>
                    <Tbody>
                      {locations.map(loc => (
                        <Tr key={loc.location_id}>
                          <Td first style={{ fontWeight: 500 }}>{loc.location_name}</Td>
                          <Td style={{ minWidth: '120px' }}>
                            <BarCell
                              value={loc.gross_revenue}
                              max={locMax}
                              label={fPct(loc.share_pct, 1)}
                            />
                          </Td>
                          <Td right>{fCurrency(loc.gross_revenue)}</Td>
                          <Td right last>
                            <b style={{ color: loc.margin_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                              {fPct(loc.margin_pct, 1)}
                            </b>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableWrap>
          }
        </Card>
      </Row>
    </Page>
  )
}

function LoadingBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
      <Spinner size="lg" />
    </div>
  )
}
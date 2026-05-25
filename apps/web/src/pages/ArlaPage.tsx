import { useArlaResumo, useArlaEvolucao } from '@/hooks/useArla'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid} from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { CHART_COLORS } from '@/lib/chart-colors'
import { fCurrency, fInt, fPct, fLiters, fDayMonth } from '@/lib/format'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, Tfoot, TfootTd,
} from '@/components/ui/Table'

export default function ArlaPage() {
  const { data: resumo, isLoading: loadingR } = useArlaResumo()
  const { data: evo,    isLoading: loadingE } = useArlaEvolucao('dia')

  const t = resumo?.totais
  const produtos = resumo?.por_produto ?? []

  // Chart data
  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    volume:      p.volume_litros,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  // Spark from evolução
  const sparkVol = evo?.serie.map(p => p.volume_litros) ?? []
  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

  return (
    <Page>
      <PageHeader
        title="Arla 32"
        subtitle="Volume, receita e margem do fluido Arla 32."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Volume Total"
          value={t ? fLiters(t.volume_litros) : '—'}
          sparkData={sparkVol}
          sparkColor={CHART_COLORS.arla}
        />
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.arla}
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.margem_bruta) : '—'}
          sparkData={sparkMg}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(t.margem_pct, 2) : '—'}
          deltaPP
          sparkData={evo?.serie.map(p => p.margem_pct) ?? []}
          sparkColor={CHART_COLORS.arla}
        />
      </KpiGrid>

      {/* Evolução */}
      <Card>
        <CardHeader title="Evolução — Volume & Receita" description="Arla 32 · período selecionado" />
        <CardBody>
          <ChartBox>
            {loadingE
              ? <LoadingBox />
              : chartData.length === 0
                ? <EmptyState title="Sem dados" description="Nenhum registro de Arla 32 no período." />
                : <LineAreaChart
                    data={chartData}
                    xKey="label"
                    series={[
                      { key: 'receita',     label: 'Receita',      color: CHART_COLORS.arla, type: 'area', yAxisId: 'left' },
                      { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,  type: 'area', yAxisId: 'left' },
                    ]}
                    tooltipFormatter={fCurrency}
                  />
            }
          </ChartBox>
        </CardBody>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader title="Breakdown por produto" />
        {loadingR
          ? <CardBody><LoadingBox /></CardBody>
          : produtos.length === 0
            ? <CardBody><EmptyState title="Sem dados" description="Nenhum produto Arla 32 no período." /></CardBody>
            : <TableWrap>
                <Table>
                  <Thead>
                    <Th first>Produto</Th>
                    <Th right>Volume (L)</Th>
                    <Th right>Part.%</Th>
                    <Th right>Receita</Th>
                    <Th right>CMV</Th>
                    <Th right>Margem Bruta</Th>
                    <Th right>Margem %</Th>
                    <Th right>Preço/L</Th>
                    <Th right last>Custo/L</Th>
                  </Thead>
                  <Tbody>
                    {produtos.map(p => (
                      <Tr key={p.grupo_id}>
                        <Td first style={{ fontWeight: 500 }}>
                          {p.grupo_descricao ?? `Produto ${p.grupo_id}`}
                        </Td>
                        <Td right>{fInt(p.volume_litros)}</Td>
                        <Td right>{fPct(p.participacao_volume_pct, 1)}</Td>
                        <Td right>{fCurrency(p.receita_bruta)}</Td>
                        <Td right>{fCurrency(p.cmv)}</Td>
                        <Td right>{fCurrency(p.margem_bruta)}</Td>
                        <Td right>
                          <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                            {fPct(p.margem_pct, 1)}
                          </b>
                        </Td>
                        <Td right>
                          <span className="mono">
                            {p.preco_medio_litro != null ? p.preco_medio_litro.toFixed(2).replace('.', ',') : '—'}
                          </span>
                        </Td>
                        <Td right last>
                          <span className="mono">
                            {p.custo_medio_litro != null ? p.custo_medio_litro.toFixed(2).replace('.', ',') : '—'}
                          </span>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd right>{t ? fInt(t.volume_litros) : '—'}</TfootTd>
                    <TfootTd right>100%</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.receita_bruta) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cmv) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.margem_bruta) : '—'}</TfootTd>
                    <TfootTd right><b>{t ? fPct(t.margem_pct, 1) : '—'}</b></TfootTd>
                    <TfootTd right last colSpan={2} />
                  </Tfoot>
                </Table>
              </TableWrap>
        }
      </Card>
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

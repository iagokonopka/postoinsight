import { useLubrificantesResumo, useLubrificantesEvolucao } from '@/hooks/useLubrificantes'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { CHART_COLORS } from '@/lib/chart-colors'
import { fCurrency, fInt, fPct, fDayMonth } from '@/lib/format'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, Tfoot, TfootTd, BarCell,
} from '@/components/ui/Table'

export default function LubrificantesPage() {
  const { data: resumo, isLoading: loadingR } = useLubrificantesResumo()
  const { data: evo,    isLoading: loadingE } = useLubrificantesEvolucao('dia')

  const t       = resumo?.totais
  const grupos  = resumo?.por_grupo ?? []
  const recMax  = grupos[0]?.receita_bruta ?? 1

  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

  return (
    <Page>
      <PageHeader
        title="Lubrificantes"
        subtitle="Receita, margem e grupos de lubrificantes — período selecionado."
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={CHART_COLORS.lubrificantes}
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cmv) : '—'}
          sparkColor={CHART_COLORS.neg}
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
          sparkColor={CHART_COLORS.lubrificantes}
        />
      </KpiGrid>

      {/* Evolução */}
      <Card>
        <CardHeader title="Evolução — Receita & Margem" description="Lubrificantes · período selecionado" />
        <CardBody>
          <ChartBox>
            {loadingE
              ? <LoadingBox />
              : chartData.length === 0
                ? <EmptyState title="Sem dados" description="Nenhum registro de lubrificantes no período." />
                : <LineAreaChart
                    data={chartData}
                    xKey="label"
                    series={[
                      { key: 'receita',     label: 'Receita',      color: CHART_COLORS.lubrificantes, type: 'area', yAxisId: 'left' },
                      { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,           type: 'area', yAxisId: 'left' },
                    ]}
                    tooltipFormatter={fCurrency}
                  />
            }
          </ChartBox>
        </CardBody>
      </Card>

      {/* Tabela grupos */}
      <Card>
        <CardHeader title="Breakdown por grupo" />
        {loadingR
          ? <CardBody><LoadingBox /></CardBody>
          : grupos.length === 0
            ? <CardBody><EmptyState title="Sem dados" description="Nenhum grupo de lubrificantes no período." /></CardBody>
            : <TableWrap>
                <Table>
                  <Thead>
                    <Th first>Grupo</Th>
                    <Th>Participação</Th>
                    <Th right>Qtd</Th>
                    <Th right>Receita</Th>
                    <Th right>CMV</Th>
                    <Th right>Margem Bruta</Th>
                    <Th right last>Margem %</Th>
                  </Thead>
                  <Tbody>
                    {grupos.map(g => (
                      <Tr key={g.grupo_id}>
                        <Td first style={{ fontWeight: 500 }}>
                          {g.grupo_descricao ?? `Grupo ${g.grupo_id}`}
                        </Td>
                        <Td style={{ minWidth: '140px' }}>
                          <BarCell
                            value={g.receita_bruta}
                            max={recMax}
                            label={fPct(g.participacao_pct, 1)}
                          />
                        </Td>
                        <Td right>{fInt(g.qtd_itens)}</Td>
                        <Td right>{fCurrency(g.receita_bruta)}</Td>
                        <Td right>{fCurrency(g.cmv)}</Td>
                        <Td right>{fCurrency(g.margem_bruta)}</Td>
                        <Td right last>
                          <b style={{ color: g.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                            {fPct(g.margem_pct, 1)}
                          </b>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd />
                    <TfootTd right>{t ? fInt(t.qtd_itens) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.receita_bruta) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.cmv) : '—'}</TfootTd>
                    <TfootTd right>{t ? fCurrency(t.margem_bruta) : '—'}</TfootTd>
                    <TfootTd right last><b>{t ? fPct(t.margem_pct, 1) : '—'}</b></TfootTd>
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

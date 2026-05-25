import { useState } from 'react'
import { Download, ChevronRight, ArrowLeft } from 'lucide-react'

import { useVendasResumo, useVendasEvolucao, useTopProdutos, usePadraoSemanal, useDrillSubgrupos, useDrillProdutos } from '@/hooks/useVendas'
import { useApp } from '@/context/AppContext'

import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Drawer, DrawerRow } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import { Heatmap } from '@/components/charts/Heatmap'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, Tfoot, TfootTd,
  SegCell, BarCell, RankCell,
} from '@/components/ui/Table'
import { fCurrency, fInt, fPct, fDayMonth, fMonthShort } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── Segment config ───────────────────────────────────────────────────────────

const SEG_CONFIG = {
  combustivel:   { label: 'Combustível',  color: CHART_COLORS.combustivel },
  lubrificantes: { label: 'Lubrificantes', color: CHART_COLORS.lubrificantes },
  servicos:      { label: 'Serviços',     color: CHART_COLORS.servicos },
  conveniencia:  { label: 'Conveniência', color: CHART_COLORS.conveniencia },
} as const

// ─── Heatmap placeholder data (7×4) while real endpoint isn't available ───────

// heatmap data via usePadraoSemanal

// ─── Main page ────────────────────────────────────────────────────────────────

type TopItemDrill = { grupo_id: number; nome: string; segmento: string }

export default function VisaoGeralPage() {
  const { period } = useApp()
  const [topSort, setTopSort] = useState<'receita' | 'margem'>('receita')
  const [drawerSeg, setDrawerSeg] = useState<string | null>(null)
  // Drill do Top 10: grupo → subgrupos → produtos
  const [drillGrupo, setDrillGrupo] = useState<TopItemDrill | null>(null)
  const [drillSubgrupoAberto, setDrillSubgrupoAberto] = useState<{ id: number; descricao: string } | null>(null)

  const { data: resumo, isLoading: loadingResumo } = useVendasResumo()
  const { data: evolucao, isLoading: loadingEvo } = useVendasEvolucao(
    period === 'hoje' ? 'dia' : period === 'semana' ? 'dia' : 'dia'
  )
  const { data: topData, isLoading: loadingTop } = useTopProdutos(10)
  const { data: heatmapData, isLoading: loadingHeatmap } = usePadraoSemanal()
  const { data: drillSubs, isLoading: loadingDrillSubs } = useDrillSubgrupos(
    drillGrupo?.grupo_id ?? null,
    drillGrupo?.segmento ?? 'conveniencia',
  )
  const { data: drillProds, isLoading: loadingDrillProds } = useDrillProdutos(
    drillSubgrupoAberto?.id ?? null,
  )

  // ── Spark data from evolucao serie ──
  const sparkReceita    = evolucao?.serie.map(p => p.receita_bruta) ?? []
  const sparkMargemBruta = evolucao?.serie.map(p => p.margem_bruta) ?? []

  // ── KPI values ──
  const t = resumo?.totais
  const margemPct = t ? (t.margem_bruta / Math.max(t.receita_liquida, 1)) * 100 : 0

  // ── Evolution chart data ──
  const chartData = (evolucao?.serie ?? []).map(p => ({
    label: p.periodo.length === 10 ? fDayMonth(p.periodo) : fMonthShort(p.periodo),
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
    margemPct:   p.margem_pct,
  }))

  // ── Donut data ──
  const donutData: DonutSlice[] = (resumo?.por_segmento ?? []).map(s => ({
    label: SEG_CONFIG[s.segmento as keyof typeof SEG_CONFIG]?.label ?? s.segmento,
    value: s.receita_bruta,
    color: SEG_CONFIG[s.segmento as keyof typeof SEG_CONFIG]?.color ?? '#999',
  }))
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)

  // ── Top produtos — sort ──
  const topProdutos = [...(topData?.produtos ?? [])].sort((a, b) =>
    topSort === 'receita' ? b.receita - a.receita : b.margem_pct - a.margem_pct
  )
  const topMax = topProdutos[0]?.receita ?? 1

  // ── Breakdown segmentos ──
  const segmentos = resumo?.por_segmento ?? []
  const totalReceita = segmentos.reduce((s, r) => s + r.receita_bruta, 0)

  // ── Drawer data ──
  const drawerData = drawerSeg ? segmentos.find(s => s.segmento === drawerSeg) : null
  const drawerCfg  = drawerSeg ? SEG_CONFIG[drawerSeg as keyof typeof SEG_CONFIG] : null

  return (
    <Page>
      {/* Page Header */}
      <PageHeader
        title="Visão Geral"
        subtitle="Consolidado da rede — vendas, margens e padrão de demanda."
        actions={
          <Button variant="outline" size="sm">
            <Download size={12} strokeWidth={1.8} />
            Exportar
          </Button>
        }
      />

      {/* KPIs */}
      <KpiGrid cols={5}>
        <KpiCard
          label="Receita Bruta"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkReceita}
          sparkColor={CHART_COLORS.combustivel}
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cmv) : '—'}
          sparkData={sparkMargemBruta}
          sparkColor={CHART_COLORS.neg}
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.margem_bruta) : '—'}
          sparkData={sparkMargemBruta}
          sparkColor={CHART_COLORS.pos}
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(margemPct, 2) : '—'}
          sparkData={evolucao?.serie.map(p => p.margem_pct) ?? []}
          sparkColor={CHART_COLORS.combustivel}
        />
        <KpiCard
          label="Itens Vendidos"
          value={t ? fInt(t.qtd_itens) : '—'}
          sparkData={sparkReceita}
          sparkColor={CHART_COLORS.lubrificantes}
        />
      </KpiGrid>

      {/* Evolução + Donut */}
      <Row variant="3-2">
        <Card>
          <CardHeader title="Evolução de Receita & Margem" />
          <CardBody>
            <ChartBox>
              {loadingEvo
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhuma venda no período selecionado." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      tooltipFormatter={fCurrency}
                      series={[
                        { key: 'receita',     label: 'Receita Bruta', color: CHART_COLORS.combustivel, type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta',  color: CHART_COLORS.pos,         type: 'area', yAxisId: 'left' },
                        { key: 'margemPct',   label: 'Margem %',      color: CHART_COLORS.conveniencia, type: 'line', dashed: true, yAxisId: 'right', hide: true },
                      ]}
                      showRightAxis
                      yRightFormatter={v => v.toFixed(1) + '%'}
                    />
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mix por Segmento" />
          <CardBody>
            {loadingResumo
              ? <LoadingBox />
              : <DonutChart
                  data={donutData}
                  centerLabel="Total"
                  centerValue={fCurrency(donutTotal)}
                  tooltipFormatter={(v) => fCurrency(v)}
                />
            }
          </CardBody>
        </Card>
      </Row>

      {/* Breakdown por segmento */}
      <Card>
        <CardHeader title="Breakdown por Segmento" />
        {loadingResumo
          ? <CardBody><LoadingBox /></CardBody>
          : <TableWrap>
              <Table>
                <Thead>
                  <Th first>Segmento</Th>
                  <Th>Peso na receita</Th>
                  <Th right>Receita</Th>
                  <Th right>CMV</Th>
                  <Th right>Margem Bruta</Th>
                  <Th right last>Margem %</Th>
                </Thead>
                <Tbody>
                  {segmentos.map(s => {
                    const cfg = SEG_CONFIG[s.segmento as keyof typeof SEG_CONFIG]
                    return (
                      <Tr key={s.segmento} clickable onClick={() => setDrawerSeg(s.segmento)}>
                        <Td first>
                          <SegCell color={cfg?.color ?? '#999'}>{cfg?.label ?? s.segmento}</SegCell>
                        </Td>
                        <Td>
                          <BarCell
                            value={s.receita_bruta}
                            max={totalReceita}
                            label={fPct(s.participacao_pct)}
                          />
                        </Td>
                        <Td right>{fCurrency(s.receita_bruta)}</Td>
                        <Td right>{fCurrency(s.cmv)}</Td>
                        <Td right>{fCurrency(s.margem_bruta)}</Td>
                        <Td right last>
                          <b style={{ color: s.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                            {fPct(s.margem_pct, 1)}
                          </b>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
                <Tfoot>
                  <TfootTd first>TOTAL</TfootTd>
                  <TfootTd />
                  <TfootTd right>{fCurrency(t?.receita_bruta ?? 0)}</TfootTd>
                  <TfootTd right>{fCurrency(t?.cmv ?? 0)}</TfootTd>
                  <TfootTd right>{fCurrency(t?.margem_bruta ?? 0)}</TfootTd>
                  <TfootTd right last>
                    <b>{fPct(margemPct, 1)}</b>
                  </TfootTd>
                </Tfoot>
              </Table>
            </TableWrap>
        }
      </Card>

      {/* Top 10 + Heatmap */}
      <Row variant="2-1">
        <Card>
          <CardHeader
            title="Top 10 Produtos por Receita"
            action={
              <div style={{ display: 'inline-flex', padding: '3px', background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px' }}>
                {(['receita', 'margem'] as const).map(opt => (
                  <button
                    key={opt}
                    onClick={() => setTopSort(opt)}
                    style={{
                      height: '28px', padding: '0 12px', border: 'none',
                      background: topSort === opt ? 'hsl(var(--card))' : 'transparent',
                      fontFamily: 'inherit', fontSize: '12px', fontWeight: 500,
                      color: topSort === opt ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                      borderRadius: '5px', cursor: 'pointer',
                      boxShadow: topSort === opt ? 'var(--shadow-sm)' : 'none',
                      transition: 'background 0.12s, color 0.12s',
                    }}
                  >
                    {opt === 'receita' ? 'Receita' : 'Margem %'}
                  </button>
                ))}
              </div>
            }
          />
          {loadingTop
            ? <CardBody><LoadingBox /></CardBody>
            : <TableWrap>
                <Table>
                  <Thead>
                    <Th first>#</Th>
                    <Th>Produto</Th>
                    <Th>Categoria</Th>
                    <Th>Peso</Th>
                    <Th right>Receita</Th>
                    <Th right>Margem %</Th>
                    <Th right last>Qtd</Th>
                  </Thead>
                  <Tbody>
                    {topProdutos.map((p, i) => (
                      <Tr
                        key={p.grupo_id}
                        clickable
                        onClick={() => setDrillGrupo({ grupo_id: p.grupo_id, nome: p.produto, segmento: p.categoria })}
                      >
                        <Td first><RankCell rank={i + 1} /></Td>
                        <Td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ fontWeight: 500 }}>{p.produto}</div>
                            <ChevronRight size={13} color="hsl(var(--muted-foreground))" />
                          </div>
                        </Td>
                        <Td>
                          <Badge variant="soft">{
                            SEG_CONFIG[p.categoria as keyof typeof SEG_CONFIG]?.label ?? p.categoria
                          }</Badge>
                        </Td>
                        <Td style={{ minWidth: '120px' }}>
                          <BarCell
                            value={topSort === 'receita' ? p.receita : p.margem_pct}
                            max={topSort === 'receita' ? topMax : 100}
                          />
                        </Td>
                        <Td right>{fCurrency(p.receita)}</Td>
                        <Td right>
                          <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                            {fPct(p.margem_pct, 1)}
                          </b>
                        </Td>
                        <Td right last>{fInt(p.qtd)}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableWrap>
          }
        </Card>

        <Card>
          <CardHeader title="Padrão Semanal" description="Receita por dia da semana" />
          <CardBody>
            {loadingHeatmap
              ? <LoadingBox />
              : <Heatmap data={heatmapData?.data ?? Array.from({ length: 7 }, () => Array(4).fill(0))} />
            }
          </CardBody>
        </Card>
      </Row>

      {/* Drill-down Drawer */}
      <Drawer
        open={drawerSeg !== null}
        onClose={() => setDrawerSeg(null)}
        title={
          drawerCfg ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: drawerCfg.color, flexShrink: 0 }} />
              {drawerCfg.label}
            </div>
          ) : 'Detalhes'
        }
      >
        {drawerData && drawerCfg && (
          <div>
            {/* Summary boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius)', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>Receita</div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))' }}>{fCurrency(drawerData.receita_bruta)}</div>
              </div>
              <div style={{ background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius)', padding: '12px' }}>
                <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>Margem %</div>
                <div style={{ fontSize: '18px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: drawerData.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(drawerData.margem_pct, 1)}</div>
              </div>
            </div>

            {/* Breakdown rows */}
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
              Detalhamento
            </div>
            <DrawerRow label="Receita Bruta"   value={fCurrency(drawerData.receita_bruta)} />
            <DrawerRow label="Receita Líquida" value={fCurrency(drawerData.receita_liquida)} />
            <DrawerRow label="CMV"             value={fCurrency(drawerData.cmv)} />
            <DrawerRow label="Margem Bruta"    value={fCurrency(drawerData.margem_bruta)} />
            <DrawerRow label="Margem %"        value={fPct(drawerData.margem_pct, 2)} last />
          </div>
        )}
      </Drawer>

      {/* ── Drill Top 10 — Nível 2: Subgrupos do grupo ────────────────────── */}
      <Drawer
        open={drillGrupo !== null && drillSubgrupoAberto === null}
        onClose={() => setDrillGrupo(null)}
        title={
          drillGrupo ? (
            <div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
                {SEG_CONFIG[drillGrupo.segmento as keyof typeof SEG_CONFIG]?.label ?? drillGrupo.segmento}
              </div>
              <div>{drillGrupo.nome}</div>
            </div>
          ) : 'Subgrupos'
        }
      >
        {drillGrupo && (
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
              SUBGRUPOS ({loadingDrillSubs ? '…' : (drillSubs?.subgrupos.length ?? 0)})
            </div>
            {loadingDrillSubs
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : (drillSubs?.subgrupos ?? []).map((s, i) => (
                  <div
                    key={s.subgrupo_id}
                    style={{ marginBottom: '14px', cursor: 'pointer' }}
                    onClick={() => setDrillSubgrupoAberto({ id: s.subgrupo_id, descricao: s.subgrupo_descricao })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                        {s.subgrupo_descricao}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{fCurrency(s.receita_bruta)}</span>
                        <ChevronRight size={14} color="hsl(var(--muted-foreground))" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                      <div style={{ flex: 1, height: '4px', background: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(s.participacao_pct, 100)}%`, height: '100%', background: SEG_CONFIG[drillGrupo.segmento as keyof typeof SEG_CONFIG]?.color ?? 'hsl(var(--primary))', borderRadius: '999px' }} />
                      </div>
                      <span style={{ minWidth: '38px', textAlign: 'right' }}>{fPct(s.participacao_pct, 1)}</span>
                      <span style={{ minWidth: '50px', textAlign: 'right', color: s.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))', fontWeight: 600 }}>
                        {fPct(s.margem_pct, 1)}
                      </span>
                    </div>
                    {i < (drillSubs?.subgrupos.length ?? 0) - 1 && (
                      <div style={{ borderBottom: '1px solid hsl(var(--border))', marginTop: '14px' }} />
                    )}
                  </div>
                ))
            }
          </div>
        )}
      </Drawer>

      {/* ── Drill Top 10 — Nível 3: Produtos do subgrupo ──────────────────── */}
      <Drawer
        open={drillSubgrupoAberto !== null}
        onClose={() => setDrillSubgrupoAberto(null)}
        title={
          drillSubgrupoAberto ? (
            <div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
                {drillGrupo?.nome}
              </div>
              <div>{drillSubgrupoAberto.descricao}</div>
            </div>
          ) : 'Produtos'
        }
      >
        {drillSubgrupoAberto && (
          <div>
            <button
              onClick={() => setDrillSubgrupoAberto(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                padding: '0 0 16px 0', fontFamily: 'inherit',
              }}
            >
              <ArrowLeft size={13} /> Voltar
            </button>

            <div style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '12px' }}>
              PRODUTOS ({loadingDrillProds ? '…' : (drillProds?.produtos.length ?? 0)})
            </div>

            {loadingDrillProds
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : (drillProds?.produtos ?? []).map((p, i) => (
                  <div key={p.source_produto_id} style={{ marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', flex: 1, marginRight: '8px' }}>
                        {p.descricao_produto}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                        {fCurrency(p.receita_bruta)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                      <span>Qtd: <b style={{ color: 'hsl(var(--foreground))' }}>{fInt(p.qtd_venda)}</b></span>
                      <span>Margem: <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(p.margem_pct, 1)}</b></span>
                      <span>Part.: {fPct(p.participacao_pct, 1)}</span>
                    </div>
                    {i < (drillProds?.produtos.length ?? 0) - 1 && (
                      <div style={{ borderBottom: '1px solid hsl(var(--border))', marginTop: '14px' }} />
                    )}
                  </div>
                ))
            }
          </div>
        )}
      </Drawer>
    </Page>
  )
}

// ─── Loading box ──────────────────────────────────────────────────────────────

function LoadingBox() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '120px' }}>
      <Spinner size="lg" />
    </div>
  )
}

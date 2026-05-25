import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft } from 'lucide-react'
import { useConvResumo, useConvEvolucao, useConvCategorias, useConvGrupos } from '@/hooks/useConveniencia'
import { useDrillSubgrupos, useDrillProdutos } from '@/hooks/useVendas'
import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Drawer } from '@/components/ui/Drawer'
import { PageHeader } from '@/components/layout/PageHeader'
import { LineAreaChart } from '@/components/charts/LineAreaChart'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import { ScatterQuadrants, type ScatterPoint } from '@/components/charts/ScatterQuadrants'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, Tfoot, TfootTd, SegCell, BarCell,
} from '@/components/ui/Table'
import { fCurrency, fInt, fPct, fDayMonth } from '@/lib/format'
import { CHART_COLORS } from '@/lib/chart-colors'

// ─── Paleta de categorias ─────────────────────────────────────────────────────

const CAT_COLORS = [
  CHART_COLORS.conveniencia,
  CHART_COLORS.s2,
  CHART_COLORS.lubrificantes,
  CHART_COLORS.arla,
  CHART_COLORS.servicos,
  CHART_COLORS.s6,
  '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
]

// ─── Segment control ─────────────────────────────────────────────────────────

type ConvView = 'conveniencia' | 'servicos' | 'lubrificantes'

const VIEW_OPTIONS = [
  { value: 'conveniencia'  as ConvView, label: 'Conveniência' },
  { value: 'servicos'      as ConvView, label: 'Serviços' },
  { value: 'lubrificantes' as ConvView, label: 'Lubrificantes' },
]

const VIEW_COLOR: Record<ConvView, string> = {
  conveniencia:  CHART_COLORS.conveniencia,
  servicos:      CHART_COLORS.servicos,
  lubrificantes: CHART_COLORS.lubrificantes,
}

const VIEW_LABEL: Record<ConvView, string> = {
  conveniencia:  'Receita Conveniência',
  servicos:      'Receita Serviços',
  lubrificantes: 'Receita Lubrificantes',
}

function SegControl({ value, onChange }: { value: ConvView; onChange: (v: ConvView) => void }) {
  return (
    <div style={{ display: 'inline-flex', padding: '3px', background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px' }}>
      {VIEW_OPTIONS.map(opt => (
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

// ─── Tipos de estado dos drawers ─────────────────────────────────────────────

type DrawerCat     = { codigo: string; descricao: string; color: string }
type DrawerGrupo   = { grupo_id: number; grupo_descricao: string; segmento: string; color: string }
type DrawerProduto = {
  source_produto_id: string
  descricao_produto: string
  receita_bruta: number
  margem_pct: number
  qtd_venda: number
  participacao_pct: number
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function ConvenienciaPage() {
  const navigate = useNavigate()
  const [view, setView] = useState<ConvView>('conveniencia')

  // Nível 1: categoria → grupos
  const [drawerCat, setDrawerCat] = useState<DrawerCat | null>(null)
  // Nível 2: grupo → subgrupos
  const [drawerGrupo, setDrawerGrupo] = useState<DrawerGrupo | null>(null)
  // Nível 3: produto selecionado
  const [drawerProduto, setDrawerProduto] = useState<DrawerProduto | null>(null)
  // Subgrupo aberto no nível 2 para buscar produtos
  const [subgrupoAberto, setSubgrupoAberto] = useState<{ id: number; descricao: string } | null>(null)

  const accentColor = VIEW_COLOR[view]

  const { data: resumo, isLoading: _loadingR } = useConvResumo()
  const { data: evo,    isLoading: loadingE } = useConvEvolucao(view, 'dia')
  const { data: cats,   isLoading: loadingC } = useConvCategorias(view)
  const { data: grupos, isLoading: loadingG } = useConvGrupos(drawerCat?.codigo ?? null)
  const { data: subgrupos, isLoading: loadingSub } = useDrillSubgrupos(
    drawerGrupo?.grupo_id ?? null,
    drawerGrupo?.segmento ?? view,
  )
  const { data: produtosData, isLoading: loadingProd } = useDrillProdutos(
    subgrupoAberto?.id ?? null,
  )

  const t = resumo?.totais
  const categorias = cats?.categorias ?? []
  const recMax = categorias[0]?.receita_bruta ?? 1

  // ── Evolution chart ──
  const chartData = (evo?.serie ?? []).map(p => ({
    label:       p.periodo.length === 10 ? fDayMonth(p.periodo) : p.periodo,
    receita:     p.receita_bruta,
    margemBruta: p.margem_bruta,
  }))

  // ── Donut ──
  const donutData: DonutSlice[] = categorias.slice(0, 8).map((c, i) => ({
    label: c.categoria_descricao ?? c.categoria_codigo,
    value: c.receita_bruta,
    color: CAT_COLORS[i % CAT_COLORS.length],
  }))

  // ── Scatter data ──
  const scatterData: ScatterPoint[] = categorias.map((c, i) => ({
    name:    c.categoria_descricao ?? c.categoria_codigo,
    qtd:     c.qtd_total,
    margem:  c.margem_pct,
    receita: c.receita_bruta,
    color:   CAT_COLORS[i % CAT_COLORS.length],
  }))

  const sparkRec = evo?.serie.map(p => p.receita_bruta) ?? []
  const sparkMg  = evo?.serie.map(p => p.margem_bruta) ?? []

  return (
    <Page>
      <PageHeader
        title="Conveniência & Serviços"
        subtitle="Loja, lubrificantes e serviços — período selecionado."
        actions={<SegControl value={view} onChange={setView} />}
      />

      {/* KPIs */}
      <KpiGrid cols={4}>
        <KpiCard
          label={VIEW_LABEL[view]}
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkData={sparkRec}
          sparkColor={accentColor}
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
          sparkData={[]}
          sparkColor={accentColor}
        />
        <KpiCard
          label="Ticket Médio"
          value={t?.ticket_medio != null ? fCurrency(t.ticket_medio) : '—'}
          sparkColor={accentColor}
        />
      </KpiGrid>

      {/* Evolução + Donut */}
      <Row variant="3-2">
        <Card>
          <CardHeader title="Receita × Margem Bruta" />
          <CardBody>
            <ChartBox>
              {loadingE
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhuma venda no período." />
                  : <LineAreaChart
                      data={chartData}
                      xKey="label"
                      series={[
                        { key: 'receita',     label: 'Receita',      color: accentColor,       type: 'area', yAxisId: 'left' },
                        { key: 'margemBruta', label: 'Margem Bruta', color: CHART_COLORS.pos,  type: 'area', yAxisId: 'left' },
                      ]}
                      tooltipFormatter={fCurrency}
                    />
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mix da Loja" />
          <CardBody>
            {loadingC
              ? <LoadingBox />
              : <DonutChart
                  data={donutData}
                  centerLabel="Total"
                  centerValue={fCurrency(donutData.reduce((s, d) => s + d.value, 0))}
                  tooltipFormatter={fCurrency}
                />
            }
          </CardBody>
        </Card>
      </Row>

      {/* Scatter */}
      <Card>
        <CardHeader
          title="Matriz de Categorias"
          description="Quadrantes: Qtd vendida × Margem % — tamanho da bolha = receita"
        />
        <CardBody>
          <ChartBox size="tall">
            {loadingC
              ? <LoadingBox />
              : scatterData.length === 0
                ? <EmptyState title="Sem dados" description="Nenhuma categoria no período." />
                : <ScatterQuadrants data={scatterData} />
            }
          </ChartBox>
        </CardBody>
      </Card>

      {/* Tabela categorias */}
      <Card>
        <CardHeader title="Breakdown por categoria" />
        {loadingC
          ? <CardBody><LoadingBox /></CardBody>
          : categorias.length === 0
            ? <CardBody><EmptyState title="Sem dados" /></CardBody>
            : <TableWrap>
                <Table>
                  <Thead>
                    <Th first>Categoria</Th>
                    <Th>Peso</Th>
                    <Th right>Qtd</Th>
                    <Th right>Receita</Th>
                    <Th right>CMV</Th>
                    <Th right>Margem Bruta</Th>
                    <Th right last>Margem %</Th>
                  </Thead>
                  <Tbody>
                    {categorias.map((c, i) => {
                      const color = CAT_COLORS[i % CAT_COLORS.length]
                      return (
                        <Tr
                          key={c.categoria_codigo}
                          clickable
                          onClick={() => setDrawerCat({
                            codigo: c.categoria_codigo,
                            descricao: c.categoria_descricao ?? c.categoria_codigo,
                            color,
                          })}
                        >
                          <Td first>
                            <SegCell color={color}>
                              {c.categoria_descricao ?? c.categoria_codigo}
                            </SegCell>
                          </Td>
                          <Td style={{ minWidth: '140px' }}>
                            <BarCell
                              value={c.receita_bruta}
                              max={recMax}
                              label={fPct(c.participacao_pct, 1)}
                            />
                          </Td>
                          <Td right>{fInt(c.qtd_total)}</Td>
                          <Td right>{fCurrency(c.receita_bruta)}</Td>
                          <Td right>{fCurrency(c.cmv)}</Td>
                          <Td right>{fCurrency(c.margem_bruta)}</Td>
                          <Td right last>
                            <b style={{ color: c.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                              {fPct(c.margem_pct, 1)}
                            </b>
                          </Td>
                        </Tr>
                      )
                    })}
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

      {/* ── Nível 1: Drawer de Categoria → Grupos ─────────────────────────── */}
      <Drawer
        open={drawerCat !== null && drawerGrupo === null}
        onClose={() => setDrawerCat(null)}
        title={
          drawerCat ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: drawerCat.color, flexShrink: 0 }} />
              {drawerCat.descricao}
            </div>
          ) : 'Detalhes'
        }
      >
        {drawerCat && (
          <div>
            <div style={{
              fontSize: '12px', fontWeight: 600, letterSpacing: '1px',
              textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))',
              marginBottom: '12px',
            }}>
              GRUPOS ({loadingG ? '…' : (grupos?.grupos.length ?? 0)})
            </div>

            {loadingG
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : (grupos?.grupos ?? []).map((g, i) => {
                  const descricao = g.grupo_descricao ?? `Grupo ${g.grupo_id}`
                  return (
                    <div
                      key={g.grupo_id}
                      style={{ marginBottom: '14px', cursor: 'pointer' }}
                      onClick={() => setDrawerGrupo({
                        grupo_id: g.grupo_id,
                        grupo_descricao: descricao,
                        segmento: view,
                        color: drawerCat.color,
                      })}
                    >
                      {/* Row: nome | receita | chevron */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                          {descricao}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))' }}>
                            {fCurrency(g.receita_bruta)}
                          </span>
                          <ChevronRight size={14} color="hsl(var(--muted-foreground))" />
                        </div>
                      </div>
                      {/* Sub-row: barra | participação | margem% */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                        <div style={{ flex: 1, height: '4px', background: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
                          <div style={{ width: `${Math.min(g.participacao_pct, 100)}%`, height: '100%', background: drawerCat.color, borderRadius: '999px' }} />
                        </div>
                        <span style={{ minWidth: '38px', textAlign: 'right' }}>{fPct(g.participacao_pct, 1)}</span>
                        <span style={{
                          minWidth: '50px', textAlign: 'right',
                          color: g.margem_pct >= 50 ? 'hsl(var(--success))' : 'hsl(var(--muted-foreground))',
                          fontWeight: g.margem_pct >= 50 ? 600 : 400,
                        }}>
                          {fPct(g.margem_pct, 1)}
                        </span>
                      </div>
                      {i < (grupos?.grupos.length ?? 0) - 1 && (
                        <div style={{ borderBottom: '1px solid hsl(var(--border))', marginTop: '14px' }} />
                      )}
                    </div>
                  )
                })
            }
          </div>
        )}
      </Drawer>

      {/* ── Nível 2: Drawer de Grupo → Subgrupos ──────────────────────────── */}
      <Drawer
        open={drawerGrupo !== null && subgrupoAberto === null}
        onClose={() => setDrawerGrupo(null)}
        title={
          drawerGrupo ? (
            <div>
              {/* Breadcrumb */}
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
                {drawerCat?.descricao}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: drawerGrupo.color, flexShrink: 0 }} />
                {drawerGrupo.grupo_descricao}
              </div>
            </div>
          ) : 'Subgrupos'
        }
      >
        {drawerGrupo && (
          <div>
            {/* Botão voltar */}
            <button
              onClick={() => setDrawerGrupo(null)}
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
              SUBGRUPOS ({loadingSub ? '…' : (subgrupos?.subgrupos.length ?? 0)})
            </div>

            {loadingSub
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : (subgrupos?.subgrupos ?? []).map((s, i) => (
                  <div
                    key={s.subgrupo_id}
                    style={{ marginBottom: '14px', cursor: 'pointer' }}
                    onClick={() => setSubgrupoAberto({ id: s.subgrupo_id, descricao: s.subgrupo_descricao })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>
                        {s.subgrupo_descricao}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'hsl(var(--foreground))' }}>
                          {fCurrency(s.receita_bruta)}
                        </span>
                        <ChevronRight size={14} color="hsl(var(--muted-foreground))" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                      <div style={{ flex: 1, height: '4px', background: 'hsl(var(--muted))', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(s.participacao_pct, 100)}%`, height: '100%', background: drawerGrupo.color, borderRadius: '999px' }} />
                      </div>
                      <span style={{ minWidth: '38px', textAlign: 'right' }}>{fPct(s.participacao_pct, 1)}</span>
                      <span style={{
                        minWidth: '50px', textAlign: 'right',
                        color: s.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))',
                        fontWeight: 600,
                      }}>
                        {fPct(s.margem_pct, 1)}
                      </span>
                    </div>
                    {i < (subgrupos?.subgrupos.length ?? 0) - 1 && (
                      <div style={{ borderBottom: '1px solid hsl(var(--border))', marginTop: '14px' }} />
                    )}
                  </div>
                ))
            }
          </div>
        )}
      </Drawer>

      {/* ── Nível 3: Drawer de Subgrupo → Produtos ────────────────────────── */}
      <Drawer
        open={subgrupoAberto !== null && drawerProduto === null}
        onClose={() => setSubgrupoAberto(null)}
        title={
          subgrupoAberto ? (
            <div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
                {drawerCat?.descricao} › {drawerGrupo?.grupo_descricao}
              </div>
              <div>{subgrupoAberto.descricao}</div>
            </div>
          ) : 'Produtos'
        }
      >
        {subgrupoAberto && (
          <div>
            <button
              onClick={() => setSubgrupoAberto(null)}
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
              PRODUTOS ({loadingProd ? '…' : (produtosData?.produtos.length ?? 0)})
            </div>

            {loadingProd
              ? <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}><Spinner /></div>
              : (produtosData?.produtos ?? []).map((p, i) => (
                  <div
                    key={p.source_produto_id}
                    style={{ marginBottom: '14px', cursor: 'pointer' }}
                    onClick={() => setDrawerProduto({
                      source_produto_id: p.source_produto_id,
                      descricao_produto: p.descricao_produto,
                      receita_bruta: p.receita_bruta,
                      margem_pct: p.margem_pct,
                      qtd_venda: p.qtd_venda,
                      participacao_pct: p.participacao_pct,
                    })}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--foreground))', flex: 1, marginRight: '8px' }}>
                        {p.descricao_produto}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                          {fCurrency(p.receita_bruta)}
                        </span>
                        <ChevronRight size={14} color="hsl(var(--muted-foreground))" />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
                      <span>Qtd: <b style={{ color: 'hsl(var(--foreground))' }}>{fInt(p.qtd_venda)}</b></span>
                      <span>Margem: <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>{fPct(p.margem_pct, 1)}</b></span>
                      <span>Part.: {fPct(p.participacao_pct, 1)}</span>
                    </div>
                    {i < (produtosData?.produtos.length ?? 0) - 1 && (
                      <div style={{ borderBottom: '1px solid hsl(var(--border))', marginTop: '14px' }} />
                    )}
                  </div>
                ))
            }
          </div>
        )}
      </Drawer>

      {/* ── Nível 3b: Drawer de Produto (detalhe) ─────────────────────────── */}
      <Drawer
        open={drawerProduto !== null}
        onClose={() => setDrawerProduto(null)}
        title={
          drawerProduto ? (
            <div>
              <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '2px' }}>
                {drawerCat?.descricao} › {drawerGrupo?.grupo_descricao} › {subgrupoAberto?.descricao}
              </div>
              <div>{drawerProduto.descricao_produto}</div>
            </div>
          ) : 'Produto'
        }
      >
        {drawerProduto && (
          <div>
            <button
              onClick={() => setDrawerProduto(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '12px', color: 'hsl(var(--muted-foreground))',
                padding: '0 0 16px 0', fontFamily: 'inherit',
              }}
            >
              <ArrowLeft size={13} /> Voltar
            </button>

            {/* KPIs do produto */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { label: 'Receita', value: fCurrency(drawerProduto.receita_bruta) },
                { label: 'Margem %', value: fPct(drawerProduto.margem_pct, 1), highlight: drawerProduto.margem_pct >= 0 },
                { label: 'Qtd Vendida', value: fInt(drawerProduto.qtd_venda) },
                { label: 'Participação', value: fPct(drawerProduto.participacao_pct, 1) },
              ].map(kpi => (
                <div key={kpi.label} style={{ background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
                    {kpi.label}
                  </div>
                  <div style={{
                    fontSize: '17px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                    color: kpi.highlight === false ? 'hsl(var(--danger))' : kpi.highlight === true ? 'hsl(var(--success))' : 'hsl(var(--foreground))',
                  }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Botão ver análise completa */}
            <button
              onClick={() => navigate(`/produto/${encodeURIComponent(drawerProduto.source_produto_id)}`)}
              style={{
                width: '100%', padding: '10px 16px',
                background: 'hsl(var(--primary))', color: 'white',
                border: 'none', borderRadius: 'var(--radius)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}
            >
              Ver análise completa <ChevronRight size={14} />
            </button>
          </div>
        )}
      </Drawer>
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

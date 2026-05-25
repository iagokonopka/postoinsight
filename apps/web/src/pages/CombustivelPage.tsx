import { useState } from 'react'
import { Clock } from 'lucide-react'

import { useCombustivelResumo, useCombustivelEvolucaoPorProduto } from '@/hooks/useCombustivel'
import { useApp } from '@/context/AppContext'
import { periodLabel } from '@/lib/periods'

import { Page, Card, CardHeader, CardBody, ChartBox, KpiGrid, Row } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/layout/PageHeader'
import { DonutChart, type DonutSlice } from '@/components/charts/DonutChart'
import {
  TableWrap, Table, Thead, Th, Tbody, Tr, Td, Tfoot, TfootTd,
} from '@/components/ui/Table'
import { fCurrency, fInt, fPct } from '@/lib/format'
import { Sparkline } from '@/components/ui/Sparkline'

// Recharts inline for multi-series area chart
import {
  ResponsiveContainer, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { fDayMonth, fMonthShort } from '@/lib/format'

// ─── Constants ────────────────────────────────────────────────────────────────

const PROD_COLORS = ['#0073BB', '#EC7211', '#6B40C4', '#1D8102', '#0891b2', '#db2777']

type CombMode = 'volume' | 'receita'

// ─── Segment control ─────────────────────────────────────────────────────────

function SegControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{
      display: 'inline-flex', padding: '3px',
      background: 'hsl(var(--muted))', borderRadius: '7px', gap: '2px',
    }}>
      {options.map(opt => (
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CombustivelPage() {
  const { period } = useApp()
  const [mode, setMode]           = useState<CombMode>('volume')
  const [includeArla, setArla]    = useState(false)

  const { data: resumo, isLoading: loadingResumo } = useCombustivelResumo()
  const { data: evoData, isLoading: loadingEvo }   = useCombustivelEvolucaoPorProduto('dia')

  const t = resumo?.totais

  // ── Produtos (sem/com Arla) ──
  // Arla: grupo_descricao contém 'Arla' ou 'arla'
  const produtos = (resumo?.por_produto ?? []).filter(p =>
    includeArla ? true : !/arla/i.test(p.grupo_descricao ?? '')
  )

  const totVol = produtos.reduce((s, p) => s + p.volume_litros, 0)
  const totRec = produtos.reduce((s, p) => s + p.receita_bruta, 0)

  // ── Evolution chart — pivot por produto ──
  const evoMap = new Map<string, Record<string, number>>()
  const produtoNames: string[] = []
  const produtoIds: number[] = []

  for (const prod of evoData?.produtos ?? []) {
    const name = prod.grupo_descricao
    if (!includeArla && /arla/i.test(name)) continue
    if (!produtoNames.includes(name)) {
      produtoNames.push(name)
      produtoIds.push(prod.grupo_id)
    }
    for (const ponto of prod.serie) {
      if (!evoMap.has(ponto.periodo)) evoMap.set(ponto.periodo, {})
      const row = evoMap.get(ponto.periodo)!
      row[name] = mode === 'volume' ? ponto.volume_litros : ponto.receita_bruta
    }
  }

  const chartData = Array.from(evoMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([periodo, vals]) => ({
      label: periodo.length === 10 ? fDayMonth(periodo) : fMonthShort(periodo),
      ...vals,
    }))

  const yFmt = mode === 'volume'
    ? (v: number) => (v / 1000).toFixed(1) + 'k L'
    : (v: number) => 'R$ ' + (v / 1000).toFixed(0) + 'k'

  const ttFmt = mode === 'volume'
    ? (v: number) => fInt(v) + ' L'
    : fCurrency

  // ── Donut ──
  const donutData: DonutSlice[] = produtos.slice(0, 6).map((p, i) => ({
    label: p.grupo_descricao ?? `Produto ${p.grupo_id}`,
    value: mode === 'volume' ? p.volume_litros : p.receita_bruta,
    color: PROD_COLORS[i % PROD_COLORS.length],
  }))
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0)
  const donutCenter = mode === 'volume'
    ? fInt(donutTotal) + ' L'
    : fCurrency(donutTotal)

  // ── Spark series per product ──
  function sparkSeries(grupoId: number): number[] {
    const prod = evoData?.produtos.find(p => p.grupo_id === grupoId)
    if (!prod) return []
    return prod.serie.map(p => mode === 'volume' ? p.volume_litros : p.receita_bruta)
  }

  const evoDesc = `${mode === 'volume' ? 'Volume' : 'Receita'} por produto · ${periodLabel(period).toLowerCase()}`

  return (
    <Page>
      <PageHeader
        title="Combustível"
        subtitle="Volumes, receitas e margens por produto."
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <SegControl
              options={[{ value: 'volume', label: 'Volume' }, { value: 'receita', label: 'Receita' }]}
              value={mode}
              onChange={setMode}
            />
            <SegControl
              options={[{ value: 'false', label: 'Sem Arla 32' }, { value: 'true', label: 'Com Arla 32' }]}
              value={String(includeArla)}
              onChange={v => setArla(v === 'true')}
            />
          </div>
        }
      />

      {/* KPIs */}
      <KpiGrid cols={5}>
        <KpiCard
          label="Volume Total"
          value={t ? fInt(t.volume_litros) + ' L' : '—'}
          sparkColor="#0073BB"
        />
        <KpiCard
          label="Receita"
          value={t ? fCurrency(t.receita_bruta) : '—'}
          sparkColor="#0073BB"
        />
        <KpiCard
          label="CMV"
          value={t ? fCurrency(t.cmv) : '—'}
          sparkColor="#dc2626"
        />
        <KpiCard
          label="Margem Bruta"
          value={t ? fCurrency(t.margem_bruta) : '—'}
          sparkColor="#16a34a"
        />
        <KpiCard
          label="Margem %"
          value={t ? fPct(t.margem_pct, 2) : '—'}
          deltaPP
          sparkColor="#0073BB"
        />
      </KpiGrid>

      {/* Evolução + Donut */}
      <Row variant="3-2">
        <Card>
          <CardHeader title="Evolução por produto" description={evoDesc} />
          <CardBody>
            <ChartBox size="tall">
              {loadingEvo
                ? <LoadingBox />
                : chartData.length === 0
                  ? <EmptyState title="Sem dados" description="Nenhum registro no período." />
                  : <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                        <defs>
                          {produtoNames.map((_, i) => (
                            <linearGradient key={i} id={`cg${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%"   stopColor={PROD_COLORS[i % PROD_COLORS.length]} stopOpacity={0.5} />
                              <stop offset="100%" stopColor={PROD_COLORS[i % PROD_COLORS.length]} stopOpacity={0.05} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="0" vertical={false} />
                        <XAxis dataKey="label" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
                        <YAxis tickFormatter={yFmt} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} axisLine={false} tickLine={false} width={68} />
                        <Tooltip content={<ChartTooltip formatter={ttFmt} />} />
                        <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '12px' }} iconType="circle" iconSize={8} />
                        {produtoNames.map((name, i) => (
                          <Area
                            key={name}
                            type="monotone"
                            dataKey={name}
                            stroke={PROD_COLORS[i % PROD_COLORS.length]}
                            fill={`url(#cg${i})`}
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
              }
            </ChartBox>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Mix de Combustível" />
          <CardBody>
            {loadingResumo
              ? <LoadingBox />
              : <DonutChart
                  data={donutData}
                  centerLabel="Total"
                  centerValue={donutCenter}
                  tooltipFormatter={mode === 'volume' ? v => fInt(v) + ' L' : fCurrency}
                />
            }
          </CardBody>
        </Card>
      </Row>

      {/* Breakdown + Ranking bicos */}
      <Row variant="2-1">
        <Card>
          <CardHeader title="Breakdown por produto" />
          {loadingResumo
            ? <CardBody><LoadingBox /></CardBody>
            : <TableWrap>
                <Table>
                  <Thead>
                    <Th first>Produto</Th>
                    <Th right>Volume (L)</Th>
                    <Th right>Part.%</Th>
                    <Th right>Receita</Th>
                    <Th right>Margem %</Th>
                    <Th right>Preço/L</Th>
                    <Th right>Custo/L</Th>
                    <Th right last>Tendência</Th>
                  </Thead>
                  <Tbody>
                    {produtos.map((p, _i) => {
                      const spark = sparkSeries(p.grupo_id)
                      const trend = spark.length >= 2
                        ? (spark[spark.length - 1] - spark[0]) / Math.max(spark[0], 1)
                        : 0
                      const trendColor = trend > 0.02 ? '#16a34a' : trend < -0.02 ? '#dc2626' : '#64748b'
                      const trendArrow = trend > 0.02 ? '↑' : trend < -0.02 ? '↓' : '→'
                      const trendPct   = (Math.abs(trend) * 100).toFixed(1).replace('.', ',') + '%'

                      return (
                        <Tr key={p.grupo_id}>
                          <Td first style={{ fontWeight: 500 }}>
                            {p.grupo_descricao ?? `Produto ${p.grupo_id}`}
                          </Td>
                          <Td right>{fInt(p.volume_litros)}</Td>
                          <Td right>{fPct(p.participacao_volume_pct, 1)}</Td>
                          <Td right>{fCurrency(p.receita_bruta)}</Td>
                          <Td right>
                            <b style={{ color: p.margem_pct >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' }}>
                              {fPct(p.margem_pct, 1)}
                            </b>
                          </Td>
                          <Td right>
                            <span className="mono">
                              {p.preco_medio_litro != null
                                ? p.preco_medio_litro.toFixed(2).replace('.', ',')
                                : '—'}
                            </span>
                          </Td>
                          <Td right>
                            <span className="mono">
                              {p.custo_medio_litro != null
                                ? p.custo_medio_litro.toFixed(2).replace('.', ',')
                                : '—'}
                            </span>
                          </Td>
                          <Td right last>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                              {spark.length >= 2 && (
                                <div style={{ width: '72px', height: '22px', flexShrink: 0 }}>
                                  <Sparkline data={spark} color={trendColor} width="100%" height="100%" />
                                </div>
                              )}
                              <span style={{ fontSize: '11px', fontWeight: 600, color: trendColor, minWidth: '42px', textAlign: 'right' }}>
                                {trendArrow} {trendPct}
                              </span>
                            </div>
                          </Td>
                        </Tr>
                      )
                    })}
                  </Tbody>
                  <Tfoot>
                    <TfootTd first>TOTAL</TfootTd>
                    <TfootTd right>{fInt(totVol)}</TfootTd>
                    <TfootTd right>100%</TfootTd>
                    <TfootTd right>{fCurrency(totRec)}</TfootTd>
                    <TfootTd right>
                      <b>{t ? fPct(t.margem_pct, 1) : '—'}</b>
                    </TfootTd>
                    <TfootTd right last colSpan={3} />
                  </Tfoot>
                </Table>
              </TableWrap>
          }
        </Card>

        <Card>
          <CardHeader title="Ranking de Bicos" />
          <CardBody>
            <EmptyState
              icon={<Clock size={20} />}
              title="Disponível em breve"
              description="Vai destacar bombistas com performance acima e abaixo da média da rede."
            />
          </CardBody>
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

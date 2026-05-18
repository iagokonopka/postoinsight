/**
 * DrePage — /dre
 * Spec: FRONTEND_SPEC.md secao 8
 * Usa seletor de mes proprio — NAO herda o filtro global de periodo
 */
import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilters } from '@/contexts/FilterContext';
import { api, buildQuery } from '@/lib/api';
import { fBRL, fPct } from '@/lib/formatters';
import { PageHeader } from '@/components/layout/PageHeader';
import { KpiCard } from '@/components/kpi/KpiCard';
import { SectionCard } from '@/components/kpi/SectionCard';
import { EChart } from '@/components/charts/EChart';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { EChartsOption } from 'echarts';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface PeriodoData {
  receita_bruta: number;
  descontos: number;
  receita_liquida: number;
  cmv: number;
  margem_bruta: number;
  margem_pct: number;
}

interface DreResponse {
  meses: string[];
  linhas: Array<{
    segmento: string;
    periodos: Record<string, PeriodoData>;
  }>;
}

const SEG_COLORS: Record<string, string> = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  servicos:      '#0d9488',
  _total:        '#334155',
};
const SEG_LABELS: Record<string, string> = {
  combustivel:   'Combustivel',
  conveniencia:  'Conveniencia',
  lubrificantes: 'Lubrificantes',
  servicos:      'Servicos',
  _total:        'Total',
};

function labelMes(mes: string): string {
  const [ano, m] = mes.split('-');
  const meses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  return (meses[parseInt(m) - 1] ?? m) + '/' + (ano?.slice(2) ?? ano);
}

// ── Componente ───────────────────────────────────────────────────────────────

export function DrePage() {
  const { locationId } = useFilters();
  const locParam = locationId !== 'all' ? locationId : undefined;
  const [mesSelecionado, setMesSelecionado] = useState<string>('');

  // Meses disponiveis
  const { data: mesesDisp } = useQuery({
    queryKey: ['dre-meses', locParam],
    queryFn: () => api.get<{ meses: string[] }>(
      '/api/v1/dre/meses-disponiveis' + buildQuery({ location_id: locParam }),
    ),
  });

  // Inicia com o mes anterior ao corrente (primeiro da lista apos ordenacao desc)
  useEffect(() => {
    if (mesesDisp?.meses.length && !mesSelecionado) {
      setMesSelecionado(mesesDisp.meses[0]);
    }
  }, [mesesDisp, mesSelecionado]);

  // Mes anterior para comparativo
  const idxAtual = mesesDisp?.meses.indexOf(mesSelecionado) ?? -1;
  const mesAnterior = mesesDisp?.meses[idxAtual + 1];

  // Ultimos 6 meses para evolucao
  const ultimos6 = mesesDisp?.meses.slice(idxAtual, idxAtual + 6) ?? [];

  // Query do mes atual + anterior (1 request com 2 meses)
  const mesesQuery = [mesSelecionado, mesAnterior].filter(Boolean).join(',');
  const { data: dreAtual, isLoading: loadingAtual } = useQuery({
    queryKey: ['dre-atual', mesSelecionado, mesAnterior, locParam],
    queryFn: () => api.get<DreResponse>(
      '/api/v1/dre/mensal' + buildQuery({ meses: mesesQuery, location_id: locParam }),
    ),
    enabled: !!mesSelecionado,
  });

  // Query dos 6 meses para evolucao
  const { data: dre6, isLoading: loading6 } = useQuery({
    queryKey: ['dre-6m', ultimos6.join(','), locParam],
    queryFn: () => api.get<DreResponse>(
      '/api/v1/dre/mensal' + buildQuery({ meses: ultimos6.join(','), location_id: locParam }),
    ),
    enabled: ultimos6.length > 0,
  });

  // ── Dados do mes atual ───────────────────────────────────────────────────────
  function getLinha(seg: string, mes: string): PeriodoData {
    const linha = dreAtual?.linhas.find(l => l.segmento === seg);
    return linha?.periodos[mes] ?? { receita_bruta: 0, descontos: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0, margem_pct: 0 };
  }

  const total = getLinha('_total', mesSelecionado);
  const totalAnt = mesAnterior ? getLinha('_total', mesAnterior) : null;

  // ── Waterfall ────────────────────────────────────────────────────────────────
  const waterfallOption = useMemo<EChartsOption>(() => {
    if (!total.receita_bruta) return {};
    const receita  = total.receita_bruta;
    const desc     = total.descontos;
    const recLiq   = total.receita_liquida;
    const cmv      = total.cmv;
    const margem   = total.margem_bruta;

    // Waterfall: offset invisivel + barra colorida
    const categorias = ['Receita Bruta', 'Descontos', 'Rec. Liquida', 'CMV', 'Margem Bruta'];
    const offsets    = [0, recLiq, 0, margem, 0];
    const valores    = [receita, desc, recLiq, cmv, margem];
    const cores      = ['#0073BB', '#dc2626', '#94a3b8', '#dc2626', '#16a34a'];

    return {
      grid: { top: 24, right: 8, bottom: 0, left: 0, containLabel: true },
      xAxis: { type: 'category', data: categorias, axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => (v / 1000).toFixed(0) + 'k', fontSize: 11 } },
      series: [
        {
          type: 'bar',
          stack: 'wf',
          data: offsets,
          itemStyle: { color: 'transparent' },
          emphasis: { itemStyle: { color: 'transparent' } },
        },
        {
          type: 'bar',
          stack: 'wf',
          data: valores.map((v, i) => ({ value: v, itemStyle: { color: cores[i] } })),
          label: { show: true, position: 'top' as const, formatter: (p: any) => 'R$' + (p.value / 1000).toFixed(1) + 'k', fontSize: 11 },
          barMaxWidth: 48,
        },
      ],
      tooltip: {
        formatter: (p: any) => {
          if (!Array.isArray(p)) return '';
          const bar = (p as any[]).find((b: any) => b.seriesIndex === 1);
          return bar ? bar.name + ': ' + fBRL(bar.value) : '';
        },
      },
    };
  }, [total]);

  // ── Evolucao margem 6 meses ──────────────────────────────────────────────────
  const evolucaoOption = useMemo<EChartsOption>(() => {
    const meses6 = [...ultimos6].reverse(); // cronologico
    const segs = ['combustivel', 'conveniencia', 'lubrificantes', '_total'];
    return {
      grid: { top: 8, right: 8, bottom: 48, left: 0, containLabel: true },
      xAxis: { type: 'category', data: meses6.map(labelMes), axisLabel: { fontSize: 11 } },
      yAxis: { type: 'value', axisLabel: { formatter: (v: number) => v.toFixed(0) + '%', fontSize: 11 } },
      series: segs.map(seg => ({
        name: SEG_LABELS[seg] ?? seg,
        type: 'line' as const,
        data: meses6.map(m => {
          const linha = dre6?.linhas.find(l => l.segmento === seg);
          return linha?.periodos[m]?.margem_pct ?? 0;
        }),
        lineStyle: { color: SEG_COLORS[seg], width: seg === '_total' ? 2.5 : 1.5 },
        itemStyle: { color: SEG_COLORS[seg] },
        symbol: 'circle',
        symbolSize: 4,
        lineStyleType: seg === '_total' ? 'solid' : 'dashed',
      })),
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0 },
    };
  }, [dre6, ultimos6]);

  // ── Tabela comparativa ────────────────────────────────────────────────────────
  const linhasDRE = [
    { key: 'receita_bruta',   label: 'Receita Bruta', pct: false },
    { key: 'descontos',       label: '(-) Descontos', pct: false },
    { key: 'receita_liquida', label: '= Rec. Liquida', pct: false },
    { key: 'cmv',             label: '(-) CMV', pct: false },
    { key: 'margem_bruta',    label: '= Margem Bruta', pct: false },
    { key: 'margem_pct',      label: 'Margem %', pct: true },
  ] as const;

  // ── Filtro de mes (slot no PageHeader) ──────────────────────────────────────
  const filterSlot = (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost" size="icon" className="h-8 w-8"
        onClick={() => {
          const idx = mesesDisp?.meses.indexOf(mesSelecionado) ?? -1;
          const prox = mesesDisp?.meses[idx + 1];
          if (prox) setMesSelecionado(prox);
        }}
        disabled={idxAtual >= (mesesDisp?.meses.length ?? 0) - 1}
      >
        <ChevronLeft size={16} />
      </Button>
      <Select value={mesSelecionado} onValueChange={setMesSelecionado}>
        <SelectTrigger className="h-8 w-36 text-sm">
          <SelectValue placeholder="Mes..." />
        </SelectTrigger>
        <SelectContent>
          {(mesesDisp?.meses ?? []).map(m => (
            <SelectItem key={m} value={m}>{labelMes(m)}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost" size="icon" className="h-8 w-8"
        onClick={() => {
          const idx = mesesDisp?.meses.indexOf(mesSelecionado) ?? -1;
          const ant = mesesDisp?.meses[idx - 1];
          if (ant) setMesSelecionado(ant);
        }}
        disabled={idxAtual <= 0}
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col">
      <PageHeader title="DRE Mensal" subtitle="Demonstrativo de resultado por mês — receita, deduções, CMV e margem bruta." filterSlot={filterSlot} />

      <div className="flex flex-col gap-6">
        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          <KpiCard label="Receita Bruta" value={fBRL(total.receita_bruta)} loading={loadingAtual} />
          <KpiCard label="Margem Bruta"  value={fBRL(total.margem_bruta)}  loading={loadingAtual} />
          <KpiCard label="Margem %"      value={fPct(total.margem_pct)}    loading={loadingAtual} />
        </div>

        {/* Waterfall + Evolucao */}
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title={'DRE - ' + (mesSelecionado ? labelMes(mesSelecionado) : '')}>
            <EChart option={waterfallOption} height={300} loading={loadingAtual} />
          </SectionCard>
          <SectionCard title="Evolucao Margem % - 6 meses">
            <EChart option={evolucaoOption} height={260} loading={loading6} />
          </SectionCard>
        </div>

        {/* Tabela comparativa */}
        <SectionCard title="Comparativo mes a mes" noPadding>
          {loadingAtual ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Linha</TableHead>
                  <TableHead className="text-right">{mesSelecionado ? labelMes(mesSelecionado) : 'Atual'}</TableHead>
                  <TableHead className="text-right">{mesAnterior ? labelMes(mesAnterior) : 'Anterior'}</TableHead>
                  <TableHead className="text-right">Delta R$</TableHead>
                  <TableHead className="text-right">Delta %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {linhasDRE.map(({ key, label, pct: isPct }) => {
                  const vAtual = total[key] as number;
                  const vAnt   = totalAnt ? (totalAnt[key] as number) : null;
                  const deltaR = vAnt !== null ? vAtual - vAnt : null;
                  const deltaPct = vAnt !== null && vAnt !== 0 ? ((vAtual - vAnt) / Math.abs(vAnt)) * 100 : null;
                  return (
                    <TableRow key={key}>
                      <TableCell className={'font-medium' + (isPct ? ' italic text-muted-foreground' : '')}>{label}</TableCell>
                      <TableCell className="text-right">{isPct ? fPct(vAtual) : fBRL(vAtual)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{vAnt !== null ? (isPct ? fPct(vAnt) : fBRL(vAnt)) : '-'}</TableCell>
                      <TableCell className={'text-right ' + (deltaR !== null && deltaR >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {deltaR !== null ? (isPct ? fPct(deltaR) : fBRL(deltaR)) : '-'}
                      </TableCell>
                      <TableCell className={'text-right ' + (deltaPct !== null && deltaPct >= 0 ? 'text-green-600' : 'text-red-600')}>
                        {deltaPct !== null ? fPct(deltaPct) : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

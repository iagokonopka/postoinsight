# PostoInsight — Padrões de Composição de Páginas

> Define como os componentes se combinam para formar páginas e seções completas.  
> Antes de implementar uma nova tela, verificar se o padrão já existe aqui.  
> Se não existir, documentar antes de implementar.  
> Última atualização: 2026-05-18

---

## Índice

1. [Estrutura geral de uma página BI](#1-estrutura-geral-de-uma-página-bi)
2. [Padrão: Dashboard com KPIs + Gráfico + Tabela](#2-padrão-dashboard-com-kpis--gráfico--tabela)
3. [Padrão: Página de análise por categoria](#3-padrão-página-de-análise-por-categoria)
4. [Padrão: DRE Mensal](#4-padrão-dre-mensal)
5. [Padrão: Página de sistema (Sync / Settings)](#5-padrão-página-de-sistema-sync--settings)
6. [Layouts de grid de seções](#6-layouts-de-grid-de-seções)
7. [Padrão de loading](#7-padrão-de-loading)
8. [Padrão de drill-down com Drawer](#8-padrão-de-drill-down-com-drawer)
9. [Padrão de filtros e estado reativo](#9-padrão-de-filtros-e-estado-reativo)
10. [Regras de responsividade](#10-regras-de-responsividade)

---

## 1. Estrutura geral de uma página BI

Toda página de análise segue esta estrutura vertical:

```
┌─────────────────────────────────────────────────────────┐
│  PageHeader                                             │
│  ├─ Título + subtítulo (tenant + período)              │  px-5 pt-5 pb-4
│  └─ PeriodSelector + LocationSelect                    │
├─────────────────────────────────────────────────────────┤
│  FilterBar (opcional — apenas quando há filtros extra)  │  px-5 pb-4
├─────────────────────────────────────────────────────────┤
│  Conteúdo                                               │  px-5 pb-5 flex flex-col gap-4
│  ├─ KPI Row                                            │
│  ├─ Seção principal (gráfico largo)                    │
│  ├─ Seção secundária (2 colunas)                       │
│  └─ Seção de tabela                                    │
└─────────────────────────────────────────────────────────┘
```

**Wrapper do conteúdo:**
```tsx
<div class="px-5 pb-5 flex flex-col gap-4">
  {/* seções aqui */}
</div>
```

**Regras:**
- `gap-4` (16px) entre seções — nunca mais
- Nunca usar `margin` — sempre `gap` no container
- O scroll é do container externo — o conteúdo não define `overflow`
- Última seção não precisa de `mb` — o `pb-5` do container cobre

---

## 2. Padrão: Dashboard com KPIs + Gráfico + Tabela

**Usado em:** Visão Geral de Vendas (`/`)

```tsx
<div class="px-5 pb-5 flex flex-col gap-4">

  {/* 1. KPI Row — 5 cards */}
  <div class="grid gap-[14px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
    <KpiCard label="Receita Bruta" ... />
    <KpiCard label="CMV" ... />
    <KpiCard label="Margem Bruta" ... />
    <KpiCard label="Margem %" ... />
    <KpiCard label="Itens Vendidos" ... />
  </div>

  {/* 2. Gráfico principal + Donut — 2/3 | 1/3 */}
  <div class="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr]">
    <SectionCard title="Evolução de Vendas" desc="Receita bruta e margem no período">
      <div class="h-[260px]">
        <LineAreaChart ... />
      </div>
    </SectionCard>

    <SectionCard title="Por Segmento" desc="Participação na receita bruta">
      <div class="relative h-[180px]">
        <DonutChart ... />
      </div>
      <DonutLegend ... />
    </SectionCard>
  </div>

  {/* 3. Tabela de ranking — largura total */}
  <SectionCard title="Top 10 Produtos" desc="Por receita bruta no período">
    <DataTable ... />
  </SectionCard>

</div>
```

---

## 3. Padrão: Página de análise por categoria

**Usado em:** Combustível (`/combustivel`), Conveniência (`/conveniencia`)

```tsx
<div class="px-5 pb-5 flex flex-col gap-4">

  {/* 1. KPI Row — 4 cards específicos da categoria */}
  <div class="grid gap-[14px] grid-cols-2 lg:grid-cols-4">
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
    <KpiCard ... />
  </div>

  {/* 2. Gráfico de evolução — largura total */}
  <SectionCard title="Evolução" actions={<ModeToggle />}>
    <div class="h-[260px]">
      <LineAreaChart ou ComposedChart />
    </div>
  </SectionCard>

  {/* 3. Duas seções lado a lado — 3/5 | 2/5 */}
  <div class="grid gap-4 grid-cols-1 xl:grid-cols-[3fr_2fr]">
    <SectionCard title="Tabela detalhada">
      <DataTable ... />
    </SectionCard>

    <SectionCard title="Heatmap / Scatter">
      <Heatmap ou ScatterChart />
    </SectionCard>
  </div>

</div>
```

---

## 4. Padrão: DRE Mensal

**Usado em:** DRE (`/dre`)

```tsx
<div class="px-5 pb-5 flex flex-col gap-4">

  {/* 1. Seletor de mês — no PageHeader, não no FilterBar */}
  {/* (parte do PageHeader actions) */}
  <div class="flex items-center gap-2">
    <Button variant="outline" size="sm" onClick={prevMonth}><ChevronLeft size={14} /></Button>
    <span class="text-base font-semibold min-w-[110px] text-center">Abril 2026</span>
    <Button variant="outline" size="sm" onClick={nextMonth}><ChevronRight size={14} /></Button>
  </div>

  {/* 2. KPI Row — 3 cards de resumo do mês */}
  <div class="grid gap-[14px] grid-cols-1 sm:grid-cols-3">
    <KpiCard label="Receita Líquida" ... />
    <KpiCard label="Margem Bruta" ... />
    <KpiCard label="Resultado" ... />
  </div>

  {/* 3. Tabela DRE — largura total */}
  <SectionCard title="DRE Mensal — Abril 2026">
    <DreTabelaCompleta ... />
  </SectionCard>

  {/* 4. Gráfico de evolução — 6 meses */}
  <SectionCard title="Evolução de Margem" desc="Últimos 6 meses por segmento">
    <div class="h-[260px]">
      <MultiLineChart ... />
    </div>
  </SectionCard>

</div>
```

**DreTabelaCompleta — estrutura de linhas:**

| Tipo de linha | Classe | Comportamento |
|--------------|--------|--------------|
| Receita Bruta (topo) | `dre-row` | Normal |
| Deduções (−) | `dre-row` | Valor em `text-danger` |
| Subtotal | `dre-row-total` | `border-t-2 font-semibold bg-muted/40` |
| Resultado Final | `dre-row-result` | `border-t-2 border-success/30 bg-success-subtle font-bold text-success` |

---

## 5. Padrão: Página de sistema (Sync / Settings)

**Usado em:** Sincronização (`/sync`), Configurações (`/settings`)

```tsx
<div class="px-5 pb-5 flex flex-col gap-4">

  {/* Grid de 2 colunas — status cards */}
  <div class="grid gap-4 grid-cols-1 sm:grid-cols-2">
    <SectionCard title="Status da Rede">
      {/* status geral + dot pulsante */}
    </SectionCard>
    <SectionCard title="Última Sincronização">
      {/* timestamp + botão forçar sync */}
    </SectionCard>
  </div>

  {/* Lista de locations — largura total */}
  <SectionCard title="Unidades">
    <div class="flex flex-col divide-y divide-border">
      {locations.map(loc => <LocationRow key={loc.id} {...loc} />)}
    </div>
  </SectionCard>

  {/* Histórico de sync — largura total */}
  <SectionCard title="Histórico">
    <DataTable ... />
  </SectionCard>

</div>
```

---

## 6. Layouts de grid de seções

Breakpoint: `xl` (1280px) para colunas lado a lado. Abaixo disso, sempre uma coluna.

```tsx
{/* Dois cards iguais */}
<div class="grid gap-4 grid-cols-1 xl:grid-cols-2">

{/* Principal + secundário (2/3 | 1/3) */}
<div class="grid gap-4 grid-cols-1 xl:grid-cols-[2fr_1fr]">

{/* Principal + detalhe (3/5 | 2/5) */}
<div class="grid gap-4 grid-cols-1 xl:grid-cols-[3fr_2fr]">

{/* Três colunas iguais */}
<div class="grid gap-4 grid-cols-1 sm:grid-cols-3">
```

**Regras:**
- Nunca usar mais de 3 colunas em nível de seção
- Grid de KPIs é separado do grid de seções — nunca misturar
- `xl:` é o breakpoint de referência para colunas — `lg:` apenas em exceções justificadas

---

## 7. Padrão de loading

Toda página que depende de dados da API usa o padrão de loading com Skeleton:

```tsx
function VendasPage() {
  const { data, isLoading } = useVendas(filters);

  if (isLoading) return <VendasPageSkeleton />;
  if (!data) return <EmptyState />;

  return <VendasPageContent data={data} />;
}

function VendasPageSkeleton() {
  return (
    <div class="px-5 pb-5 flex flex-col gap-4">
      {/* KPI skeletons */}
      <div class="grid gap-[14px] grid-cols-2 lg:grid-cols-5">
        {Array.from({length: 5}).map((_, i) => (
          <div key={i} class="h-[108px] rounded bg-muted animate-pulse" />
        ))}
      </div>
      {/* Chart skeleton */}
      <div class="h-[308px] rounded bg-muted animate-pulse" />
      {/* Table skeleton */}
      <div class="h-[320px] rounded bg-muted animate-pulse" />
    </div>
  );
}
```

**Regras:**
- Sempre renderizar o Skeleton com as dimensões reais do componente que vai substituir
- Nunca usar spinner centralizado no lugar de skeleton de página
- `isLoading` inicial → Skeleton; `isFetching` (refetch com dados) → manter dados visíveis + indicador sutil no Topbar

---

## 8. Padrão de drill-down com Drawer

Usado quando o usuário clica em uma linha de tabela para ver detalhes.

```tsx
function TabelaProdutos({ produtos }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <DataTable
        rows={produtos}
        onRowClick={(produto) => setSelected(produto)}
      />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.nome}
        icon={<Package size={16} />}
      >
        {selected && <ProdutoDetalhe produto={selected} />}
      </Drawer>
    </>
  );
}
```

**Regras:**
- Drawer sempre fechado por padrão — `useState(null)`
- Overlay fecha o Drawer ao clicar
- ESC também fecha — implementar `useEffect` com `keydown`
- Nunca abrir um modal dentro de um Drawer
- Nunca usar Drawer para formulários de edição — usar página própria ou Dialog

---

## 9. Padrão de filtros e estado reativo

Filtros de página (período + location) vivem em estado local do componente de página e disparam re-fetch via TanStack Query.

```tsx
function VendasPage() {
  const [period, setPeriod] = useState<Period>('mes');
  const [locationId, setLocationId] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['vendas', period, locationId],
    queryFn: () => fetchVendas({ period, locationId }),
  });

  return (
    <>
      <PageHeader title="Visão Geral de Vendas">
        <PeriodSelector value={period} onChange={setPeriod} />
        <LocationSelect value={locationId} onChange={setLocationId} />
      </PageHeader>

      {isLoading ? <Skeleton /> : <VendasContent data={data} />}
    </>
  );
}
```

**Regras:**
- `queryKey` sempre inclui todos os filtros — garante re-fetch automático
- Estado de filtros nunca sobe para context global — fica local na página
- Filtros que afetam múltiplas páginas (ex: tenant) ficam em context global de sessão
- Debounce de 300ms apenas em inputs de texto — selects e segmented controls disparam imediato

---

## 10. Regras de responsividade

O PostoInsight é projetado primariamente para desktop (1280px+). Mobile é suportado mas não é foco do MVP.

| Breakpoint | Comportamento |
|-----------|--------------|
| `xl` (1280px+) | Layout completo — todas as colunas lado a lado |
| `lg` (1024px) | Grid de KPIs colapsa — 3 colunas máximo |
| `sm` (640px) | Sidebar recolhe em hamburguer, colunas laterais colapsam |
| Mobile (<640px) | Sidebar como drawer, tudo em coluna única |

**Regras:**
- Nunca usar valores absolutos de largura no conteúdo — apenas `w-full`, `max-w-`, grid
- Sidebar em mobile: `Sheet` do Shadcn (drawer lateral) com toggle no Topbar
- Tabelas em mobile: scroll horizontal (`overflow-x-auto`) — nunca ocultar colunas silenciosamente
- Gráficos: `ResponsiveContainer` do Recharts com `width="100%"` — nunca tamanho fixo

---

*Padrão não coberto aqui? Documentar antes de implementar.*  
*A consistência entre páginas depende de todos seguirem os mesmos padrões.*

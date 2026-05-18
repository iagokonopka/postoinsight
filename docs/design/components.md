# PostoInsight — Catálogo de Componentes

> Cada componente tem: descrição, quando usar, anatomia, variantes e regras.  
> O agente frontend não cria componentes visuais que não estejam catalogados aqui.  
> Para adicionar um componente: documentar neste arquivo primeiro, depois implementar.  
> Última atualização: 2026-05-18

---

## Índice

1. [Layout — AppShell](#1-appshell)
2. [Layout — Sidebar](#2-sidebar)
3. [Layout — Topbar](#3-topbar)
4. [Layout — PageHeader](#4-pageheader)
5. [Dados — KpiCard](#5-kpicard)
6. [Dados — DataTable](#6-datatable)
7. [Dados — SectionCard](#7-sectioncard)
8. [Dados — FilterBar](#8-filterbar)
9. [Feedback — StatusBadge](#9-statusbadge)
10. [Feedback — DeltaTag](#10-deltatag)
11. [Feedback — Toast](#11-toast)
12. [Feedback — EmptyState](#12-emptystate)
13. [Feedback — SkeletonLoader](#13-skeletonloader)
14. [Overlay — Drawer](#14-drawer)
15. [Gráficos — LineAreaChart](#15-lineareachart)
16. [Gráficos — ComposedChart](#16-composedchart)
17. [Gráficos — DonutChart](#17-donutchart)
18. [Gráficos — BarChart](#18-barchart)
19. [Gráficos — Sparkline](#19-sparkline)
20. [Gráficos — Heatmap](#20-heatmap)
21. [Primitivos Shadcn em uso](#21-primitivos-shadcn-em-uso)

---

## 1. AppShell

**O que é:** Estrutura raiz da aplicação autenticada. Envolve toda a UI pós-login.

**Anatomia:**
```
<div class="flex h-screen overflow-hidden bg-background">
  <Sidebar />
  <main class="flex flex-col flex-1 min-w-0 overflow-hidden">
    <Topbar />
    <div class="flex-1 overflow-y-auto">
      {children}  ← conteúdo da página atual
    </div>
  </main>
</div>
```

**Regras:**
- `h-screen overflow-hidden` no root — nunca deixa a página inteira scrollar; apenas o conteúdo interno scrolla
- Sidebar tem `flex-shrink-0` — nunca comprime
- O conteúdo (`children`) é responsável pelo próprio `padding` interno

---

## 2. Sidebar

**O que é:** Navegação lateral fixa. Sempre visível em desktop.

**Anatomia:**
```
<aside class="w-60 flex flex-col flex-shrink-0 bg-sidebar border-r border-sidebar-muted/50">

  {/* Logo / brand */}
  <div class="flex items-center gap-2.5 px-5 py-[18px] border-b border-sidebar-muted/60">
    <LogoMark />  ← ícone de 28×28, gradient azul→roxo
    <div>
      <span class="text-sm font-semibold text-sidebar-foreground">PostoInsight</span>
      <span class="block text-[10px] text-sidebar-foreground/50 tracking-wide">BI para redes</span>
    </div>
  </div>

  {/* Navegação */}
  <nav class="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-5">
    <SidebarSection label="Análise" items={[...]} />
    <SidebarSection label="Financeiro" items={[...]} />
    <SidebarSection label="Sistema" items={[...]} />
  </nav>

  {/* Footer — tenant + usuário */}
  <div class="p-3 border-t border-sidebar-muted/60">
    <TenantBadge />
  </div>

</aside>
```

**SidebarItem — estados:**
```
inativo:  text-sidebar-foreground/70, bg-transparent
hover:    bg-sidebar-muted/60, text-sidebar-foreground
ativo:    bg-sidebar-activeBg, text-sidebar-foreground
          + barra esquerda: w-[2.5px] h-[calc(100%-12px)] bg-sidebar-active rounded-full
          + ícone: color sidebar-active
```

**Regras:**
- Section labels: `text-[10px] font-semibold uppercase tracking-[1.4px] text-sidebar-foreground/40`
- Ícones: Lucide, `size-[14px]`, `stroke-width={1.6}`
- Badge de contagem (ex: "4 postos"): `text-[9px] font-semibold` pill `bg-sidebar-foreground/10`
- `TenantBadge`: avatar 28×28 com gradiente, nome da rede, role do usuário
- Nunca adicionar scroll horizontal — labels que não cabem usam truncate

**Seções de navegação (mapeamento de rotas):**

| Seção | Item | Rota |
|-------|------|------|
| Análise | Visão Geral | `/dashboard` |
| Análise | Combustível | `/combustivel` |
| Análise | Arla 32 | `/arla` |
| Análise | Lubrificantes | `/lubrificantes` |
| Análise | Conveniência | `/conveniencia` |
| Financeiro | DRE Mensal | `/dre` |
| Sistema | Sincronização | `/sync` |
| Sistema | Configurações | `/settings` |

---

## 3. Topbar

**O que é:** Barra horizontal no topo do conteúdo. Contém breadcrumb, ações globais e user menu.

**Anatomia:**
```
<header class="flex items-center gap-3 px-6 py-3 bg-card border-b border-border flex-shrink-0 h-[52px]">
  <Breadcrumb />          ← "PostoInsight › Combustível"
  <div class="ml-auto flex items-center gap-2">
    <ThemeToggle />       ← ícone Sun/Moon
    <NotificationBell />  ← ícone Bell (futuro)
    <UserMenu />          ← avatar + dropdown
  </div>
</header>
```

**Breadcrumb:**
- Texto: `text-sm text-muted-foreground`
- Separador: `›` em `opacity-50`
- Último item (página atual): `font-semibold text-foreground`
- Ocultar no mobile (`hidden sm:flex`)

**Regras:**
- Nunca duplicar filtros de página na Topbar — filtros ficam no PageHeader
- UserMenu é um Shadcn `DropdownMenu` com: nome do usuário, role, separador, "Sair"

---

## 4. PageHeader

**O que é:** Cabeçalho interno de cada página. Fica dentro do conteúdo scrollável, abaixo da Topbar.

**Anatomia:**
```
<div class="px-5 pt-5 pb-4 flex items-end justify-between gap-4 flex-wrap">
  <div>
    <h1 class="text-xl font-semibold text-foreground tracking-tight">Visão Geral de Vendas</h1>
    <p class="text-sm text-muted-foreground mt-1">Rede JAM · Abril 2026</p>  ← opcional
  </div>
  <PageActions />  ← filtros + botões de ação
</div>
```

**PageActions — componentes comuns:**
- `PeriodSelector`: segmented control com "Hoje / Esta semana / Este mês / Mês anterior"
- `LocationSelect`: Shadcn `Select` para filtrar por unidade
- Botão de exportar (quando aplicável)

**PeriodSelector:**
```
<div class="inline-flex p-[3px] bg-muted rounded-[7px] gap-0.5">
  {periods.map(p => (
    <button class={cn(
      "h-7 px-3 text-xs font-medium rounded-[5px] transition-all duration-100",
      active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
    )}>{p.label}</button>
  ))}
</div>
```

---

## 5. KpiCard

**O que é:** Card de métrica chave. Sempre aparece em grid na parte superior das páginas.

**Anatomia:**
```
<div class="relative bg-card border border-border rounded shadow-sm overflow-hidden flex flex-col min-h-[108px] p-[14px]">

  {/* Sparkline de fundo — decorativa */}
  <Sparkline class="absolute inset-0 opacity-25 pointer-events-none z-0" />

  {/* Conteúdo — z-index acima da sparkline */}
  <div class="relative z-10 flex flex-col h-full">
    <span class="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
      <Icon size={12} strokeWidth={1.6} />
      Receita Bruta
    </span>

    <span class="text-[22px] font-semibold text-foreground tracking-tight tabular-nums mt-1.5 mb-2 leading-none">
      R$ 284k
    </span>

    <div class="mt-auto flex flex-col gap-0.5">
      <DeltaTag value={8.7} label="vs mês ant." />
      <DeltaTag value={12.3} label="vs ano ant." />  ← opcional
    </div>
  </div>

</div>
```

**Grid de KpiCards:**
```
{/* 5 cards */}
<div class="grid gap-[14px] grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">

{/* 4 cards */}
<div class="grid gap-[14px] grid-cols-2 lg:grid-cols-4">

{/* 3 cards */}
<div class="grid gap-[14px] grid-cols-1 sm:grid-cols-3">
```

**Regras:**
- A sparkline é sempre decorativa — `aria-hidden`, `pointer-events-none`
- Valor numérico usa `tabular-nums` para alinhamento estável
- `DeltaTag` sempre mostra "vs mês ant." — "vs ano ant." é opcional
- Nunca truncar o valor — se não couber, reduzir `kpi-val-size`
- Ícone no label é opcional mas recomendado para diferenciação rápida

---

## 6. DataTable

**O que é:** Tabela de dados analíticos. Usada em rankings, listas de produtos, histórico.

**Anatomia:**
```
<div class="overflow-x-auto">
  <table class="w-full text-sm border-collapse">
    <thead>
      <tr class="border-b border-border">
        <th class="text-[11px] font-medium text-muted-foreground text-left px-3.5 py-2.5 first:pl-5 last:pr-5 whitespace-nowrap">
          Produto
        </th>
        <th class="text-[11px] font-medium text-muted-foreground text-right px-3.5 py-2.5 tabular-nums">
          Receita
        </th>
      </tr>
    </thead>
    <tbody>
      <tr class="border-b border-border last:border-0 hover:bg-muted/60 cursor-pointer transition-colors duration-100">
        <td class="px-3.5 py-[10px] first:pl-5 last:pr-5 text-foreground">
          {/* conteúdo da célula */}
        </td>
        <td class="px-3.5 py-[10px] text-right tabular-nums text-foreground">
          R$ 12.400
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="border-t border-border bg-muted/40">
        <td class="px-5 py-3 font-semibold text-foreground">Total</td>
        <td class="px-3.5 py-3 text-right tabular-nums font-semibold">R$ 284k</td>
      </tr>
    </tfoot>
  </table>
</div>
```

**Células especiais:**

```tsx
{/* Ranking */}
<td class="w-8 text-[12px] font-medium text-muted-foreground tabular-nums">#1</td>

{/* Segmento com dot de cor */}
<td class="flex items-center gap-2.5">
  <span class="w-2 h-2 rounded-[2px]" style={{ background: color }} />
  Combustível
</td>

{/* Barra de progresso inline */}
<td class="min-w-[120px]">
  <div class="flex items-center gap-2">
    <div class="flex-1 h-[5px] bg-muted rounded-full overflow-hidden">
      <div class="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
    <span class="text-[11px] text-muted-foreground tabular-nums w-10 text-right">
      {pct.toFixed(1)}%
    </span>
  </div>
</td>

{/* Sparkline inline */}
<td class="min-w-[110px]">
  <div class="flex items-center gap-2">
    <Sparkline width={72} height={22} data={trend} color={color} />
    <DeltaTag value={delta} compact />
  </div>
</td>
```

**Regras:**
- Colunas numéricas: sempre `text-right tabular-nums`
- Linha clicável (drill-down): `cursor-pointer hover:bg-muted/60`
- Linhas alternadas: nunca — usar apenas hover
- `tfoot` só aparece quando há total/subtotal
- Máximo de colunas visíveis em mobile: 3 (nome + 1 valor + delta)

---

## 7. SectionCard

**O que é:** Container padrão para cada seção de conteúdo. Agrupa título + conteúdo.

**Anatomia:**
```
<div class="bg-card border border-border rounded shadow-sm">

  {/* Header do card */}
  <div class="flex items-start justify-between gap-3 px-[16px] pt-[14px] pb-2">
    <div>
      <h2 class="text-[13px] font-semibold text-foreground tracking-[-0.1px]">
        Evolução de Vendas
      </h2>
      <p class="text-xs text-muted-foreground mt-0.5">Receita bruta e margem no período</p>
    </div>
    <div class="flex items-center gap-2">
      {/* Ações do card: toggles, selects, botões */}
    </div>
  </div>

  {/* Corpo do card */}
  <div class="px-[16px] pb-[14px]">
    {children}
  </div>

</div>
```

**Variante sem header:**
```
<div class="bg-card border border-border rounded shadow-sm p-[16px]">
  {children}
</div>
```

**Regras:**
- Nunca aninhar SectionCards
- Ações no header do card: máximo 3 elementos
- Separador entre header e body: nunca usar `<hr>` — o espaçamento é suficiente

---

## 8. FilterBar

**O que é:** Barra de filtros que aparece entre o PageHeader e o conteúdo.

**Anatomia:**
```
<div class="flex items-center gap-2.5 flex-wrap px-5 pb-4">
  <span class="text-[11px] font-medium text-muted-foreground">Filtrar por:</span>

  <Select>          ← Shadcn Select — ex: "Todos os postos"
  <Select>          ← Shadcn Select — ex: "Todas as categorias"

  <div class="flex-1" />  ← spacer

  <Button variant="outline" size="sm">
    <Download size={12} />
    Exportar
  </Button>
</div>
```

**Regras:**
- Filtros à esquerda, ações à direita
- Nunca duplicar o PeriodSelector do PageHeader na FilterBar
- Máximo de 4 filtros antes de mover para um modal/drawer

---

## 9. StatusBadge

**O que é:** Indicador de estado com cor semântica. Usado em sync status, conectores, alertas.

**Variantes:**
```tsx
// success
<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium
             bg-success-subtle text-success border border-success/30">
  <span class="w-1.5 h-1.5 rounded-full bg-success" />
  Online
</span>

// warning
bg-warning-subtle text-warning border-warning/30

// danger
bg-danger-subtle text-danger border-danger/30

// neutral
bg-muted text-muted-foreground border-border

// primary
bg-primary-subtle text-primary border-primary/30
```

**Dot pulsante (sync ativo):**
```tsx
<span class="relative w-2.5 h-2.5">
  <span class="absolute inset-0 rounded-full bg-success animate-ping opacity-75" />
  <span class="relative w-2.5 h-2.5 rounded-full bg-success block" />
</span>
```

---

## 10. DeltaTag

**O que é:** Indicador de variação percentual. Sempre acompanha um KPI.

```tsx
// positivo
<span class="text-[11px] text-success flex items-center gap-1">
  <ArrowUp size={10} strokeWidth={2.5} />
  8,7%
</span>

// negativo
<span class="text-[11px] text-danger flex items-center gap-1">
  <ArrowDown size={10} strokeWidth={2.5} />
  3,2%
</span>

// neutro (< 0.15% de variação)
<span class="text-[11px] text-muted-foreground flex items-center gap-1">
  <ArrowRight size={10} strokeWidth={2.5} />
  0,0%
</span>
```

**Com label:**
```tsx
<div class="flex items-center gap-1.5">
  <DeltaTag value={8.7} />
  <span class="text-[11px] text-muted-foreground lowercase">vs mês ant.</span>
</div>
```

**Regras:**
- Threshold neutro: `|value| < 0.15`
- Valor em p.p. (pontos percentuais): exibir `p.p.` em vez de `%`
- Nunca usar cor verde para "mais CMV" — positivo/negativo é contextual. Passar `invertColors` quando aumento é ruim.

---

## 11. Toast

**O que é:** Notificação temporária de sistema. Usado para confirmar ações e erros.

```tsx
<div class="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3
            bg-card border border-border rounded shadow-md text-sm text-foreground
            transition-all duration-200 translate-y-0 opacity-100">
  <CheckCircle size={18} class="text-success flex-shrink-0" />  ← ou AlertCircle para erro
  Sync iniciado com sucesso
</div>
```

**Regras:**
- Duração: 3 segundos para sucesso, 6 segundos para erro (ou até o usuário fechar)
- Nunca empilhar mais de 3 toasts
- Usar Shadcn `Sonner` ou implementação própria — nunca `alert()`

---

## 12. EmptyState

**O que é:** Placeholder quando não há dados para exibir.

```tsx
<div class="flex flex-col items-center justify-center text-center py-10 px-6
            border-[1.5px] border-dashed border-border rounded bg-muted/30">
  <div class="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
    <BarChart2 size={18} class="text-muted-foreground" />
  </div>
  <p class="text-sm font-semibold text-foreground mb-1">Sem dados no período</p>
  <p class="text-xs text-muted-foreground max-w-xs">
    Nenhuma venda registrada para os filtros selecionados.
  </p>
</div>
```

**Regras:**
- Sempre dentro de um SectionCard
- Nunca usar EmptyState como estado de loading — usar SkeletonLoader
- Texto deve ser específico ao contexto, não genérico ("Sem dados")

---

## 13. SkeletonLoader

**O que é:** Placeholder animado durante carregamento de dados.

```tsx
// KPI skeleton
<div class="h-[108px] rounded bg-muted animate-pulse" />

// Table skeleton
{Array.from({length: 5}).map((_, i) => (
  <tr key={i} class="border-b border-border">
    <td class="px-5 py-[10px]"><div class="h-4 w-32 bg-muted rounded animate-pulse" /></td>
    <td class="px-3.5 py-[10px] text-right"><div class="h-4 w-20 bg-muted rounded animate-pulse ml-auto" /></td>
  </tr>
))}

// Chart skeleton
<div class="h-[260px] rounded bg-muted animate-pulse" />
```

**Regras:**
- Sempre usar o mesmo layout do componente que vai substituir — nunca um spinner genérico no lugar de uma tabela
- Cor: `bg-muted animate-pulse` — nunca usar cores mais escuras que o fundo do card

---

## 14. Drawer

**O que é:** Painel lateral que desliza da direita. Usado para drill-down de detalhes.

**Anatomia:**
```tsx
{/* Overlay */}
<div class={cn(
  "fixed inset-0 z-40 bg-foreground/40 transition-opacity duration-180",
  open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
)} onClick={onClose} />

{/* Painel */}
<div class={cn(
  "fixed right-0 top-0 bottom-0 z-41 w-[420px] max-w-[92vw] bg-card border-l border-border shadow-md",
  "flex flex-col overflow-hidden",
  "transition-transform duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]",
  open ? "translate-x-0" : "translate-x-full"
)}>

  {/* Header */}
  <div class="flex items-center gap-2.5 px-5 py-[18px] border-b border-border flex-shrink-0">
    <h2 class="flex-1 text-[15px] font-semibold text-foreground flex items-center gap-2.5">
      <Fuel size={16} />
      Gasolina Comum
    </h2>
    <button onClick={onClose} class="btn-ghost btn-icon">
      <X size={16} />
    </button>
  </div>

  {/* Body */}
  <div class="flex-1 overflow-y-auto p-5">
    <DrawerRow label="Receita" value="R$ 84.200" />
    <DrawerRow label="Volume" value="28.400 L" />
    ...
  </div>

</div>
```

**DrawerRow:**
```tsx
<div class="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-sm">
  <span class="text-muted-foreground">{label}</span>
  <span class="font-semibold text-foreground tabular-nums">{value}</span>
</div>
```

---

## 15. LineAreaChart

**Recharts `AreaChart`** com gradiente de área.

```tsx
<AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
  <defs>
    <linearGradient id="grad-receita" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor={CHART_COLORS.combustivel} stopOpacity={0.5} />
      <stop offset="95%" stopColor={CHART_COLORS.combustivel} stopOpacity={0.05} />
    </linearGradient>
  </defs>
  <CartesianGrid vertical={false} stroke={CHART_GRID.stroke} />
  <XAxis dataKey="label" tick={CHART_TICK} tickLine={false} axisLine={false} />
  <YAxis tick={CHART_TICK} tickLine={false} axisLine={false} tickFormatter={fmtBRLk} />
  <Tooltip content={<CustomTooltip />} />
  <Area type="monotone" dataKey="receita" stroke={CHART_COLORS.combustivel}
        fill="url(#grad-receita)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
</AreaChart>
```

**Regras:**
- `dot={false}` sempre — pontos só aparecem no hover via `activeDot`
- `type="monotone"` para suavidade
- Grid: apenas linhas horizontais (`vertical={false}`)
- Eixos: sem linha (`axisLine={false}`), sem tick (`tickLine={false}`)
- `CustomTooltip` sempre — nunca o tooltip padrão do Recharts

---

## 16. ComposedChart

**Recharts `ComposedChart`** para linha + barra combinados.

**Casos de uso:** DRE (receita barra + margem linha), evolução com benchmark.

```tsx
<ComposedChart data={data}>
  <CartesianGrid vertical={false} stroke={CHART_GRID.stroke} />
  <XAxis dataKey="label" tick={CHART_TICK} tickLine={false} axisLine={false} />
  <YAxis yAxisId="left" tick={CHART_TICK} tickLine={false} axisLine={false} tickFormatter={fmtBRLk} />
  <YAxis yAxisId="right" orientation="right" tick={CHART_TICK} tickLine={false} axisLine={false} tickFormatter={v => v + '%'} />
  <Tooltip content={<CustomTooltip />} />
  <Legend iconType="circle" iconSize={8} />
  <Bar yAxisId="left" dataKey="receita" fill={CHART_COLORS.combustivel} radius={[3,3,0,0]} maxBarSize={40} />
  <Line yAxisId="right" type="monotone" dataKey="margemPct" stroke={CHART_COLORS.conveniencia}
        strokeWidth={2} dot={false} strokeDasharray="6 4" />
</ComposedChart>
```

---

## 17. DonutChart

**Recharts `PieChart`** com `innerRadius` alto.

```tsx
<PieChart>
  <Pie data={data} dataKey="value" innerRadius="65%" outerRadius="90%"
       paddingAngle={2} strokeWidth={0}>
    {data.map((entry, i) => (
      <Cell key={i} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip content={<CustomTooltip />} />
</PieChart>
```

**Centro customizável** — absoluto sobre o PieChart:
```tsx
<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
  <span class="text-[10px] font-semibold uppercase tracking-[0.8px] text-muted-foreground">Total</span>
  <span class="text-[14px] font-semibold text-foreground tabular-nums mt-0.5">R$ 284k</span>
</div>
```

**Legenda do Donut** (fora do gráfico):
```tsx
<div class="grid grid-cols-2 gap-x-3.5 gap-y-2.5 mt-4">
  {data.map(d => (
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 rounded-[2px] flex-shrink-0" style={{ background: d.color }} />
      <span class="flex-1 text-xs text-muted-foreground truncate">{d.name}</span>
      <span class="text-xs font-semibold text-foreground tabular-nums">{d.pct}%</span>
    </div>
  ))}
</div>
```

---

## 18. BarChart

**Recharts `BarChart`** horizontal ou vertical.

**Horizontal** (rankings):
```tsx
<BarChart layout="vertical" data={data}>
  <CartesianGrid horizontal={false} stroke={CHART_GRID.stroke} />
  <XAxis type="number" tick={CHART_TICK} tickLine={false} axisLine={false} tickFormatter={fmtBRLk} />
  <YAxis type="category" dataKey="name" tick={CHART_TICK} tickLine={false} axisLine={false} width={120} />
  <Tooltip content={<CustomTooltip />} />
  <Bar dataKey="value" fill={CHART_COLORS.combustivel} radius={[0,3,3,0]} maxBarSize={24} />
</BarChart>
```

---

## 19. Sparkline

**SVG inline** — sem Recharts.

```tsx
function Sparkline({ data, color, width = 200, height = 60, opacity = 0.25 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * width);
  const ys = data.map(v => height - 4 - ((v - min) / range) * (height * 0.45));
  const path = buildSmoothPath(xs, ys);
  const area = `${path} L ${width},${height} L 0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
         style={{ opacity, display: 'block', width: '100%', height: '100%' }}
         aria-hidden="true">
      <path d={area} fill={color} fillOpacity={0.22} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.4}
            strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

**Casos de uso:**
- `opacity={0.25}` — sparkline de fundo do KpiCard
- `opacity={1}` — sparkline inline em células de tabela (menor, sem área)

---

## 20. Heatmap

**CSS Grid + lógica de cor em JS** — sem biblioteca.

```tsx
function Heatmap({ data, weeks, days }) {
  const max = Math.max(...data.flat());

  return (
    <div class="flex gap-2">
      {/* Labels de dia */}
      <div class="flex flex-col gap-[5px] pt-[22px]">
        {days.map(d => (
          <div class="h-9 flex items-center text-[11px] text-muted-foreground">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div class="flex-1 flex flex-col gap-[5px]">
        {/* Labels de semana */}
        <div class="flex gap-[5px] mb-1">
          {weeks.map(w => (
            <div class="flex-1 text-center text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{w}</div>
          ))}
        </div>

        {/* Células */}
        {days.map((_, di) => (
          <div class="flex gap-[5px]">
            {weeks.map((_, wi) => {
              const value = data[di][wi];
              const intensity = value / max;
              return (
                <div class="flex-1 h-9 rounded-[5px] flex items-center justify-center
                            text-[10px] font-medium tabular-nums transition-transform hover:scale-105"
                     style={{
                       background: `hsl(204 100% ${97 - intensity * 60}%)`,
                       color: intensity > 0.5 ? 'white' : 'hsl(var(--foreground))'
                     }}>
                  {value > 0 ? fmtK(value) : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 21. Primitivos Shadcn em uso

Componentes instalados via Shadcn CLI. Nunca reescrever do zero — usar os componentes do Shadcn e estilizar via `className`.

| Componente | Uso no PostoInsight | Customizações |
|------------|--------------------|-|
| `Button` | Ações primárias, outline, ghost, icon | `size="sm"` é o padrão (h-8) |
| `Select` | Filtros de período e location | Trigger com `h-8 text-sm` |
| `Card` | Base para SectionCard | Não usar diretamente — usar SectionCard |
| `Badge` | Status, segmentos | Estender com variantes semânticas |
| `Table` | Base para DataTable | Não usar diretamente — usar DataTable |
| `Tabs` | Alternância de visualização dentro de cards | `size="sm"` |
| `Dialog` | Modais de confirmação | Nunca para formulários complexos |
| `Tooltip` | Info adicional em ícones e valores truncados | Delay 400ms |
| `Separator` | Divisórias verticais na Topbar | |
| `Skeleton` | Loading states | Usar dimensões exatas do componente alvo |
| `Avatar` | User menu, TenantBadge | Fallback com iniciais |
| `DropdownMenu` | User menu, ações de contexto | |
| `Sheet` | Alternativa mobile ao Drawer | Apenas mobile |
| `Alert` | Banners de erro de sync | Variantes: default, destructive |
| `Input` | Formulários de settings | `h-8 text-sm` |
| `Label` | Labels de formulário | Sempre associado ao Input via `htmlFor` |
| `Sonner` | Toast notifications | Substituir implementação manual |

---

*Componente não está aqui? Não implementar sem antes adicionar a spec neste documento.*

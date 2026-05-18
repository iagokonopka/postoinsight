# FRONTEND_SPEC.md — PostoInsight

> Documento de especificação de frontend gerado via design discovery.
> Baseado em: PRD v1.2 + design-tokens.md + decisões de produto coletadas em 17/05/2026.
> **Este documento é a fonte de verdade para implementação do apps/web.**
> Qualquer decisão visual ou comportamental não coberta aqui deve ser adicionada antes de codar.

---

## 1. Mapa de Telas

| Rota | Nome | Acesso | Descrição |
|------|------|--------|-----------|
| `/login` | Login | Público | Autenticação via Auth.js |
| `/` | Redirect | Autenticado | Redireciona para `/dashboard` |
| `/dashboard` | Dashboard | owner, manager, viewer | Visão geral consolidada da operação |
| `/combustivel` | Combustível | owner, manager, viewer | Análise de volume e receita por produto combustível |
| `/conveniencia` | Conveniência & Serviços | owner, manager, viewer | Análise de loja, ranking de grupos, scatter de categorias |
| `/dre` | DRE Mensal | owner, viewer | Demonstrativo de resultado mensal |
| `/settings` | Configurações | owner | Preferências de tenant, toggle de multi-location |
| `/settings/users` | Usuários | owner | Gestão de usuários do tenant |

---

## 2. Shell da Aplicação

### 2.1 Layout Base

```
┌─────────────────────────────────────────────────────────────────┐
│  TOPBAR (h-14, bg-sidebar = slate-800)                          │
│  [Logo PI] [Spacer] [Sync Status] [User Menu]                   │
├──────────┬──────────────────────────────────────────────────────┤
│          │  PAGE HEADER (bg-card, border-b)                     │
│ SIDEBAR  │  [Título] [Filtro Global: Período + Location]        │
│  w-60    ├──────────────────────────────────────────────────────┤
│ slate-800│  CONTEÚDO PRINCIPAL (bg-background = slate-50)       │
│          │  p-6, gap-6 entre seções                             │
│          │                                                       │
└──────────┴──────────────────────────────────────────────────────┘
```

### 2.2 Topbar

- **Altura:** `h-14` (56px)
- **Background:** `--sidebar` (slate-800)
- **Elementos (esquerda → direita):**
  - Logo "PI" em azul primário (igual sidebar) — `px-4`
  - `flex-1` spacer
  - **Sync Status Widget** (ver seção 8.1)
  - **User Menu** — avatar + nome + dropdown (logout, settings)
- **Z-index:** acima do conteúdo, abaixo de modais/drawers

### 2.3 Sidebar

- **Largura:** `w-60` (240px), fixa, não colapsável
- **Background:** `--sidebar` (slate-800)
- **Estrutura:**
  ```
  [Logo + nome do tenant]  ← topo, px-4 py-5
  ─────────────────────
  Nav items:
    Dashboard
    Combustível
    Conveniência
    DRE
  ─────────────────────
  [flex-1 spacer]
  Configurações           ← bottom
  ```
- **Item ativo:** texto `white` + `bg-sidebar-active-bg` (slate-950) + borda esquerda 2px `primary`
- **Item inativo:** texto `slate-400`, hover `bg-sidebar-muted` (slate-700)
- **Badge de erro de sync:** ícone ⚠ em `--warning` aparece ao lado do item de nav ativo quando sync está com falha (ver seção 8.2)

### 2.4 Page Header

Presente em todas as telas autenticadas, abaixo da topbar.

- **Background:** `--card` (branco)
- **Border:** `border-b border-border`
- **Padding:** `px-6 py-4`
- **Estrutura:**
  ```
  [Título da seção]    [Filtro de Período] [Filtro de Location]
  ```
- Título: `text-xl font-semibold text-foreground`
- Filtros: `Select` Shadcn/ui, alinhados à direita, gap-2

---

## 3. Sistema de Filtros Globais

### 3.1 Comportamento Padrão

- Os filtros de **Período** e **Location** vivem no **Page Header** de cada tela
- São **globais com override por tela**: ao trocar de tela, o filtro anteriormente selecionado é mantido como default, mas cada tela pode ignorar ou substituir
- Estado dos filtros é mantido em **React Context** (`FilterContext`) durante a sessão — não persiste entre sessões
- O **DRE** tem comportamento especial: ignora o filtro de Período global e usa seu próprio seletor de mês (ver seção 7)

### 3.2 Filtro de Período

Opções disponíveis (em ordem no Select):

| Label | Valor | Descrição |
|-------|-------|-----------|
| Hoje | `today` | `date_trunc('day', now())` |
| Ontem | `yesterday` | Dia anterior completo |
| Últimos 7 dias | `7d` | Rolling — hoje − 7 dias |
| Semana atual | `this_week` | Segunda a hoje |
| Mês atual | `this_month` | 1° ao dia corrente |
| Personalizado | `custom` | Abre date range picker |

- Default inicial: **Mês atual**
- Ao selecionar `custom`: abre `Popover` com dois `Calendar` Shadcn/ui (início + fim), botão "Aplicar"
- Limite máximo de range customizado: 90 dias (acima disso, mostrar warning inline)

### 3.3 Filtro de Location

- **Se tenant tem 1 location:** filtro de location **não aparece** em nenhuma tela. A location única é usada implicitamente em todas as queries.
- **Se tenant tem 2+ locations E multi-location está habilitado nas configurações:**
  - Select com opções: `Todas as locations` (default) + uma opção por location
  - Default inicial: **Todas as locations** (consolidado)
  - Selecionar uma location específica filtra todos os componentes da tela
- **Se multi-location está desabilitado nas configurações (owner choice):** filtro não aparece, comporta-se como 1 location

### 3.4 Regra de Propagação

Quando o usuário muda um filtro no Page Header:
1. Todos os componentes da tela atual re-fetching com o novo filtro
2. Ao navegar para outra tela, os valores dos filtros são preservados no Context e aplicados como default naquela tela
3. Exceção: tela de DRE não herda o filtro de Período — usa seu próprio seletor de mês

---

## 4. Comportamento Condicional: 1 Location vs Multi-location

### 4.1 Toggle de Multi-location (Settings)

- Em `/settings`, o owner vê uma seção **"Visão multi-unidade"**
- Toggle: "Ativar comparativo entre postos" — `Switch` Shadcn/ui
- Default: **habilitado** se tenant tem 2+ locations; **oculto** se tenant tem apenas 1
- Quando desabilitado: toda a UI se comporta como se houvesse 1 location (sem filtro de location, sem componentes comparativos)

### 4.2 Componentes que mudam por contexto

| Componente | 1 location (ou multi desabilitado) | Multi-location habilitado |
|---|---|---|
| Filtro de Location no header | **Oculto** | Visível |
| Mini barras por location (Dashboard) | **Oculto** — espaço vazio ou substituído por top produtos | Visível |
| Barras agrupadas por location (Combustível) | **Oculto** — mostra só tabela simples | Visível |
| Filtro de location no DRE | **Oculto** — só consolidado | Visível |

**Regra de implementação:** nunca renderizar componentes comparativos desabilitados/vazios. Ou aparecem funcionais, ou não aparecem.

---

## 5. Tela: Dashboard (`/dashboard`)

### 5.1 Estrutura de Layout

```
[Page Header: "Dashboard" | Filtro Período | Filtro Location]
─────────────────────────────────────────────────────────────
[KPI Row]          5 cards, grid 5 colunas
─────────────────────────────────────────────────────────────
[Gráfico Principal dual-axis]    [Donut de segmentos]
         ~65% largura                  ~35% largura
─────────────────────────────────────────────────────────────
[Mini barras por location]       ← só se multi-location
─────────────────────────────────────────────────────────────
[Ranking Top-10 produtos]        ← afetado pelo cross-filter do donut
─────────────────────────────────────────────────────────────
```

### 5.2 KPI Row

**5 cards, nesta ordem:**

1. **Receita Bruta** — `Σ vlr_total` do período
2. **Margem Bruta %** — `(receita_líquida - CMV) / receita_líquida × 100`
3. **Volume Combustível** — `Σ qtd_venda WHERE categoria IN ('CB','ARL')` em litros
4. **Ticket Médio** — `receita_bruta / count(distinct nf_numero)`
5. **CMV %** — `Σ(custo_unit × qtd) / receita_bruta × 100`

**Cada KPI card contém:**
- Label (`text-sm text-muted-foreground`)
- Valor principal (`text-3xl font-bold text-foreground`) — formatado (R$, L, %)
- Delta vs período anterior: `+3,2%` em verde ou `-1,4%` em vermelho (`text-sm font-medium`)
- Sparkline de 30 pontos (últimos 30 dias) — `width: 80px, height: 32px`, sem eixos, cor `--primary`

**Comportamento de loading:** substituir card inteiro por `Skeleton` com mesmas dimensões.

### 5.3 Gráfico Principal (Dual-axis)

- **Tipo:** ECharts — barras + linha, dual-axis
- **Eixo Y esquerdo:** Receita Bruta (R$)
- **Eixo Y direito:** Margem Bruta % 
- **Eixo X:** datas do período selecionado (granularidade: dia se ≤31 dias, semana se ≤90 dias)
- **Barras:** cor `--data-combustivel` (#0073BB) com `borderRadius: [4,4,0,0]`
- **Linha:** cor `--data-conveniencia` (#EC7211), `lineStyle.width: 2`, sem símbolo
- **Tooltip:** ao hover, mostra data + receita bruta (R$) + margem % — formato Shadcn tooltip
- **Toolbar:** nenhum (sem zoom, sem download)
- **Tema:** `postoinsight` (registrado via `echarts.registerTheme`)
- **Tamanho:** `width: 100%, height: 320px`

### 5.4 Donut de Segmentos (com cross-filter)

- **Tipo:** ECharts — `type: 'pie'`, `radius: ['40%', '70%']`
- **Segmentos e cores:**
  - Combustível → `--data-combustivel` (#0073BB)
  - Conveniência → `--data-conveniencia` (#EC7211)
  - Lubrificantes → `--data-lubrificantes` (#6B40C4)
  - Serviços → `--data-servicos` (teal)
- **Cada fatia mostra:** `{segmento}: {%}` no tooltip (hover)
- **Interação de cross-filter:**
  - Clicar numa fatia: aplica filtro de segmento no componente "Ranking Top-10 produtos" abaixo
  - Fatia selecionada fica destacada (offset visual do ECharts `selectedOffset: 8`)
  - Clicar novamente na fatia selecionada: remove o filtro (volta a mostrar todos)
  - Label acima do donut muda para "Mostrando: Combustível" (ou "Todos os segmentos")
  - Este filtro é **local à tela** — não persiste ao navegar
- **Tamanho:** `height: 280px`

### 5.5 Mini Barras por Location

**Visível somente se multi-location habilitado.**

- **Layout:** grid horizontal, um mini-card por location
- **Cada mini-card contém:**
  - Nome da location (`text-sm font-medium`)
  - Barra de progresso horizontal (largura proporcional à receita relativa entre as locations)
  - Valor de receita bruta (`text-sm text-muted-foreground`)
  - Delta % vs período anterior
- **Ordenação:** por receita bruta decrescente
- **Máximo exibido:** 6 locations (se mais, mostrar "Ver todas")
- **Background:** `--card`, `border border-border`, `rounded-lg`, `p-4`
- **Substituto se 1 location:** este bloco inteiro não é renderizado. O espaço pode ser ocupado pelo Ranking Top-10 expandido verticalmente.

### 5.6 Ranking Top-10 Produtos

- **Título:** "Top produtos" + badge com segmento ativo se cross-filter aplicado
- **Colunas:** Produto | Receita | Participação % | Margem %
- **Componente:** `Table` Shadcn/ui
- **Ordenação default:** Receita decrescente. Colunas "Receita" e "Margem %" são clicáveis para reordenar
- **Cross-filter:** quando donut tem segmento selecionado, a query de produtos filtra por aquele segmento
- **Linhas:** máximo 10. Sem paginação.
- **Linha de skeleton:** 10 linhas de `Skeleton` durante loading

---

## 6. Tela: Combustível (`/combustivel`)

### 6.1 Estrutura de Layout

```
[Page Header: "Combustível" | Filtro Período | Filtro Location]
─────────────────────────────────────────────────────────────
[KPI Row]           4 cards
─────────────────────────────────────────────────────────────
[Gráfico de evolução por produto]    ← toggles: linha/área, volume/receita
─────────────────────────────────────────────────────────────
[Barras agrupadas por location]      ← só se multi-location
─────────────────────────────────────────────────────────────
[Tabela de breakdown por produto]
─────────────────────────────────────────────────────────────
```

### 6.2 KPI Row (4 cards)

1. **Volume Total** — litros totais do período
2. **Receita Bruta** — receita combustível do período
3. **Margem Bruta %** — margem do segmento combustível
4. **Preço Médio/L** — receita / volume

Mesma estrutura de card descrita em 5.2 (valor + delta + sparkline).

### 6.3 Gráfico de Evolução por Produto

- **Tipo:** ECharts multi-série — uma série por produto (Gasolina Comum, Gasolina Aditivada, Diesel S-10, Diesel Comum, Etanol, Arla 32)
- **Toggle Linha / Área empilhada:** `Tabs` ou `ToggleGroup` Shadcn, muda o `type` de `'line'` para `'line'` com `areaStyle`
- **Toggle Volume / Receita:** muda a métrica do eixo Y
- **Toggle Arla 32:** `Switch` para incluir/excluir Arla 32 das séries
- **Cores:** usar paleta `--data-series-1` a `--data-series-6`
- **Tooltip:** ao hover, lista todos os produtos com valor no período
- **Tamanho:** `height: 300px`

### 6.4 Barras Agrupadas por Location

**Visível somente se multi-location habilitado.**

- **Tipo:** ECharts `type: 'bar'`, `barGap: '10%'`
- **Eixo X:** produtos (Gasolina Comum, Gasolina Aditivada, Diesel S-10, Diesel Comum, Etanol)
- **Eixo Y:** volume (litros) ou receita — segue o toggle do gráfico de evolução acima
- **Séries:** uma por location, cada uma com sua cor (`--data-series-N`)
- **Legenda:** abaixo do gráfico, ícone circular, nome da location
- **Tooltip:** ao hover na barra, mostra location + produto + valor
- **Tamanho:** `height: 260px`
- **Se 1 location:** bloco não renderizado

### 6.5 Tabela de Breakdown por Produto

- **Colunas:** Produto | Volume (L) | Part. % | Receita | CMV | Margem % | Preço/L | Custo/L | Tendência
- **Coluna Tendência:** sparkline de 14 dias + ícone de seta (↑ verde / ↓ vermelho / → cinza), calculado por regressão linear simples nos últimos 14 dias
- **Ordenação:** por Volume decrescente como default. Todas as colunas numéricas são clicáveis
- **Toggle Arla 32:** mesma lógica do gráfico — ao desligar, a linha de Arla 32 some da tabela
- **Componente:** `Table` Shadcn/ui com `sticky` na primeira coluna

---

## 7. Tela: Conveniência (`/conveniencia`)

### 7.1 Estrutura de Layout

```
[Page Header: "Conveniência & Serviços" | Filtro Período | Filtro Location]
─────────────────────────────────────────────────────────────
[KPI Row]           3 cards
─────────────────────────────────────────────────────────────
[Gráfico de evolução: área empilhada]    [Donut mix por segmento da loja]
─────────────────────────────────────────────────────────────
[Scatter plot: qtd × margem]             [Top 10 grupos expansível]
─────────────────────────────────────────────────────────────
[Tabela de breakdown por categoria]      ← afetada pelo scatter cross-filter
─────────────────────────────────────────────────────────────
```

### 7.2 KPI Row (3 cards)

1. **Receita Bruta** — segmentos não-combustível
2. **Margem Bruta %** — margem da loja
3. **Ticket Médio** — ticket médio não-combustível

### 7.3 Gráfico de Evolução (Área Empilhada)

- **Tipo:** ECharts área empilhada, `stack: 'total'`
- **Séries:** Receita Bruta (área) + Margem Bruta (linha sobreposta, eixo direito)
- **Cores:** receita em `--data-conveniencia` (#EC7211), margem em `--data-lubrificantes` (#6B40C4)
- **Tamanho:** `height: 260px`

### 7.4 Scatter Plot (com cross-filter)

- **Tipo:** ECharts `type: 'scatter'`
- **Eixo X:** Quantidade vendida (unidades)
- **Eixo Y:** Margem % 
- **Tamanho da bolha:** proporcional à Receita Bruta da categoria (`symbolSize` calculado por escala logarítmica)
- **Linhas de mediana:** duas linhas de referência (ECharts `markLine`) — mediana de X e mediana de Y — criando 4 quadrantes
- **Labels dos quadrantes** (texto fixo em cada canto, cor `--muted-foreground`):
  - Top-right: "Alto potencial"
  - Top-left: "Nicho"
  - Bottom-right: "Volume, baixa margem"
  - Bottom-left: "Rever estratégia"
- **Tooltip ao hover:** nome da categoria + qtd + margem % + receita
- **Interação de cross-filter:**
  - Clicar numa bolha: seleciona a categoria, filtra a "Tabela de breakdown" abaixo para mostrar só os produtos daquela categoria
  - Bolha selecionada: borda destacada (`borderColor: primary, borderWidth: 2`)
  - Clicar novamente: remove seleção (mostra todas as categorias na tabela)
  - Label acima da tabela muda para "Produtos de: [categoria]" quando filtrado
- **Tamanho:** `height: 300px`

### 7.5 Top 10 Grupos (Lista Expansível)

- **Ordenação:** por receita bruta decrescente
- **Cada item de grupo** (nível 1):
  - Ícone de chevron + Nome do grupo + Receita + Margem % + Badge de participação %
  - Clicar: expande `Accordion` mostrando as categorias dentro do grupo
- **Cada item de categoria** (nível 2, dentro do accordion):
  - Nome da categoria + Receita + Margem % + Qtd vendida (recuado `pl-6`)
- **Limite:** top 10 grupos. Categorias dentro do grupo: todas.
- **Componente:** `Accordion` Shadcn/ui, `type: "multiple"` (pode expandir vários ao mesmo tempo)

### 7.6 Tabela de Breakdown por Categoria

- **Título muda dinamicamente:** "Todas as categorias" / "Produtos de: [categoria selecionada no scatter]"
- **Colunas:** Categoria | Receita | Qtd | Margem % | CMV | Part. %
- **Afetada pelo cross-filter do scatter** (ver 7.4)
- **Quando filtrada:** botão "Limpar filtro ×" ao lado do título

---

## 8. Tela: DRE (`/dre`)

### 8.1 Estrutura de Layout

```
[Page Header: "DRE Mensal" | Seletor de Mês | Filtro Location*]
─────────────────────────────────────────────────────────────
[KPI Row]           3 cards do mês selecionado
─────────────────────────────────────────────────────────────
[Waterfall chart]                    [Evolução de margem % — 6 meses]
         ~55% largura                       ~45% largura
─────────────────────────────────────────────────────────────
[Tabela comparativa mês-a-mês]
─────────────────────────────────────────────────────────────
```

*Filtro de Location aparece somente se multi-location habilitado (ver seção 3.3)

### 8.2 Filtro de Período no DRE

- O DRE **não herda** o filtro global de Período
- Usa seu próprio **seletor de mês**: `Select` com meses disponíveis (meses que têm dados em `fato_venda`)
- Navegação por setas ← → entre meses adjacentes
- Default: mês anterior ao corrente (mais recente com dados completos)

### 8.3 Filtro de Location no DRE

- **Se multi-location desabilitado:** não aparece. DRE sempre mostra consolidado da rede.
- **Se multi-location habilitado:** `Select` com "Rede completa" + uma opção por location
- **Edge case — location sem dados no mês:** ao selecionar uma location que não tem dados naquele mês, mostrar empty state inline ("Nenhum dado para [location] em [mês]. Tente outro período.") — não mostrar zeros.

### 8.4 KPI Row (3 cards)

1. **Receita Bruta** do mês
2. **Margem Bruta** (R$) do mês
3. **Margem Bruta %** do mês

Sem sparkline (DRE é por mês, não por dia). Incluir delta vs mesmo mês do ano anterior.

### 8.5 Waterfall Chart

- **Tipo:** ECharts `type: 'bar'` com lógica de waterfall (barras invisíveis de offset + barras coloridas)
- **Colunas (em ordem):**
  1. Receita Bruta — cor `--data-combustivel` (#0073BB)
  2. (−) Descontos — cor `--data-negative` (vermelho)
  3. Receita Líquida — cor `--muted` (cinza, barra de resultado intermediário)
  4. (−) CMV — cor `--data-negative` (vermelho)
  5. Margem Bruta — cor `--data-positive` (verde)
- **Labels nas barras:** valor em R$ acima de cada barra, formatado em milhares (ex: "R$ 124,5k")
- **Hover — tooltip interno por segmento:** ao fazer hover na barra de CMV, tooltip mostra breakdown:
  - CMV Combustível: R$ X
  - CMV Conveniência: R$ X
  - CMV Lubrificantes: R$ X
  - Total CMV: R$ X
  O mesmo hover funciona na barra de Receita Bruta (mostra por segmento)
- **Tamanho:** `height: 300px`

### 8.6 Evolução de Margem % — 6 meses

- **Tipo:** ECharts multi-série de linhas
- **Séries:** uma por segmento (Combustível, Conveniência, Lubrificantes, Serviços) + Total
- **Eixo X:** últimos 6 meses (incluindo o mês selecionado)
- **Eixo Y:** Margem %
- **Cores:** seguir `--data-*` por segmento
- **Tamanho:** `height: 260px`

### 8.7 Tabela Comparativa Mês-a-Mês

- **Linhas do DRE:**
  - Receita Bruta
  - (−) Descontos
  - = Receita Líquida
  - (−) CMV
  - = Margem Bruta
  - Margem Bruta %
- **Colunas:** Linha DRE | Mês atual | Mês anterior | Delta (R$) | Delta (%) | YTD
- **Delta:** colorido — positivo verde, negativo vermelho
- **YTD:** acumulado do ano até o mês selecionado
- **Linha de Margem %:** exibida em itálico, sem R$ (é percentual)
- **Pílula YTD:** `Badge` Shadcn/ui na coluna YTD

---

## 9. Sistema de Sync e Status

### 9.1 Sync Status Widget (Topbar)

Localizado na topbar, à esquerda do user menu.

**Estados visuais:**

| Estado | Aparência |
|--------|-----------|
| OK (< 25h) | Ponto verde + "Atualizado às HH:MM" + botão "↻ Sincronizar" |
| Aviso (25h–48h) | Ponto âmbar + "Há Xh" + botão "↻ Sincronizar" destacado |
| Crítico (> 48h) | Ponto vermelho + "Desatualizado — Xh" + botão pulsando |
| Sincronizando | Spinner + "Sincronizando..." + botão desabilitado |
| Erro de sync | Ponto vermelho + "Falha na sync" + botão "Tentar novamente" |

- **Botão "Sincronizar":** `POST /api/sync/trigger` — ao clicar, estado muda para "Sincronizando..." imediatamente (otimista), polling a cada 3s no endpoint de status
- **Tooltip no widget:** ao hover, mostra data e hora completa da última sync bem-sucedida

### 9.2 Badge de Erro na Sidebar

- Quando sync está em estado **Crítico** ou **Erro**, aparece ícone `⚠` em `--warning` na sidebar, ao lado do nome da tela atual
- **Não bloqueia** o uso do app — é uma notificação, não um impedimento
- Ao clicar no ícone, abre `Tooltip` com "Dados desatualizados. Última sync: [data/hora]"

---

## 10. Drill-down (Drawer Lateral)

### 10.1 Comportamento Geral

Utilizado em qualquer elemento que dispare investigação de detalhe além do que a tela atual mostra.

- **Componente:** `Sheet` Shadcn/ui (drawer), `side: "right"`, `size: "lg"` (640px)
- **Abertura:** desliza da direita, sem esconder a tela original
- **Fechamento:** botão ✕ no canto superior direito, ou clique no overlay, ou tecla `Esc`
- **Header do drawer:** breadcrumb mostrando o contexto ("Dashboard > Combustível > Gasolina Aditivada")
- **Conteúdo:** carregado sob demanda ao abrir (skeleton enquanto carrega)

### 10.2 Pontos de entrada de Drill-down

| Tela | Elemento clicável | Conteúdo do drawer |
|------|-------------------|-------------------|
| Dashboard | Produto no ranking Top-10 | Evolução do produto (30 dias) + breakdown por location |
| Combustível | Produto na tabela de breakdown | Evolução diária + breakdown por bico (se disponível) |
| Conveniência | Bolha no scatter | Produtos da categoria + evolução 30 dias |
| Conveniência | Categoria no accordion expandido | Produtos da categoria + evolução |
| DRE | Linha da tabela | Breakdown da linha por segmento, mês a mês |

---

## 11. Estados Especiais

### 11.1 Loading States

- **KPI Cards:** `Skeleton` com exato mesmo tamanho do card (altura fixa `h-28`)
- **Gráficos:** `Skeleton` com `height` correspondente ao gráfico + label "Carregando..." centralizado
- **Tabelas:** 10 linhas de `Skeleton` com widths proporcionais às colunas
- **Drawer:** skeleton do conteúdo ao abrir

**Estratégia de carregamento:** KPI cards têm query própria (mais simples, retorna rápido). Gráficos e tabelas têm queries separadas. Cada componente carrega e exibe independentemente — sem "loading global" da tela inteira.

### 11.2 Empty States

Acionado quando: novo tenant sem dados, location sem sync, filtro de período sem dados.

**Estrutura do empty state:**
```
[Ícone ilustrativo — SVG simples, não fotografia]
[Título: "Nenhum dado para este período"]
[Subtexto: explicação contextual]
[CTA primário: ex. "Sincronizar agora" → dispara sync]
[CTA secundário: ex. "Tentar outro período" → abre filtro de período]
```

**Variantes por contexto:**

| Contexto | Título | Subtexto | CTA |
|----------|--------|----------|-----|
| Novo tenant, sync nunca rodou | "Aguardando dados do ERP" | "A primeira sincronização pode levar alguns minutos." | "Sincronizar agora" |
| Período sem dados | "Sem dados neste período" | "Tente selecionar um período diferente." | "Alterar período" |
| Location sem dados no mês (DRE) | "Sem dados para [location] em [mês]" | "Este posto não tinha movimento neste período." | "Ver rede completa" |
| Filtro resultou em zero | "Nenhum resultado" | "O filtro selecionado não retornou dados." | "Limpar filtros" |

### 11.3 Estados de Erro de API

- **Erro 500 / timeout:** substituir o componente afetado por card de erro com botão "Tentar novamente" — não quebrar a tela inteira
- **Erro 401:** redirecionar para `/login` com mensagem "Sessão expirada"
- **Erro de query (dados inconsistentes):** mostrar `Alert` Shadcn/ui com mensagem técnica reduzida + botão de retry

---

## 12. Mobile

### 12.1 Breakpoints

| Breakpoint | Largura | Comportamento |
|------------|---------|---------------|
| `sm` | < 640px | Mobile — layout mobile-first |
| `md` | 640–1024px | Tablet — sidebar colapsada, layout em 1 coluna |
| `lg` | > 1024px | Desktop — layout completo conforme spec |

### 12.2 Mudanças de Layout em Mobile (< 640px)

**Shell:**
- Sidebar some
- Topbar mantida (logo + sync status + user menu)
- **Bottom navigation bar** — fixa no rodapé, 5 itens: Dashboard, Combustível, Conveniência, DRE, Config
- Bottom bar: `bg-sidebar` (slate-800), ícone + label pequeno, item ativo em `--primary`

**KPI Cards:**
- Grid de 1 coluna (1 card por linha) ou 2 colunas em cards mais compactos
- Sparkline mantida (simplificada, sem eixos)
- Fonte do valor: `text-2xl` (reduzida de `text-3xl`)

**Gráficos:**
- Dual-axis: substituído por gráfico de linha simples de receita (sem margem no eixo direito)
- Área empilhada: mantida mas simplificada (sem labels inline)
- Scatter plot: **oculto em mobile** — substituído por tabela de ranking por margem
- Waterfall: mantido, mas com labels abreviados (R$ 124k em vez de R$ 124.500)
- Altura de todos os gráficos: `height: 220px` em mobile

**Tabelas:**
- Scroll horizontal habilitado (`overflow-x: auto`)
- Primeira coluna sticky (nome do produto/categoria)
- Colunas menos importantes ocultadas em mobile (ex: CMV, Custo/L)

**Filtros:**
- Page Header em mobile: título na primeira linha, filtros na segunda linha (full width)
- Select de período e location ocupam `width: 100%`

**Botão de Sync:**
- Mantido na topbar, acessível com 1 toque
- Em mobile, mostra apenas o ícone ↻ (sem texto)

**Drawer de drill-down:**
- Em mobile: `Sheet` abre de baixo para cima (`side: "bottom"`), altura 85vh

---

## 13. Componentes Shadcn/ui Necessários

Instalar antes de começar a implementação:

```bash
npx shadcn@latest add button select card badge table tabs dialog tooltip separator skeleton avatar dropdown-menu alert input label sheet accordion switch calendar popover toggle-group
```

| Componente | Uso principal |
|------------|---------------|
| `button` | Ações, sync, CTAs |
| `select` | Filtro de período, location, mês DRE |
| `card` | KpiCard, SectionCard |
| `badge` | Status de sync, segmentos, YTD |
| `table` | Todas as tabelas de dados |
| `tabs` | Toggles de gráfico (linha/área, volume/receita) |
| `sheet` | Drawer de drill-down |
| `accordion` | Top 10 grupos expansível (Conveniência) |
| `switch` | Toggle Arla 32, toggle multi-location (Settings) |
| `calendar` | Date range picker (período customizado) |
| `popover` | Container do date picker |
| `skeleton` | Loading states |
| `alert` | Erros de API, avisos de sync |
| `toggle-group` | Toggles de gráfico |
| `separator` | Divisórias de seção |
| `tooltip` | Info adicional em sync status, ícones |
| `avatar` | User menu |
| `dropdown-menu` | User menu dropdown |

---

## 14. Biblioteca de Gráficos

**Biblioteca:** Apache ECharts (`echarts` npm package)

```bash
npm install echarts
```

**Configuração global:**
```typescript
// lib/echarts.ts
import * as echarts from 'echarts';
import { postoinsightTheme } from './echarts-theme'; // derivado de design-tokens.md

echarts.registerTheme('postoinsight', postoinsightTheme);

export { echarts };
```

**Wrapper React:**
```typescript
// components/charts/EChart.tsx
// Componente wrapper que gerencia resize, theme, loading state e dispose
// Props: option, height, loading, className
```

Cada gráfico é um componente próprio que recebe dados processados — nunca faz fetch dentro do componente de gráfico.

---

## 15. Arquitetura de Dados no Frontend

### 15.1 Estrutura de Pastas (apps/web)

```
apps/web/
├── app/
│   ├── (auth)/
│   │   └── login/
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Shell com Sidebar + Topbar
│   │   ├── dashboard/page.tsx
│   │   ├── combustivel/page.tsx
│   │   ├── conveniencia/page.tsx
│   │   ├── dre/page.tsx
│   │   └── settings/page.tsx
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── SyncStatus.tsx
│   │   └── BottomNav.tsx       ← mobile only
│   ├── charts/
│   │   ├── EChart.tsx          ← wrapper base
│   │   ├── DualAxisChart.tsx
│   │   ├── DonutChart.tsx
│   │   ├── ScatterChart.tsx
│   │   ├── WaterfallChart.tsx
│   │   ├── AreaStackChart.tsx
│   │   └── Sparkline.tsx
│   ├── kpi/
│   │   └── KpiCard.tsx
│   ├── tables/
│   │   ├── ProductRankingTable.tsx
│   │   ├── FuelBreakdownTable.tsx
│   │   ├── DreTable.tsx
│   │   └── ConvenienceTable.tsx
│   └── ui/                     ← componentes shadcn
├── contexts/
│   ├── FilterContext.tsx        ← período, location, estado global
│   └── TenantContext.tsx        ← locationCount, multiLocationEnabled
├── hooks/
│   ├── useFilters.ts
│   ├── useSyncStatus.ts
│   └── useTenant.ts
└── lib/
    ├── echarts.ts
    ├── echarts-theme.ts
    ├── formatters.ts            ← R$, %, litros
    └── api.ts                   ← fetch helpers com auth
```

### 15.2 FilterContext

```typescript
interface FilterState {
  period: 'today' | 'yesterday' | '7d' | 'this_week' | 'this_month' | 'custom';
  customStart?: Date;
  customEnd?: Date;
  locationId: string | 'all'; // 'all' = consolidado
}
```

### 15.3 TenantContext

```typescript
interface TenantState {
  locationCount: number;
  multiLocationEnabled: boolean; // setting do owner
  locations: { id: string; name: string }[];
}
```

Componentes verificam `locationCount > 1 && multiLocationEnabled` para decidir se renderizam comparativos.

---

## 16. Edge Cases Documentados

| Edge case | Comportamento esperado |
|-----------|----------------------|
| Tenant com 1 location | Filtro de location oculto. Nenhum componente comparativo renderizado. `TenantContext.locationCount === 1` |
| Owner desabilita multi-location nas settings | Mesmo comportamento de 1 location. UI atualiza imediatamente sem reload. |
| Filtro "Hoje" sem dados (posto fechado) | Empty state "Sem dados neste período" com CTA "Ver ontem" |
| DRE — location sem dados no mês | Empty state inline na tela, não zeros. Botão "Ver rede completa" |
| Sync há mais de 48h | Badge ⚠ na sidebar + status vermelho na topbar. Dados exibidos normalmente com aviso visual. |
| Sync falhou (erro de conexão) | Status "Falha na sync" na topbar. Botão "Tentar novamente". Dados do último sync bem-sucedido ainda exibidos. |
| Primeiro acesso (sem nenhum dado) | Empty state global no dashboard com CTA "Sincronizar agora" |
| Período customizado > 90 dias | Warning inline no seletor: "Selecione no máximo 90 dias". Botão "Aplicar" desabilitado. |
| Donut cross-filter + 0 produtos no segmento | Tabela mostra empty state "Nenhum produto neste segmento" + botão "Limpar filtro" |
| Scatter com categoria de margem negativa | Bolha aparece abaixo do eixo X = 0. Não truncar. Quadrante "Rever estratégia" cobre margem negativa. |
| Usuario `manager` (acesso só à sua location) | Filtro de location não aparece (ele só tem 1). A query da API filtra por `location_id` do manager automaticamente. |

---

*— fim do documento —*

> **Próximo passo:** Implementar o shell (Sidebar + Topbar + Layout) e o FilterContext antes de qualquer tela de conteúdo.
> Referência de design: `design-tokens.md`
> Referência de produto: `PRD.md v1.2`

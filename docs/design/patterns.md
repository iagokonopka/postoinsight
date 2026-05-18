# PostoInsight — Padrões de Composição de Páginas

> Fonte de verdade visual: `docs/design/PostoInsight/PostoInsight.html`
> Arla 32 → `/arla` (página própria). Lubrificantes → `/lubrificantes` (página própria).
> Combustível → apenas combustíveis. Conveniência → apenas loja.

---

## Estrutura comum a todas as páginas

```
<section class="page [active]">
  <!-- 1. Cabeçalho da página -->
  <div class="page-head">
    <div>
      <h1 class="page-title">…</h1>
      <div class="page-sub">…</div>
    </div>
    <div class="page-actions">
      <!-- botões ou segment de modo -->
    </div>
  </div>

  <!-- 2. KPI row -->
  <div class="kpi-grid kpi-N">…</div>

  <!-- 3+ seções de gráfico / tabela -->
  <div class="row row-X-Y">
    <div class="card">…</div>
    <div class="card">…</div>
  </div>
</section>
```

O toolbar na topbar (`.segment` de período ou `.dre-toolbar`) é global — não faz parte do `<section class="page">`.

---

## /dashboard — Visão Geral

**Rota React:** `/dashboard` → `DashboardPage`  
**Fonte HTML:** `#page-visao-geral`

### Estrutura vertical

1. **page-head** — título "Visão Geral", subtitle, botão "Exportar" (`.btn-outline.btn-sm`)
2. **KPI row** — `.kpi-grid.kpi-5` (5 cards)
3. **`.row.row-3-2`**
   - Card: "Evolução de Receita & Margem" — `.chart-box` (280px), AreaChart empilhado + linha de margem % no eixo direito (tracejada, desativada por default)
   - Card: "Mix por Segmento" — `.donut-wrap` (180px) + `.donut-legend` (grid 2 colunas)
4. **`.row.row-2-1`**
   - Card: "Top 10 Produtos por Receita" — tabela com segment "Receita / Margem %" no `.card-h`
   - Card: "Padrão Semanal" — heatmap (dias da semana × semanas)

### KPIs (5 cards — `kpi-5`)

| # | Label | Endpoint |
|---|-------|----------|
| 1 | Receita Bruta | `GET /api/v1/vendas/resumo` |
| 2 | Margem Bruta % | idem |
| 3 | Volume Combustível | idem |
| 4 | Ticket Médio | idem |
| 5 | CMV % | idem |

### Tabela Top Produtos

Colunas: `#` (rank), Produto (seg-dot + nome), Categoria, Peso (bar-cell), Receita (r), Margem % (r), Qtd (r)  
Toggle no header: "Receita / Margem %" — `.segment` no `.card-h`  
Endpoint: `GET /api/v1/vendas/top-produtos`

### Comportamentos especiais

- Topbar: `.segment` de período (Hoje / Semana / Mês / Mês ant.) + select de location + botão "Sincronizar"
- Donut: clique em fatia filtra a tabela Top Produtos por segmento
- Heatmap: endpoint a implementar (dados por dia da semana) — por ora EmptyState ou dado mockado

---

## /combustivel — Combustível

**Rota React:** `/combustivel`  
**Fonte HTML:** `#page-combustivel`

**Escopo:** apenas combustíveis — Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500, Etanol.  
**Não inclui Arla 32** — tem página própria `/arla`.

### Estrutura vertical

1. **page-head** — título "Combustível", subtitle "Volumes, receitas e margens por produto."
   - `.page-actions`: segment "Volume / Receita" + segment "Sem Arla 32 / Com Arla 32"
2. **KPI row** — `.kpi-grid.kpi-5` (5 cards)
3. **`.row.row-3-2`**
   - Card: "Evolução por produto" — `.chart-box.tall` (320px), multi-line por produto
   - Card: "Mix de Combustível" — `.donut-wrap` + `.donut-legend`
4. **`.row.row-2-1`**
   - Card: "Breakdown por produto" — tabela com spark e tendência 14d
   - Card: "Ranking de Bicos" — EmptyState ("Disponível em breve")

### KPIs (5 cards — `kpi-5`)

| # | Label | Endpoint |
|---|-------|----------|
| 1 | Volume Total | `GET /api/v1/combustivel/resumo` |
| 2 | Receita Bruta | idem |
| 3 | Margem Bruta | idem |
| 4 | Margem % | idem |
| 5 | Preço Médio/L | idem |

### Tabela Breakdown

Colunas: Produto (seg-dot + nome), Volume (r), Part. % (r), Receita (r), Margem % (r), Preço/L (r), Custo/L (r), Tendência 14d (spark-cell)  
Endpoint: `GET /api/v1/combustivel/subgrupos`

### Comportamentos especiais

- Topbar: `.segment` de período + select location + botão Sincronizar
- Segment "Volume / Receita" no `.page-actions`: alterna métrica do gráfico e título da coluna na tabela
- Segment "Sem Arla 32 / Com Arla 32" no `.page-actions`: inclui/exclui Arla dos totais e do gráfico
- Gráfico multi-série: `GET /api/v1/combustivel/evolucao?por_produto=true`

---

## /arla — Arla 32

**Rota React:** `/arla`  
**Fonte HTML:** não existe no HTML de referência — extraído de `apps/web/src/components/layout/Sidebar.tsx` e specs do backend.

**Escopo:** exclusivamente Arla 32 (categoria_codigo = 'ARL').  
**Cor de destaque:** `#0891B2` (segmentos.servicos no chart-theme, usado pelo arla no código backend).

### Estrutura vertical (a implementar)

1. **page-head** — título "Arla 32", subtitle "Volumes e margens do produto"
   - `.page-actions`: segment "Linha / Área" + segment "Volume / Receita"
2. **KPI row** — `.kpi-grid.kpi-5` (5 cards)
3. **`.row.row-3-2`** (ou `.row-1-1`)
   - Card: "Evolução" — `.chart-box` ou `.chart-box.tall`, linha ou área conforme toggle
4. **Card fullwidth**: tabela de produtos

### KPIs (5 cards — `kpi-5`)

| # | Label | Endpoint |
|---|-------|----------|
| 1 | Volume Total | `GET /api/v1/arla/resumo` |
| 2 | Receita Bruta | idem |
| 3 | CMV | idem |
| 4 | Margem Bruta | idem |
| 5 | Margem % | idem |

### Tabela de Produtos

Colunas: Produto, Volume, Receita, CMV, Margem, Margem %  
Endpoint: `GET /api/v1/arla/produtos`

### Comportamentos especiais

- Topbar: `.segment` de período + select location
- Evolução: `GET /api/v1/arla/evolucao`
- Cor `#0891B2` nos gráficos e sparklines

---

## /lubrificantes — Lubrificantes

**Rota React:** `/lubrificantes`  
**Fonte HTML:** não existe no HTML de referência — baseado na estrutura de Arla e Conveniência.

**Escopo:** apenas lubrificantes (filtro em mv_conveniencia_diario).  
**Cor de destaque:** `#7C3AED` (variante de `#6B40C4` do design system).

### Estrutura vertical (a implementar)

1. **page-head** — título "Lubrificantes", subtitle
   - `.page-actions`: segment "Receita / Volume"
2. **KPI row** — `.kpi-grid.kpi-4` (4 cards)
3. **`.row.row-3-2`**
   - Card: "Evolução" — `.chart-box` line/area
   - Card: "Mix por grupo" — `.donut-wrap` + `.donut-legend`
4. **Card fullwidth**: tabela de grupos

### KPIs (4 cards — `kpi-4`)

| # | Label | Endpoint |
|---|-------|----------|
| 1 | Receita Bruta | `GET /api/v1/lubrificantes/resumo` |
| 2 | CMV | idem |
| 3 | Margem Bruta | idem |
| 4 | Margem % | idem |

### Tabela de Grupos

Colunas: Grupo (seg-dot + nome), Receita (r), Part. % (bar-cell), Margem % (r)  
Endpoint: `GET /api/v1/lubrificantes/grupos`

### Comportamentos especiais

- Topbar: `.segment` de período + select location
- Evolução: `GET /api/v1/lubrificantes/evolucao`

---

## /conveniencia — Conveniência

**Rota React:** `/conveniencia`  
**Fonte HTML:** `#page-conveniencia`

**Escopo:** apenas loja — alimentos, bebidas, tabacaria, embalagens, lanchonete, etc.  
**Não inclui lubrificantes** — tem página própria `/lubrificantes`.

> **Atenção:** O HTML de referência mostra "Conveniência & Serviços" com toggles para Todos / Conveniência / Serviços / Lubrificantes. Essa estrutura é **obsoleta** — a decisão de produto separou Arla e Lubrificantes em páginas próprias. A versão React implementa apenas a loja.

### Estrutura vertical

1. **page-head** — título "Conveniência", subtitle "Loja — período selecionado"
2. **KPI row** — `.kpi-grid.kpi-4` (4 cards)
3. **`.row.row-3-2`**
   - Card: "Receita × Margem Bruta" — `.chart-box` (280px), AreaChart empilhado
   - Card: "Mix da Loja" — `.donut-wrap` + `.donut-legend`
4. **Card fullwidth**: "Matriz de Categorias" — `.chart-box.tall` (320px), ScatterChart (qtd × margem %, tamanho da bolha = receita, medianas formando 4 quadrantes)
5. **Card fullwidth**: "Breakdown por categoria" — tabela com drill-down

### KPIs (4 cards — `kpi-4`)

| # | Label | Endpoint |
|---|-------|----------|
| 1 | Receita Bruta | `GET /api/v1/conveniencia/resumo` |
| 2 | Ticket Médio | idem (campo `ticket_medio`) |
| 3 | Margem Bruta | idem |
| 4 | Margem % | idem |

### Tabela Breakdown

Colunas: Categoria (seg-dot + nome), Peso (bar-cell), Qtd (r), Receita (r), CMV (r), Margem (r), Margem % (r)  
Clique na linha → abre Drawer com produtos da categoria.  
Endpoint: `GET /api/v1/conveniencia/top-grupos`

### Comportamentos especiais

- Topbar: `.segment` de período + select location
- Clique na linha da tabela → `.drawer.open` com `.drawer-row` para cada produto
- ScatterChart: `GET /api/v1/conveniencia/categorias` (sem parâmetro de segmento obrigatório)
- Donut: `GET /api/v1/conveniencia/top-grupos` (top grupos por receita)

---

## /dre — DRE Mensal

**Rota React:** `/dre`  
**Fonte HTML:** `#page-dre`

### Estrutura vertical

1. **page-head** — título "DRE Mensal", subtitle "Demonstrativo de resultado por mês"
2. **KPI row** — `.kpi-grid.kpi-4` (4 cards)
3. **`.row.row-1-1`**
   - Card: "Waterfall do mês" — `.chart-box.tall` (320px), BarChart waterfall
   - Card: "Margem % — últimos 6 meses" — `.chart-box.tall` (320px), multi-line por segmento
4. **Card fullwidth**: "Detalhamento mês a mês" — tabela com 8 colunas (Linha, M-5..M-1, Atual, δ, YTD)

### KPIs (4 cards — `kpi-4`)

Extrair do endpoint `GET /api/v1/dre` para o mês selecionado:
Receita Bruta, CMV, Margem Bruta, Margem %.

### Toolbar especial

Na **topbar**, no lugar do `.segment` de período, exibe `.dre-toolbar`:
- `.dre-month-btn` (seta esquerda) — mês anterior
- `select.input` — seletor de mês (Janeiro…Dezembro)
- `select.input` — seletor de ano (2024, 2025, 2026…)
- `.dre-month-btn` (seta direita) — próximo mês

### Tabela DRE

Linhas especiais:
- `.dre-row-total` → `border-top: 2px solid border`, fundo muted/40, `font-weight: 600`
- `.dre-row-result` → `border-top: 2px solid success/30`, fundo `success-subtle`, `font-weight: 700`, cor `success`

Linhas da DRE:
1. Receita Bruta
2. (–) Descontos
3. = Receita Líquida (`.dre-row-total`)
4. (–) CMV
5. = Margem Bruta (`.dre-row-result`)
6. Margem % (`.dre-row-result`)

### Comportamentos especiais

- Topbar: `.dre-toolbar` substituindo `.segment` de período (controlado via `id="dre-date-toolbar"` com `display:none` → visível apenas na rota `/dre`)
- Waterfall usa BarChart com segmentos positivos/negativos
- `.dre-month-label` não existe na implementação React (foi substituído pelos dois selects)

---

## /sync — Sincronização

**Rota React:** `/sync`  
**Fonte HTML:** `#page-sincronizacao`

### Estrutura vertical

1. **page-head** — título "Sincronização", subtitle, botão "Sincronizar agora" (`.btn-primary`)
2. **`.sync-grid`** (grid 2 colunas)
   - Card `.sync-card`: "Status · Status ERP" — `.sync-dot.ok` + badge + `.sync-stat`
   - Card `.sync-card`: "Status · WebPosto ERP" — `.sync-dot.warn` + badge + `.sync-stat`
3. **Card fullwidth**: "Histórico de execuções" — `.sync-list` com `.sync-row`s

### Estrutura de um sync-card

```html
<div class="card sync-card">
  <div class="card-title">Status · Status ERP</div>
  <div class="sync-stat">Agente RDP — Windows Server · v2.4.1</div>
  <div class="sync-status-row">
    <div class="sync-dot ok"></div>
    <span>Conectado</span>
    <span class="badge badge-success">Última sync OK</span>
  </div>
  <div class="sync-stat">Próxima sync: <b>03:00 BRT</b> · watermark: <b>16/05 22:48</b></div>
</div>
```

### Estrutura de um sync-row (histórico)

```html
<div class="sync-row">
  <span class="sync-time">16/05 22:48</span>
  <span class="sync-dot ok"></span>
  <span class="sync-loc">JAM Centro</span>
  <span class="badge badge-success">OK</span>
  <span class="sync-recs">+1.240 registros</span>
</div>
```

### Comportamentos especiais

- Topbar: sem `.segment` de período (sincronização é tempo-real)
- Botão "Sincronizar agora" → `POST /api/v1/sync/trigger` → toast de confirmação
- StatusDot `.ok` tem anel pulsante via `@keyframes pulse`

---

## /settings — Configurações

**Rota React:** `/settings`  
**Fonte HTML:** `#page-configuracoes`

### Estrutura vertical

1. **page-head** — título "Configurações", subtitle "Tenant, locations, usuários e integrações."
2. **`.cfg-grid`** (grid 2 colunas)
   - Card: "Tenant" — `.cfg-row` para Nome, Plano, Fuso horário, Idioma, Tenant ID
   - Card: "Integração — Status ERP" — `.cfg-row` para Host, Database, Usuário, Watermark, Agente
3. **Card fullwidth**: "Locations" — `.cfg-loc-list` com `.cfg-loc-row` para cada location
4. **Card fullwidth**: "Usuários" — `.cfg-loc-list` com `.cfg-loc-row` para cada usuário (avatar + role badge)

### Estrutura de cfg-loc-row (locations)

```html
<div class="cfg-loc-row">
  <div class="cfg-loc-avatar">J1</div>
  <div>
    <div class="cfg-loc-name">JAM Centro</div>
    <div class="cfg-loc-meta">source_id: 001 · Status ERP</div>
  </div>
  <span class="badge badge-success">Ativo</span>
</div>
```

### Estrutura de cfg-loc-row (usuários)

```html
<div class="cfg-loc-row">
  <div class="cfg-loc-avatar" style="background:linear-gradient(135deg,#0073BB,#6B40C4);color:white;">IK</div>
  <div style="flex:1">
    <div class="cfg-loc-name">Isabela Kraus</div>
    <div class="cfg-loc-meta">isabela@redejam.com.br · acesso a todas as locations</div>
  </div>
  <span class="badge badge-primary">owner</span>
</div>
```

### Comportamentos especiais

- Topbar: sem `.segment` de período
- Campo "Watermark" e "Agente" em `.cfg-value.mono`
- Tenant ID e Host/Database em `.cfg-value.mono`
- Usuários owner têm avatar com gradient; managers/viewers têm avatar com `background: hsl(var(--primary-subtle))` e `color: hsl(var(--primary))`

---

## Topbar por rota — resumo

| Rota | Toolbar na topbar |
|------|------------------|
| `/dashboard` | `.segment` período + select location + btn Sincronizar |
| `/combustivel` | `.segment` período + select location + btn Sincronizar |
| `/arla` | `.segment` período + select location |
| `/lubrificantes` | `.segment` período + select location |
| `/conveniencia` | `.segment` período + select location |
| `/dre` | `.dre-toolbar` (← mês select ano →) + select location |
| `/sync` | — (sem período) |
| `/settings` | — (sem período) |

---

## Divergências entre HTML de referência e código implementado

1. **Sidebar HTML vs React:** O HTML tem 4 itens de análise (Visão Geral, Combustível, Conveniência, DRE) e 2 de operação (Sync, Config). O React tem 5 itens de análise (adicionando Arla 32 e Lubrificantes) e separa DRE em seção "Financeiro". Esta é a estrutura **correta** por decisão de produto.

2. **Conveniência HTML vs React:** O HTML chama a página de "Conveniência & Serviços" e tem toggle Todos/Conveniência/Serviços/Lubrificantes. O React implementa apenas loja, sem lubrificantes.

3. **Arla 32 e Lubrificantes:** Não existem no HTML de referência — são páginas próprias adicionadas por decisão de produto após o HTML ser criado.

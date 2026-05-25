# PostoInsight — Padrões de Composição de Páginas

> Fonte de verdade visual: `docs/design/PostoInsight/PostoInsight.html` + `app.js`
> Decisões de produto posteriores ao HTML são anotadas como **[produto]**.

---

## Estrutura comum a todas as páginas

```tsx
<section className="page active">
  {/* 1. Cabeçalho */}
  <div className="page-head">
    <div>
      <h1 className="page-title">…</h1>
      <div className="page-sub">…</div>
    </div>
    <div className="page-actions">
      {/* segmented controls ou botões específicos da página */}
    </div>
  </div>

  {/* 2. KPI row */}
  <div className="kpi-grid kpi-N">
    <KpiCard … />
  </div>

  {/* 3+. Seções de gráfico / tabela */}
  <div className="row row-X-Y">
    <div className="card">…</div>
    <div className="card">…</div>
  </div>
</section>
```

Os controles da topbar (`.segment` de período, `.dre-toolbar`, location select) são **globais** — não fazem parte do `<section class="page">`.

---

## Topbar por rota — resumo

| Rota | Period tabs | DRE toolbar | Location select | Btn Sync |
|------|:-----------:|:-----------:|:---------------:|:--------:|
| `/` (Visão Geral) | ✅ | ❌ | ✅ | ✅ |
| `/combustivel` | ✅ | ❌ | ✅ | ✅ |
| `/arla` | ✅ | ❌ | ✅ | ❌ |
| `/lubrificantes` | ✅ | ❌ | ✅ | ❌ |
| `/conveniencia` | ✅ | ❌ | ✅ | ❌ |
| `/dre` | ❌ | ✅ | ✅ | ❌ |
| `/sync` | ❌ | ❌ | ❌ | ❌ |
| `/settings` | ❌ | ❌ | ❌ | ❌ |

Period tabs: **Hoje** / **Semana** / **Mês** (default) / **Mês ant.**

---

## `/` — Visão Geral

**Fonte HTML:** `#page-visao-geral` | **app.js:** `renderVisaoGeral()`

### Estrutura vertical

```
page-head
  h1 "Visão Geral"
  sub "Consolidado da rede — vendas, margens e padrão de demanda."
  page-actions: [btn-outline btn-sm Exportar]

kpi-grid kpi-5

row row-3-2
  card "Evolução de Receita & Margem"  ← chart-box 280px   (LineAreaChart dual-axis)
  card "Mix por Segmento"              ← DonutChart 180px + legenda 2 cols

card "Breakdown por Segmento"          ← tabela clickable → drawer

row row-2-1
  card "Top 10 Produtos por Receita"   ← tabela + segment Receita/Margem %
  card "Padrão Semanal"                ← heatmap 7 dias × 4 semanas
```

### KPIs (5 cards — `kpi-5`)

| # | Label | Cor spark | API |
|---|-------|-----------|-----|
| 1 | Receita Bruta | `#0073BB` | `GET /api/v1/vendas/resumo` |
| 2 | CMV | `#dc2626` | idem |
| 3 | Margem Bruta | `#16a34a` | idem |
| 4 | Margem % | `#0073BB` (deltaPP) | idem |
| 5 | Itens vendidos | `#6B40C4` | idem |

### Chart: Evolução de Receita & Margem

- Recharts `AreaChart` com dual-axis
- 3 datasets: Receita Bruta + Margem Bruta (ambos área, eixo esquerdo) + Margem % (linha tracejada #EC7211, eixo direito, **hidden por padrão**)
- Gradientes por série; legend position bottom; tooltip `mode: 'index'`
- Eixo Y: `fmtBRLk(v)` | Eixo Y2: `v + '%'`
- **Desc:** "Curvas empilhadas com gradient · Margem % tracejada no eixo direito (desativada por padrão)"

### Donut: Mix por Segmento

- 4 segmentos: Combustível `#0073BB`, Lubrificantes `#6B40C4`, Serviços `#0891b2`, Conveniência `#EC7211`
- Centro: "TOTAL" + `fmtBRL(total)`
- Legenda: 2 colunas, pct `(share*100).toFixed(1) + '%'`
- API: `GET /api/v1/vendas/resumo` (campo `segmentos[]`)

### Tabela: Breakdown por Segmento

Colunas: **Segmento** (seg-dot + nome) | **Peso na receita** (bar-cell, cor do segmento) | **Receita** (r) | **CMV** (r) | **Margem** (r) | **Margem %** (r, `<b>`)

- `tr.clickable` → `openDrillDown(seg)` — drawer com Composição + Por unidade
- Tfoot: TOTAL com totais calculados
- API: `GET /api/v1/vendas/resumo`

### Tabela: Top 10 Produtos

Colunas: **#** (.row-rank) | **Produto** (nome + sub grupo, 11px muted) | **Categoria** (badge-soft) | **Peso** (bar-cell, cor por categoria) | **Receita** (r, `<b>`) | **Margem %** (r) | **Qtd** (r)

- Segment no `.card-h`: **Receita** | **Margem %** — ordena e altera barra de peso
- Rank: `String(i+1).padStart(2,'0')`
- API: `GET /api/v1/vendas/top-produtos?sort={receita|margem}`

### Heatmap: Padrão Semanal

- `.heat-head`: S1 S2 S3 S4 (com `padding-left: 42px`)
- `.heat-days`: Dom Seg Ter Qua Qui Sex Sáb (`padding-top: 0` — sobrepõe ao padrão de 22px)
- 7 dias × 4 semanas = 28 células
- Célula: `fmtBRL(v)` como texto; bg `hsl(204 100% 37% / alpha)` onde `alpha = 0.08 + t * 0.92`
- Legenda: `fmtBRL(min)` → gradiente → `fmtBRL(max)`
- API: endpoint a implementar (dados por dia da semana × semana do mês)

---

## `/combustivel` — Combustível

**Fonte HTML:** `#page-combustivel` | **app.js:** `renderCombustivel()`  
**Escopo:** Gasolina Comum, Gasolina Aditivada, Diesel S-10, Diesel S-500, Etanol Hidratado. **Não inclui Arla 32** (tem página própria).

### Estrutura vertical

```
page-head
  h1 "Combustível"
  sub "Volumes, receitas e margens por produto."
  page-actions:
    segment #comb-mode:  Volume (default) | Receita
    segment #comb-arla:  Sem Arla 32 (default) | Com Arla 32

kpi-grid kpi-5

row row-3-2
  card "Evolução por produto"  ← chart-box tall 320px  (MultiLineChart stacked area)
  card "Mix de Combustível"    ← DonutChart + legenda

row row-2-1
  card "Breakdown por produto" ← tabela com TinySparkline
  card "Ranking de Bicos"      ← EmptyState "Disponível em breve"
```

### KPIs (5 cards — `kpi-5`)

| # | Label | Cor spark | API |
|---|-------|-----------|-----|
| 1 | Volume Total | `#0073BB` | `GET /api/v1/combustivel/resumo` |
| 2 | Receita | `#0073BB` | idem |
| 3 | CMV | `#dc2626` | idem |
| 4 | Margem Bruta | `#16a34a` | idem |
| 5 | Margem % | `#0073BB` (deltaPP) | idem |

### Chart: Evolução por produto

- Paleta sequencial `s1..s6`, fill=true (stacked area com gradientes)
- Y-axis: volume → `(v/1000).toFixed(1)+'k L'` | receita → `fmtBRLk(v)`
- Tooltip: volume → `toLocaleString + ' L'` | receita → `fmtBRL(v)`
- `card-desc` dinâmico: `"{Volume|Receita} por produto · {period.label.toLowerCase()}"`
- API: `GET /api/v1/combustivel/evolucao?por_produto=true`

### Donut: Mix de Combustível

- Total label: volume → `"{n} L"` | receita → `fmtBRL(total)`
- Cores: paleta `['#0073BB','#EC7211','#6B40C4','#1D8102','#0891b2','#db2777']` (índice por produto)
- Toggle "Com Arla 32" adiciona Arla 32 como 6º produto
- API: `GET /api/v1/combustivel/subgrupos`

### Tabela: Breakdown por produto

Colunas: **Produto** | **Volume** (r) | **Part.%** (r) | **Receita** (r) | **Margem %** (r, `<b>`) | **Preço/L** (r, `.mono`) | **Custo/L** (r, `.mono`) | **Tendência 14d** (spark-cell)

- Preço/L, Custo/L: `value.toFixed(2).replace('.',',')`
- TinySparkline: 72×22px, cor por trend (`#16a34a`, `#dc2626`, `#64748b`)
- Trend: `↑ valor%` / `↓ valor%` / `→ valor%` com `.trend-up/down/flat`
- API: `GET /api/v1/combustivel/subgrupos`

### Comportamentos especiais

- **Toggle Volume/Receita:** altera métrica do chart, label do total no donut e desc do chart
- **Toggle Sem/Com Arla:** inclui/exclui Arla dos datasets do chart, donut e tabela
- Ambos re-renderizam a página inteira (não apenas o chart)

---

## `/arla` — Arla 32

**[produto]** Página própria — não existe no HTML de referência.  
**Cor:** `#1D8102` (constante `C.arla` de charts.js)  
**Escopo:** exclusivamente categoria_codigo = 'ARL'.

### Estrutura vertical

```
page-head
  h1 "Arla 32"
  sub "Volume, receita e margem do produto."

kpi-grid kpi-5

row row-3-2 (ou row-1-1)
  card "Evolução"  ← chart-box 280px  (LineChart simples, cor #1D8102)
  card "Resumo por subgrupo"  ← DonutChart (se houver subdivisão)

card "Produtos"  ← tabela simples
```

### KPIs (5 cards — `kpi-5`)

| # | Label | API |
|---|-------|-----|
| 1 | Volume Total | `GET /api/v1/arla/resumo` |
| 2 | Receita Bruta | idem |
| 3 | CMV | idem |
| 4 | Margem Bruta | idem |
| 5 | Margem % | idem (deltaPP) |

### Tabela: Produtos

Colunas: **Produto** | **Volume** (r) | **Receita** (r) | **CMV** (r) | **Margem** (r) | **Margem %** (r)

API: `GET /api/v1/arla/produtos`  
Evolução: `GET /api/v1/arla/evolucao`

---

## `/lubrificantes` — Lubrificantes

**[produto]** Página própria — não existe no HTML de referência.  
**Cor:** `#6B40C4` (constante `C.lubrificantes`)  
**Escopo:** filtro em mv_conveniencia_diario por segmento lubrificantes.

### Estrutura vertical

```
page-head
  h1 "Lubrificantes"
  sub "Grupos e margens — período selecionado."
  page-actions:
    segment: Receita | Volume

kpi-grid kpi-4

row row-3-2
  card "Evolução"    ← chart-box 280px  (LineChart, cor #6B40C4)
  card "Mix por grupo"  ← DonutChart + legenda

card "Grupos"  ← tabela
```

### KPIs (4 cards — `kpi-4`)

| # | Label | API |
|---|-------|-----|
| 1 | Receita Bruta | `GET /api/v1/lubrificantes/resumo` |
| 2 | CMV | idem |
| 3 | Margem Bruta | idem |
| 4 | Margem % | idem (deltaPP) |

### Tabela: Grupos

Colunas: **Grupo** (seg-dot + nome) | **Receita** (r) | **Part.%** (bar-cell) | **Margem %** (r)

API: `GET /api/v1/lubrificantes/grupos`  
Evolução: `GET /api/v1/lubrificantes/evolucao`

---

## `/conveniencia` — Conveniência

**Fonte HTML:** `#page-conveniencia` | **app.js:** `renderConveniencia()`  
**Escopo:** apenas loja (BEB, TAB, LAN, CV). **Não inclui lubrificantes** (página própria) nem serviços em separado.

> **Atenção:** O HTML mostra "Conveniência & Serviços" com toggle Todos/Conveniência/Serviços/Lubrificantes. Esta estrutura é **obsoleta** — a implementação React usa apenas loja sem o toggle de view. A decisão de produto separou Arla e Lubrificantes em páginas próprias.

### Estrutura vertical

```
page-head
  h1 "Conveniência"
  sub "Loja — período selecionado."

kpi-grid kpi-4

row row-3-2
  card "Receita × Margem Bruta"  ← chart-box 280px  (ConvAreaChart)
  card "Mix da Loja"             ← DonutChart + legenda

card "Matriz de Categorias"      ← chart-box tall 320px  (ScatterQuadrants)

card "Breakdown por categoria"   ← tabela clickable → drawer
```

### KPIs (4 cards — `kpi-4`)

| # | Label | API |
|---|-------|-----|
| 1 | Receita Bruta | `GET /api/v1/conveniencia/resumo` |
| 2 | Ticket Médio | idem (campo `ticket_medio`) |
| 3 | Margem Bruta | idem |
| 4 | Margem % | idem (deltaPP) |

Sparks: Receita → `#EC7211`, Margem → `#16a34a`, Margem% → `#EC7211`, Ticket → `#EC7211`

### Chart: Receita × Margem Bruta

- `ConvAreaChart`: Receita (#EC7211 com gradiente) + Margem Bruta (#16a34a com gradiente)
- Ambos `fill: 'origin'`, sem pontos
- API: `GET /api/v1/conveniencia/resumo` (série temporal)

### Scatter: Matriz de Categorias

- Bubble chart: eixo X = qtd vendida, eixo Y = margem%, raio = `sqrt(receita/200)` (mín 5)
- Quadrante labels: ESTRELAS (top-right), QUESTIONÁVEIS (top-left), CAIXA (bottom-left), VOLUME (bottom-right)
- Cores por categoria (constante em `data.js`): BEB `#EC7211`, TAB `#6B40C4`, LAN `#1D8102`, SRV `#0891b2`
- API: `GET /api/v1/conveniencia/categorias`

### Tabela: Breakdown por categoria

Colunas: **Categoria** (seg-dot + nome) | **Peso** (bar-cell, cor da categoria) | **Qtd** (r) | **Receita** (r) | **CMV** (r) | **Margem** (r) | **Margem %** (r, `<b>`)

- `tr.clickable` → `openConvCatDrillDown(g)` — drawer com lista de produtos
- Tfoot: TOTAL
- API: `GET /api/v1/conveniencia/top-grupos`

---

## `/dre` — DRE Mensal

**Fonte HTML:** `#page-dre` | **app.js:** `renderDRE()`

### Estrutura vertical

```
page-head
  h1 "DRE Mensal"
  sub "Demonstrativo de resultado por mês — receita, deduções, CMV e margem bruta."
  (sem page-actions)

kpi-grid kpi-4

row row-1-1
  card "Waterfall do mês"             ← chart-box tall 320px  (WaterfallChart)
  card "Margem % — últimos 6 meses"   ← chart-box tall 320px  (MultiLineChart 4 séries)

card "Detalhamento mês a mês"         ← tabela 8 colunas (Linha, M-5..Atual, δ, YTD)
```

**Topbar:** period tabs → `display: none`; DRE toolbar → `display: flex`.

### KPIs (4 cards — `kpi-4`)

| # | Label | dM | Cor spark |
|---|-------|-----|-----------|
| 1 | Receita Bruta | `(cur/prev-1)*100` | `#0073BB` |
| 2 | CMV | idem | `#dc2626` |
| 3 | Margem Bruta | idem | `#16a34a` |
| 4 | Margem % | `cur.margemPct - prev.margemPct` (deltaPP) | `#0073BB` |

Sparks: série de 6 meses (`dreSeries` → `m.receita` etc.)  
API: `GET /api/v1/dre?month={month}&year={year}&locationId={id}`

### Chart: Waterfall do mês

Itens e cores:
```
Receita Bruta  → type: 'start' → #0073BB
(−) Descontos  → type: 'minus' → #dc2626
(−) CMV        → type: 'minus' → #dc2626
Margem Bruta   → type: 'total' → #16a34a
```

### Chart: Margem % — últimos 6 meses

- 4 séries: Combustível `#0073BB`, Conveniência `#EC7211`, Lubrificantes `#6B40C4`, Serviços `#0891b2`
- `pointRadius: 3`, `fill: false`, Y-axis `v + '%'`
- Labels: `series.map(m => m.label)` → ex: `["Jan/26", "Fev/26", …]`

### Tabela: Detalhamento mês a mês

**Colunas:** Linha | M-5 | M-4 | M-3 | M-2 | M-1 | Atual | δ | YTD

Headers dinâmicos: atualizados com `series[i].label` a cada mudança de mês/ano.

| Linha | getter | Classe TR | Prefixo negativo |
|-------|--------|-----------|-----------------|
| Receita Bruta | `m.receita` | `.dre-row` | — |
| (−) Descontos | `m.desconto` | `.dre-row` | `"−"` |
| Receita Líquida | `m.receitaLiq` | `.dre-row.dre-row-total` | — |
| (−) CMV | `m.cmv` | `.dre-row` | `"−"` |
| Margem Bruta | `m.margem` | `.dre-row.dre-row-result` | — |
| Margem % | `m.margemPct` | `.dre-row` | — (formato `v.toFixed(1)+'%'`) |

Coluna δ: `deltaTag(delta, isPP)` — delta relativo vs mês anterior (`%`) ou pp para Margem%.  
Coluna YTD: `fmtBRL(soma)` — Margem % exibe `"—"`.  
Coluna Atual: `style="font-weight: 600"` inline.

### DRE toolbar — comportamento

`dreShift(±1)`:
```ts
state.dre.monthIdx += dir;
if (state.dre.monthIdx < 0)  { state.dre.monthIdx = 11; state.dre.year--; }
if (state.dre.monthIdx > 11) { state.dre.monthIdx = 0;  state.dre.year++; }
renderDRE();
```

Selects de mês/ano: `onChange` atualiza estado → `renderDRE()`.

---

## `/sync` — Sincronização

**Fonte HTML:** `#page-sincronizacao` | **app.js:** `renderSync()`

### Estrutura vertical

```
page-head
  h1 "Sincronização"
  sub "Status dos ERPs conectados e histórico das últimas execuções."
  page-actions: [btn-primary Sincronizar agora] → runSync(btn)

sync-grid (2 colunas)
  card sync-card: "Status · Status ERP"    ← sync-dot.ok + pulse + badge-success
  card sync-card: "Status · WebPosto ERP"  ← sync-dot.warn + badge-warning

card "Histórico de execuções"              ← sync-list
```

**Topbar:** sem period tabs, sem location select, sem btn-sync.

### Status cards

**Status ERP:**
- `sync-dot.ok` (com ring pulsante `@keyframes pulse`)
- "Conectado" + badge-success "Última sync OK"
- meta: "Próxima sync agendada: **03:00 BRT** · **4 locations** · watermark: **16/05 22:48**"

**WebPosto ERP:**
- `sync-dot.warn`
- "Sem locations" + badge-warning "Aguardando contrato"
- meta: "Conector implantado · nenhuma rede com WebPosto ainda."

API: `GET /api/v1/sync/status`

### Histórico (sync-list)

Cada `.sync-row`: `dot (8×8px)` + `.sync-time` (mono, min-width 130px) + `.sync-loc` (min-width 130px) + badge (ok→success, warn→warning, err→danger) + nota opcional (11px muted-foreground) + `.sync-recs` (margin-left auto)

### Botão Sincronizar agora

`POST /api/v1/sync/trigger` → toast success "Sincronização concluída · {n} registros novos"  
Durante 1800ms: spinner + "Sincronizando…" (botão desabilitado).

---

## `/settings` — Configurações

**Fonte HTML:** `#page-configuracoes` | **app.js:** `renderConfig()`

### Estrutura vertical

```
page-head
  h1 "Configurações"
  sub "Tenant, locations, usuários e integrações."

cfg-grid (2 colunas)
  card (padding pad-card): "Tenant"                    ← cfg-rows
  card (padding pad-card): "Integração — Status ERP"   ← cfg-rows

card: "Locations"
  card-h (border-bottom inline) + cfg-loc-list

card: "Usuários"
  card-h (border-bottom inline) + cfg-loc-list
```

**Topbar:** sem period tabs, sem location select, sem btn-sync.

### Card Tenant

| Label | Valor | Notas |
|-------|-------|-------|
| Nome da rede | "{tenant.name}" | — |
| Plano | badge-primary "{plano}" + "· até N locations" | — |
| Fuso horário | "{timezone}" | `.mono` |
| Idioma | "Português (Brasil)" | — |
| Tenant ID | "{tenant.id}" | `.mono` |

API: `GET /auth/me`

### Card Integração — Status ERP

| Label | Valor | Notas |
|-------|-------|-------|
| Host | "{host}:{port}" | `.mono` |
| Database | "{database}" | `.mono` |
| Usuário | "{user}" | `.mono` |
| Watermark | "{watermark}" | `.mono` |
| Agente | badge-success "{version}" | — |

API: `GET /api/v1/sync/status`

### Locations (cfg-loc-list)

Cada `.cfg-loc-row`:
- Avatar 32×32px, border-radius 6px, bg `hsl(var(--primary-subtle))`, cor `hsl(var(--primary))`, iniciais 2 letras, 11px bold
- Nome (13px, font-weight 500) + meta (11px, muted, margin-top 2px): source_id · tipo ERP
- badge-success "Ativo"

API: `GET /api/v1/locations`

### Usuários (cfg-loc-list)

Cada `.cfg-loc-row`:
- Avatar: owner → `linear-gradient(135deg, #0073BB, #6B40C4); color: white` | demais → primary-subtle / primary
- Nome + email + escopo (meta)
- Badge de role: owner → badge-primary | manager, viewer → badge (neutro)

API: `GET /api/v1/users` (ou via `GET /auth/me` + endpoint de usuários do tenant)

---

## Divergências entre HTML de referência e implementação React

| # | HTML | React (correto) |
|---|------|-----------------|
| 1 | Sidebar com 4 análises (sem Arla/Lubrificantes) | 5 análises + Arla 32 + Lubrificantes como páginas próprias **[produto]** |
| 2 | DRE na seção "Análise" | DRE em seção "Financeiro" separada **[produto]** |
| 3 | Conveniência = "& Serviços" com toggle 4 views | Conveniência = apenas loja, sem toggle **[produto]** |
| 4 | Arla 32 e Lubrificantes inexistentes como páginas | Páginas `/arla` e `/lubrificantes` dedicadas **[produto]** |
| 5 | Seção "Análise" de Conveniência inclui Serviços | Serviços dentro de Conveniência, sem página própria **[produto]** |

**Regra:** para tudo que NÃO está listado como divergência, copiar o HTML exatamente.

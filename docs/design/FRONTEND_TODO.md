# Frontend — To-Do List de Implementação

> Fonte de verdade visual: `docs/design/PostoInsight/PostoInsight.html`
> Arla 32 → `/arla` (página própria). Lubrificantes → `/lubrificantes` (página própria).
> Combustível → apenas combustíveis. Conveniência → apenas loja.
> Antes de marcar qualquer task como concluída: verificar visualmente contra o HTML.

---

## Fase 1 — Scaffold ✅

- [x] `apps/web/` criado com Vite + React + TypeScript
- [x] `tailwind.config.ts` com preset de tokens customizados
- [x] `globals.css` com variáveis CSS do design system
- [x] Fonte Geist via Google Fonts (ou local)
- [x] `src/lib/cn.ts` — utilitário classnames
- [x] `src/router.tsx` — React Router v6 com rotas principais
- [x] `src/App.tsx` com `AuthContext` + `PrivateRoute`
- [x] `src/main.tsx` com `QueryClient` (TanStack Query v5)

**Critério:** `pnpm dev` sobe, página em branco sem erros no console.

---

## Fase 2 — CSS Tokens (globals.css) ✅

Extrair os valores exatos do `<style>` de `PostoInsight.html`.

- [x] `:root` light — todas as variáveis HSL (ver `docs/design/tokens.md`)
- [x] `html.dark` — override das variáveis para dark mode
- [x] `html.compact` — override das variáveis de densidade
- [x] Variáveis de densidade: `--pad-card`, `--pad-card-y`, `--gap-grid`, `--gap-row`, `--kpi-pad`, `--kpi-val-size`, `--row-pad-y`
- [x] `--radius: 0.5rem`, `--radius-sm: 0.3rem`
- [x] `--shadow-sm`, `--shadow`, `--shadow-md` — valores literais
- [x] Scrollbar customizada (webkit)
- [x] `body { font-family: 'Geist', system-ui, ... }` com `font-feature-settings: 'cv11', 'ss01'`
- [x] `.mono` e `.tnum` utilitários

**Critério:** DevTools mostra variáveis HSL no `:root`. Dark mode funciona com `document.documentElement.classList.add('dark')`.

---

## Fase 3 — Utilitários ✅

- [x] `src/lib/cn.ts` — clsx + tailwind-merge
- [x] `src/lib/formatters.ts` — `fmtBRL`, `fmtBRLk`, `fmtLitros`, `fmtPct`, `fmtNum`
- [x] `src/lib/api.ts` — cliente fetch com cookie automático, base URL via env, tipagem de erro
- [x] `src/lib/chart-theme.ts` — constante `CHART_COLORS` com valores de `charts.js`: `combustivel: '#0073BB'`, `conveniencia: '#EC7211'`, `lubrificantes: '#6B40C4'`, `arla: '#1D8102'`, `servicos: '#0891b2'`, `positive: '#16a34a'`, `negative: '#dc2626'`
- [x] `src/hooks/usePeriod.ts` — estado de período (hoje/semana/mes/mes-ant) + dateRange calculado
- [x] `src/hooks/useLocationFilter.ts` — estado de locationId selecionada

**Critério:** `fmtBRL(1240000)` retorna `'R$ 1.240.000,00'`. `CHART_COLORS.combustivel === '#0073BB'`.

---

## Fase 4 — Layout (AppShell, Sidebar, Topbar) ✅

Implementar o shell exatamente como no HTML.

- [x] `AppShell.tsx` — `body { display: flex; overflow: hidden }` → sidebar + main (flex-col)
- [x] `Sidebar.tsx` — `w-60` (240px), dark bg, seções Análise/Financeiro/Sistema, item ativo com `::before` azul, footer com TenantBadge
- [x] Sidebar — logo SVG igual ao HTML (gradiente `#0073BB → #005f99` no rect, path "P" em branco)
- [x] Sidebar — nav sections com `sb-section-label` uppercase tracking
- [x] Sidebar — item ativo: `background: hsl(var(--sidebar-active-bg))` + barra `2.5px` `hsl(var(--sidebar-active))` left-0
- [x] `Topbar.tsx` — `padding: 12px 24px`, breadcrumb, `.topbar-right` com `margin-left: auto`
- [x] Topbar — `PeriodSelector` (segment control) visível por padrão, oculto na rota `/dre`
- [x] Topbar — `LocationSelect` (select.input) global
- [x] Topbar — botão "Sincronizar" + Avatar

**Critério:** Layout é `display: flex` horizontal. Sidebar tem 240px fixo. Scroll só no `.content`. Item ativo tem barra azul esquerda.

---

## Fase 5 — Componentes UI ✅ (parcial)

### KpiCard ✅
- [x] `min-height: 116px`, `padding: var(--kpi-pad)`, `overflow: hidden`
- [x] `.kpi-spark` — SVG absoluto, `opacity: 0.28`, `pointer-events: none`, `z-index: 0`
- [x] `.kpi-label`, `.kpi-value` com `z-index: 1` (acima do sparkline)
- [x] `.kpi-deltas` com `margin-top: auto` (cola no fundo do card)
- [x] Suporte a `invertColors` (CMV — delta negativo é bom)

### SectionCard ✅
- [x] `.card-h` com slot direito para segment/botão
- [x] `.card-b` para conteúdo com padding
- [x] Prop `noPadding` para quando o conteúdo vai até a borda (tabela)

### DeltaTag ✅
- [x] `delta-pos` (success), `delta-neg` (danger), `delta-neu` (muted)
- [x] Prop `compact` para uso inline (sem label)

### Button ✅ (via shadcn)
- [x] Variantes: outline, primary, ghost, icon, sm — valores do HTML

### Select ✅ (via shadcn)
- [x] Height `34px`, padding `0 28px 0 12px`, chevron via background-image

### SegmentedControl / PeriodSelector ✅
- [x] Container muted, botões de 28px altura, `.active` com fundo card + shadow-sm

### EmptyState ✅
- [x] Borda dashed 1.5px, padding 40px 24px, `max-width: 320px` na descrição

### StatusBadge ✅
- [x] Variantes: success, warning, danger, primary, soft — border-radius 999px, font-size 11px

### SkeletonLoader ✅
- [x] `KpiSkeleton`, `ChartSkeleton`, `TableSkeleton`

### Toast ⬜
- [ ] Posição `fixed right-6 bottom-6`, `translateY(20px) → (0)`, variantes success/info
- [ ] Hook `useToast()` para disparar via código

### Spinner ⬜
- [ ] 14px padrão, 32px no `.spinner-lg`, border-top `hsl(var(--primary))`

**Critério:** KpiCard com sparkline renderiza igual ao HTML. Sparkline está atrás do texto.

---

## Fase 6 — Componentes de Gráfico ✅ (parcial)

### Sparkline (SVG inline) ✅
- [x] `Sparkline.tsx` — SVG hand-rolled, viewBox `0 0 200 60`, curva cubic-bezier
- [x] Fill `fill-opacity: 0.22`, stroke `1.4px`, `stroke-linecap: round`
- [x] Curva na metade inferior do viewBox (`H * 0.45`)

### DonutChart ✅
- [x] Recharts `PieChart` + `Pie` com `innerRadius`
- [x] Centro customizável (label + valor)
- [x] Legenda com `.dl-dot` (border-radius 2px, não circular)
- [x] `onSliceClick` para filtro

### LineAreaChart ✅ (via ComposedChart)
- [x] Recharts `AreaChart` com gradiente SVG
- [x] Linha de margem % no eixo direito (opcional, tracejada)

### MultiLineChart ✅
- [x] Recharts `LineChart` com múltiplas séries por produto
- [x] Cores de `CHART_COLORS`

### ComposedChart ✅
- [x] Bar + Line (eixos duplos)
- [x] Tooltip com formato BRL e %

### BarChart ✅
- [x] Recharts `BarChart` simples e agrupado

### Heatmap ✅
- [x] CSS Grid + lógica de cor JS puro
- [x] Células `height: 36px`, `border-radius: 5px`
- [x] Legenda com gradiente

### ScatterChart ⬜ (para Conveniência)
- [ ] Recharts `ScatterChart` com `ZAxis` (tamanho da bolha = receita)
- [ ] Linhas medianas (X e Y) para dividir em 4 quadrantes
- [ ] Tooltip com nome da categoria, qtd, margem %, receita

**Critério:** Todos os gráficos usam Recharts. Sparklines são SVG inline. Cores correspondem ao `CHART_COLORS`.

---

## Fase 7 — Drawer ✅

- [x] `Drawer.tsx` — `position: fixed; right: 0; width: 420px; max-width: 92vw`
- [x] `transform: translateX(100%)` → `translateX(0)` em `0.22s cubic-bezier(0.16, 1, 0.3, 1)`
- [x] Overlay com `opacity: 0 → 1` em `0.18s`, `z-index: 40`, `z-index: 41` para o drawer
- [x] `.drawer-head` com título e botão fechar (btn-ghost btn-icon btn-sm)
- [x] `.drawer-body` overflow-y: auto
- [x] `.drawer-row` com border-bottom, `.drawer-row-l` e `.drawer-row-v`

**Critério:** Drawer desliza da direita. Overlay escurece o fundo. Fechar com botão X ou clique no overlay.

---

## Fase 8 — Autenticação ✅

- [x] `AuthContext.tsx` — `user`, `isLoading`, `login()`, `logout()`
- [x] `GET /auth/me` no carregamento para restaurar sessão
- [x] `PrivateRoute.tsx` — redireciona para `/login` se não autenticado
- [x] `Login/index.tsx` — form email/senha, `POST /auth/login`, cookie HttpOnly automático
- [x] `POST /auth/logout` limpa cookie e redireciona

**Critério:** Reload mantém sessão. Acesso sem auth redireciona para `/login`. Login inválido mostra erro.

---

## Fase 9 — Página: Visão Geral (/dashboard) ✅

- [x] KPI row `kpi-5`: Receita Bruta, Margem %, Volume Combustível, Ticket Médio, CMV %
- [x] Sparklines nos KPIs com cor `CHART_COLORS.combustivel`
- [x] `.row` `2fr 1fr` → ComposedChart (bar receita + linha margem%) + DonutChart (mix por segmento)
- [x] DonutChart — clique em fatia filtra tabela Top Produtos
- [x] `.row` `2fr 1fr` → DataTable Top Produtos + Heatmap Padrão Semanal
- [x] DataTable: colunas #, Produto, Receita, Participação (bar-cell), Margem %
- [x] Skeleton durante loading

**Pendente:**
- [ ] Heatmap com dados reais (endpoint de dados por dia da semana ainda não existe) — usar EmptyState por enquanto
- [ ] Botão "Exportar" no page-actions

**Critério:** 5 KPIs renderizados, gráficos visíveis com dados reais da API, tabela filtrável por segmento via donut.

---

## Fase 10 — Página: Combustível (/combustivel) ⬜

- [ ] KPI row `kpi-5`: Volume Total, Receita Bruta, Margem Bruta, Margem %, Preço Médio/L
- [ ] `.page-actions`: segment "Volume / Receita" + segment "Sem Arla 32 / Com Arla 32"
- [ ] `.row` `3fr 2fr` → MultiLineChart (`/api/v1/combustivel/evolucao?por_produto=true`) + DonutChart (mix)
- [ ] `.row` `2fr 1fr` → DataTable Breakdown (produtos com spark tendência 14d) + EmptyState "Ranking de Bicos"
- [ ] Toggle Volume/Receita altera gráfico e ordem da tabela
- [ ] Toggle Arla 32 inclui/exclui Arla dos dados

**Critério:** Não aparece Arla 32 por padrão. Gráfico multi-linha com 4-5 produtos. Tabela com sparklines.

---

## Fase 11 — Página: Arla 32 (/arla) ⬜

- [ ] KPI row `kpi-5`: Volume Total, Receita Bruta, CMV, Margem Bruta, Margem %
- [ ] `.page-actions`: segment "Linha / Área" + segment "Volume / Receita"
- [ ] Card: gráfico de evolução (`/api/v1/arla/evolucao`) — linha ou área conforme toggle
- [ ] Card fullwidth: DataTable de produtos (`/api/v1/arla/produtos`)
- [ ] Cor de destaque `#0891B2` em sparklines e gráfico

**Critério:** Rota `/arla` existe e carrega dados. Não há menção a combustíveis ou outros segmentos.

---

## Fase 12 — Página: Lubrificantes (/lubrificantes) ⬜

- [ ] KPI row `kpi-4`: Receita Bruta, CMV, Margem Bruta, Margem %
- [ ] `.page-actions`: segment "Receita / Volume"
- [ ] `.row` `3fr 2fr` → LineAreaChart (`/api/v1/lubrificantes/evolucao`) + DonutChart (mix por grupo)
- [ ] Card fullwidth: DataTable de grupos (`/api/v1/lubrificantes/grupos`) com bar-cell de participação
- [ ] Cor de destaque `#7C3AED`

**Critério:** Rota `/lubrificantes` existe. Não aparece em `/conveniencia`.

---

## Fase 13 — Página: Conveniência (/conveniencia) ⬜

- [ ] KPI row `kpi-4`: Receita Bruta, Ticket Médio, Margem Bruta, Margem %
- [ ] `.row` `3fr 2fr` → AreaChart empilhado (`/api/v1/conveniencia/evolucao`) + DonutChart (`/api/v1/conveniencia/top-grupos`)
- [ ] Card fullwidth: ScatterChart matriz de categorias (`/api/v1/conveniencia/categorias`)
   - Eixo X: quantidade, Eixo Y: margem %, tamanho da bolha: receita
   - Linhas medianas em X e Y dividindo em 4 quadrantes
- [ ] Card fullwidth: DataTable breakdown por categoria (clickable → abre Drawer)
- [ ] Drawer: produtos da categoria selecionada com `.drawer-row` para cada métrica

**Critério:** Lubrificantes não aparecem. Scatter renderiza com bolhas proporcionais. Clique na linha abre drawer.

---

## Fase 14 — Página: DRE Mensal (/dre) ⬜

- [ ] KPI row `kpi-4`: Receita Bruta, CMV, Margem Bruta, Margem %
- [ ] Topbar: `.dre-toolbar` substitui `.segment` de período (← select-mês select-ano →)
- [ ] `.row` `1fr 1fr` → Waterfall BarChart + MultiLineChart margem % últimos 6 meses
- [ ] Card fullwidth: tabela DRE (Linha, M-5..Atual, δ, YTD)
   - `.dre-row-total` para subtotais (border-top 2px, fundo muted/40)
   - `.dre-row-result` para margem bruta (border-top success/30, fundo success-subtle, cor success)

**Critério:** Toolbar de data substitui período. Navegação mês anterior/próximo funciona. Linhas result têm cor verde.

---

## Fase 15 — Página: Sincronização (/sync) ⬜

- [ ] `.sync-grid` (2 colunas): card Status ERP + card WebPosto ERP
- [ ] Cada card: `.sync-dot` com estado (ok/warn/err) + badge + `.sync-stat`
- [ ] `.sync-dot.ok::after` com `@keyframes pulse`
- [ ] Card fullwidth: histórico de execuções (`.sync-list` com `.sync-row`s)
- [ ] Cada `.sync-row`: timestamp mono, dot de status, location, badge, contagem de registros
- [ ] Botão "Sincronizar agora" → `POST /api/v1/sync/trigger` → toast success

**Critério:** StatusDot ok pulsa. Toast aparece após sync. Histórico mostra últimas 8 execuções.

---

## Fase 16 — Página: Configurações (/settings) ⬜

- [ ] `.cfg-grid` (2 colunas): card Tenant + card Integração ERP
- [ ] Campos em `.cfg-row`: label + value (com `.mono` para IDs técnicos)
- [ ] Card fullwidth: lista de locations (`.cfg-loc-list`)
- [ ] Card fullwidth: lista de usuários com avatar, nome, email, badge de role
- [ ] Avatar owner: gradient `#0073BB → #6B40C4` (branco); manager/viewer: `primary-subtle` bg

**Critério:** Tenant ID e Host/Database renderizam em fonte mono. Usuários mostram badge de role correto.

---

## Fase 17 — Estados globais e polimento ⬜

- [ ] Toast global (`useToast()`) funcionando em todas as páginas
- [ ] Dark mode toggle (via `html.dark`) — persistido em localStorage
- [ ] Density toggle (via `html.compact`) — persistido em localStorage
- [ ] Rota `/` redireciona para `/dashboard` se autenticado
- [ ] Rota `*` (404) com EmptyState e link para `/dashboard`
- [ ] `<title>` da página atualizado por rota (ex: "Visão Geral — PostoInsight")
- [ ] `aria-label` nos ícones de navegação
- [ ] Animação de transição entre páginas (fade ou slide — opcional)
- [ ] Scrollbar customizada funcionando em `.content` e `.drawer-body`

**Critério:** Dark mode funciona via `html.dark`. Toast global disparado por qualquer página.

---

## Fase 18 — Deploy Railway ⬜

- [ ] `vite.config.ts` com `base: '/'` e `outDir: 'dist'`
- [ ] `public/_redirects` ou configuração de SPA fallback no Railway
- [ ] Variáveis de ambiente: `VITE_API_URL` apontando para `api-production-3a9c.up.railway.app`
- [ ] Serviço `web` no Railway configurado para build estático (`dist/`)
- [ ] CORS no backend (`apps/api`) liberando o domínio do `web`
- [ ] Cookie `SameSite=Lax` com domínio correto em produção (`__Secure-` prefix)

**Critério:** Build `pnpm build` sem erros. Deploy no Railway. Login funcionando em produção.

---

## Checklist de verificação ao final de cada fase de página

- [ ] Fonte é Geist (verificar no DevTools → Computed → font-family)
- [ ] Tokens via `hsl(var(--nome))` — nenhum valor hardcoded de cor
- [ ] Dark mode funciona via classe `html.dark` (não `data-theme`)
- [ ] Layout é `display: flex` horizontal — sem `position: fixed` na sidebar
- [ ] Sidebar: 240px, fundo `hsl(var(--sidebar))`, item ativo com `::before` azul esquerda
- [ ] KpiCard: sparkline de fundo com `opacity: 0.28`, `pointer-events: none`
- [ ] Arla 32 não aparece em `/combustivel`
- [ ] Lubrificantes não aparecem em `/conveniencia`
- [ ] Gráficos usam Recharts — não ECharts, não Chart.js
- [ ] Sparklines são SVG inline — não biblioteca
- [ ] `.tbl th` usa `font-size: 11px` (não 13px)
- [ ] Botões têm `height: 34px` (não 36px ou 40px)

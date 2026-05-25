# PostoInsight Frontend — Prompt de Implementação por Fases

> Entregar este documento ao agente Frontend no início de **cada sessão**.
> Cada fase tem escopo fechado e critério de aceite binário.
> Não avançar para a próxima fase enquanto a atual não passar no critério.

---

## Contexto permanente (ler antes de qualquer sessão)

**Projeto:** PostoInsight — SaaS de BI para redes de postos. Frontend SPA em `apps/web/`.

**Stack obrigatória:**
- Vite 5 + React 18 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@theme inline`)
- Recharts (charts) + SVG inline (sparklines KPI)
- TanStack Query v5 (fetching)
- React Router v6 (navegação)
- Lucide React (ícones)
- Shadcn/ui (componentes base quando aplicável)

**Regra absoluta de design:** o React deve ser **visualmente indistinguível** do HTML de referência em `docs/design/PostoInsight/PostoInsight.html`. Abrir os dois lado a lado — sem diferença visível → aprovado.

**Documentos obrigatórios (ler antes de implementar qualquer item):**
- `docs/design/tokens.md` — todos os CSS vars, tipografia, cores
- `docs/design/components.md` — CSS exato de cada componente
- `docs/design/patterns.md` — estrutura de cada página
- `docs/design/FRONTEND_TODO.md` — especificação completa bloco a bloco

**Auth:** cookie HttpOnly JWE emitido pelo Fastify. `GET /auth/me` restaura sessão. Nunca usar localStorage para token.

**Backend em produção:** `api-production-3a9c.up.railway.app`. Em dev: proxy via Vite para `http://localhost:3001`.

**Nunca:**
- Instalar dependência sem justificar
- Criar componente sem spec no FRONTEND_TODO.md
- Hardcodar cores — usar `hsl(var(--token))`
- Usar `position: fixed` no layout (só em Drawer, Toast, Overlay)
- Commitar — o founder commita

---

## Visão geral das fases

| Fase | Nome | Sessões estimadas |
|------|------|-------------------|
| 1 | Scaffold + globals | 1 |
| 2 | AppShell + Roteamento + Auth | 1 |
| 3 | Componentes base | 1–2 |
| 4 | Componentes de gráfico | 1–2 |
| 5 | Página Visão Geral | 1–2 |
| 6 | Página Combustível | 1 |
| 7 | Páginas Arla 32 + Lubrificantes | 1 |
| 8 | Página Conveniência | 1 |
| 9 | Página DRE Mensal | 1 |
| 10 | Páginas Sync + Settings | 1 |
| 11 | Página Login + Auth guard | 1 |
| 12 | QA visual + dark mode + responsive | 1 |

**Total estimado: 12–14 sessões**

---

---

# FASE 1 — Scaffold + globals.css

**Sessão única. Pré-requisito: nenhum.**

## Objetivo

Criar a estrutura base do projeto Vite + React + TS em `apps/web/`, com Tailwind v4 configurado e todos os tokens CSS aplicados corretamente.

## Tarefas

### 1.1 — Verificar scaffold existente

Ler `apps/web/package.json`, `apps/web/vite.config.ts`, `apps/web/index.html` e `apps/web/src/` para entender o que já existe. Reportar ao founder antes de qualquer modificação.

### 1.2 — Dependências

Verificar se as dependências abaixo estão no `package.json`. Se alguma faltar, listar para o founder aprovar antes de instalar:

```
recharts
@tanstack/react-query
react-router-dom
lucide-react
```

Tailwind v4 (`tailwindcss`, `@tailwindcss/vite`): verificar se já configurado.

### 1.3 — globals.css

Criar/sobrescrever `apps/web/src/globals.css` com exatamente:

1. `@import "tailwindcss";`
2. `@theme inline { ... }` — todos os tokens de `docs/design/tokens.md` seção "Tailwind v4 Setup"
3. `:root { ... }` — todas as CSS vars do light mode (seção "CSS Variables — :root")
4. `html.dark { ... }` — todas as vars do dark mode
5. `html.compact { ... }` — todas as vars do compact
6. `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
7. `html, body { height: 100%; }`
8. `body { font-family: 'Geist'...; font-size: 14px; line-height: 1.5; display: flex; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: 'cv11','ss01'; background: hsl(var(--background)); color: hsl(var(--foreground)); }`
9. `.mono { ... }` e `.tnum { ... }`
10. Scrollbar customizada (6px, border, hover)
11. `@keyframes spin`, `@keyframes pulse` (usados por Spinner e StatusDot)

Referência exata: `docs/design/FRONTEND_TODO.md` Bloco 0.

### 1.4 — Fonte Geist

Em `apps/web/index.html`, adicionar no `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### 1.5 — Modo compact por padrão

Em `apps/web/src/main.tsx` (ou equivalente de entry), antes do `ReactDOM.createRoot`, adicionar:
```ts
// O protótipo usa compact por padrão
document.documentElement.classList.add('compact');
```

### 1.6 — Vite proxy

Em `vite.config.ts`, configurar:
```ts
server: {
  proxy: {
    '/api': 'http://localhost:3001',
    '/auth': 'http://localhost:3001',
  }
}
```

## Critério de aceite

- `pnpm dev` (ou `npm run dev`) inicia sem erro
- Abrir `localhost:5173` → fundo `hsl(210 40% 98%)`, fonte Geist, sem texto ou layout (pode ser só o body vazio)
- Inspecionar `:root` no DevTools → todas as CSS vars presentes com valores HSL corretos
- `html.compact` está aplicado por padrão no `<html>`
- Nenhuma cor hardcoded no globals.css (exceto as constantes de chart que usam hex)

---

---

# FASE 2 — AppShell + Roteamento + Auth

**Sessão única. Pré-requisito: Fase 1 concluída.**

## Objetivo

Implementar a estrutura de layout (Sidebar + Topbar + Content), React Router v6 com todas as rotas, e o fluxo de autenticação via `GET /auth/me`.

## Tarefas

### 2.1 — Estrutura de arquivos

```
apps/web/src/
  components/
    layout/
      AppShell.tsx
      Sidebar.tsx
      Topbar.tsx
  pages/
    VisaoGeral.tsx       ← placeholder
    Combustivel.tsx      ← placeholder
    Arla.tsx             ← placeholder
    Lubrificantes.tsx    ← placeholder
    Conveniencia.tsx     ← placeholder
    DRE.tsx              ← placeholder
    Sync.tsx             ← placeholder
    Settings.tsx         ← placeholder
    Login.tsx            ← placeholder
  hooks/
    useAuth.ts
    useAppState.ts
  lib/
    api.ts               ← fetch wrapper com credentials: 'include'
  App.tsx
  main.tsx
```

### 2.2 — AppShell

Implementar `AppShell.tsx` com estrutura exata (ver `docs/design/components.md` seção "AppShell"):

```tsx
// body: display flex, overflow hidden — aplicado no globals.css
// .sidebar: 240px, flex-shrink 0
// .main: flex 1, display flex, flex-direction column, min-width 0, overflow hidden
// header.topbar: flex-shrink 0
// .content: flex 1, overflow-y auto, padding 24px
```

**Sem position:fixed no layout.** Drawer e Toast são portais montados no body.

### 2.3 — Sidebar

Implementar `Sidebar.tsx` com todos os valores CSS exatos de `docs/design/components.md` seção "Sidebar".

**Itens de navegação** (ordem exata):

```
Seção "Análise":
  Visão Geral      → /
  Combustível      → /combustivel
  Arla 32          → /arla
  Lubrificantes    → /lubrificantes
  Conveniência     → /conveniencia

Seção "Financeiro":
  DRE Mensal       → /dre

Seção "Operação":
  Sincronização    → /sync   (badge "OK")
  Configurações    → /settings
```

SVGs: usar Lucide React para os ícones dos itens. O logo PostoInsight usa SVG inline customizado (ver HTML linha 618–627 do PostoInsight.html).

Ativo: usar `useLocation()` do React Router para aplicar `.active` no item correto.

Footer: dados dinâmicos de `useAuth()`:
- Ícone: iniciais do tenant (2 letras)
- `.sb-tenant-name`: `session.tenant.name`
- `.sb-tenant-role`: `"{session.role} · {session.user.name}"`

### 2.4 — Topbar

Implementar `Topbar.tsx`. Controles:

1. **Crumb:** `<b>{pageName}</b> › {location.label} · {period.label}` — atualizar via `useAppState()`
2. **Period tabs** (`#period-tabs`): Hoje / Semana / Mês / Mês ant. — escondido nas rotas `/dre`, `/sync`, `/settings`
3. **DRE toolbar** (`#dre-date-toolbar`): ← select[mês] select[ano] → — visível apenas em `/dre`
4. **Location select**: options vindas de `GET /api/v1/locations` — escondido em `/sync`, `/settings`
5. **Btn Sincronizar**: visível apenas em `/` e `/combustivel`
6. **Avatar**: iniciais do usuário logado

Visibilidade baseada em `useLocation().pathname`.

Crumb responsivo:
```css
@media (max-width: 1100px) { .crumb-chevron, .crumb-context { display: none } }
@media (max-width: 980px)  { .crumb { display: none } }
```

### 2.5 — Estado global

Criar `useAppState.ts` com Zustand ou React Context:

```ts
interface AppState {
  period: 'hoje' | 'semana' | 'mes' | 'mes-ant';  // default: 'mes'
  locationId: string;                               // default: 'all'
  dre: { year: number; monthIdx: number };          // default: { year: 2026, monthIdx: 4 }
  topSort: 'receita' | 'margem';
  combMode: 'volume' | 'receita';
  includeArla: boolean;
  theme: 'light' | 'dark';                          // default: 'light'
  density: 'comfortable' | 'compact';               // default: 'compact'
  sparklines: boolean;                              // default: false
}
```

`theme` e `density` persistem em `localStorage`. Ao montar, aplicar classes `html.dark` e `html.compact`.

### 2.6 — Auth

Criar `useAuth.ts`:

```ts
// GET /auth/me com credentials: 'include'
// Se 401 → redirecionar para /login
// Expor: { session, isLoading, isError }
```

Criar `AuthGuard.tsx`: wrapper que exibe spinner enquanto carrega, redireciona para `/login` se não autenticado.

### 2.7 — React Router

Em `App.tsx`:

```tsx
<BrowserRouter>
  <QueryClientProvider client={queryClient}>
    <AuthGuard>
      <AppShell>
        <Routes>
          <Route path="/"              element={<VisaoGeral />} />
          <Route path="/combustivel"   element={<Combustivel />} />
          <Route path="/arla"          element={<Arla />} />
          <Route path="/lubrificantes" element={<Lubrificantes />} />
          <Route path="/conveniencia"  element={<Conveniencia />} />
          <Route path="/dre"           element={<DRE />} />
          <Route path="/sync"          element={<Sync />} />
          <Route path="/settings"      element={<Settings />} />
        </Routes>
      </AppShell>
    </AuthGuard>
    <Route path="/login" element={<Login />} />
  </QueryClientProvider>
</BrowserRouter>
```

Placeholders das páginas: `<div className="page active"><div className="page-head"><h1 className="page-title">{title}</h1></div></div>`

### 2.8 — api.ts

```ts
const BASE = import.meta.env.VITE_API_URL ?? '';

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + path, { credentials: 'include', ...init });
  if (res.status === 401) { window.location.href = '/login'; throw new Error('Unauthorized'); }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

## Critério de aceite

- Navegar entre todas as rotas → sidebar atualiza item ativo, crumb atualiza
- Topbar: period tabs aparecem/somem nas rotas corretas
- DRE toolbar aparece apenas em `/dre`
- Location select some em `/sync` e `/settings`
- Sem dados reais (páginas placeholder) — layout correto
- Abrir ao lado do HTML de referência: sidebar, topbar e estrutura geral indistinguíveis

---

---

# FASE 3 — Componentes Base

**1–2 sessões. Pré-requisito: Fase 2 concluída.**

## Objetivo

Implementar todos os componentes reutilizáveis sem lógica de dados. Cada componente deve ser visualmente idêntico ao HTML de referência.

## Arquivo de referência obrigatório

`docs/design/components.md` — ler cada seção antes de implementar o componente correspondente.

## Tarefas

Criar em `apps/web/src/components/`:

### 3.1 — Primitivos de controle

```
ui/
  Button.tsx        ← .btn + variantes (outline, primary, ghost, icon, sm)
  Input.tsx         ← select.input / .input com chevron SVG
  SegmentedControl.tsx  ← .segment + buttons com .active
  Badge.tsx         ← 5 variantes (success, warning, danger, primary, soft)
  Avatar.tsx        ← gradiente linear, iniciais, 32×32
```

### 3.2 — Feedback

```
ui/
  Spinner.tsx       ← 14×14px, border-top primary, animation spin
  Toast.tsx         ← position fixed, right 24 bottom 24, transition translateY + opacity
  EmptyState.tsx    ← border dashed, ícone circular, título, desc
```

**Toast:** implementar como Context + hook `useToast()`:
```ts
// showToast(text, kind: 'success' | 'info')
// Aparece em 0ms (requestAnimationFrame), desaparece após 2800ms
```

### 3.3 — Sparkline SVG

```
charts/
  Sparkline.tsx     ← SVG inline puro, sem Recharts
```

Implementação exata de `docs/design/FRONTEND_TODO.md` Bloco 6:
- `viewBox="0 0 200 60"`, `preserveAspectRatio="none"`
- Y comprimido ao bottom 45%: `H - 4 - ((v - min) / range) * (H * 0.45)`
- Smooth path: `C cpx,y0 cpx,y1 x1,y1` onde `cpx = x0 + (x1-x0)*0.5`
- `fill-opacity: 0.22`, `stroke-width: 1.4`, `vector-effect="non-scaling-stroke"`

### 3.4 — KpiCard

```
ui/
  KpiCard.tsx
```

Props:
```ts
interface KpiCardProps {
  label: string;
  value: string;
  dM: number;
  dY?: number;
  deltaPP?: boolean;
  sparkData?: number[];
  sparkColor?: string;
}
```

- `.kpi-spark` é filho do `<Sparkline />` com `position: absolute; left: -2px; right: -2px; top: 0; bottom: -1px; opacity: 0.28`
- `html.dark .kpi-spark { opacity: 0.38 }`
- `html.no-spark .kpi-spark { display: none !important }`
- `DeltaTag` inline (ver Bloco 5 do FRONTEND_TODO.md)

### 3.5 — Card (SectionCard)

```
ui/
  Card.tsx          ← .card, .card-h, .card-b, .card-title, .card-desc
```

Props: `title`, `desc?`, `actions?` (slot direito do .card-h), `children` (vai para .card-b), `headerBorder?` (border-bottom inline em Locations/Usuários).

### 3.6 — Drawer

```
ui/
  Drawer.tsx        ← overlay + panel + portal via ReactDOM.createPortal
```

- Overlay: `position: fixed; inset: 0; background: hsl(222 47% 11% / 0.4); opacity: 0; transition: opacity 0.18s; z-index: 40`
- Panel: `position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 92vw; transform: translateX(100%); transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1); z-index: 41`
- `.open` em ambos quando aberto
- Fechar: click no overlay OU no botão X
- Expor via Context: `useDrawer()` com `open(title, content)` e `close()`

### 3.7 — Tabela base

```
ui/
  Table.tsx         ← .tbl-wrap + table.tbl (sem lógica — apenas estrutura e classes)
  TableCells.tsx    ← RowRank, SegCell, BarCell, SparkCell (elementos de célula auxiliares)
```

### 3.8 — DeltaTag e formatação

```
lib/
  format.ts         ← fmtBRL, fmtBRLFull, fmtInt, fmtPct, fmtDelta
ui/
  DeltaTag.tsx
```

```ts
export function fmtBRL(v: number): string {
  if (v >= 1e6) return 'R$ ' + (v/1e6).toFixed(2).replace('.', ',') + ' mi';
  if (v >= 1e3) return 'R$ ' + Math.round(v/1e3).toLocaleString('pt-BR') + 'k';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}
export function fmtBRLFull(v: number): string { return 'R$ ' + Math.round(v).toLocaleString('pt-BR'); }
export function fmtInt(v: number): string { return Math.round(v).toLocaleString('pt-BR'); }
export function fmtPct(v: number, d = 1): string { return v.toFixed(d).replace('.', ',') + '%'; }
```

**Nunca usar ponto como separador decimal** — sempre vírgula.

## Critério de aceite

Criar `apps/web/src/pages/Storybook.tsx` (temporário, remover depois) que renderiza todos os componentes:
- KpiCard com sparkline visível e deltas
- Badge nas 5 variantes
- Botões nas 4 variantes + sm + icon
- Segmented control com active
- EmptyState
- Toast ao clicar num botão
- Drawer ao clicar num botão

Abrir ao lado do HTML de referência: sem diferença visível em nenhum componente.

---

---

# FASE 4 — Componentes de Gráfico

**1–2 sessões. Pré-requisito: Fase 3 concluída.**

## Objetivo

Implementar todos os componentes de gráfico em Recharts. O output visual deve ser idêntico ao do HTML de referência (que usa Chart.js). Recharts é diferente de Chart.js — mas o resultado visual deve ser o mesmo.

## Arquivo de referência obrigatório

`docs/design/components.md` seção "Gráficos" + `docs/design/PostoInsight/charts.js` (fonte de verdade para cada builder).

## Estrutura de arquivos

```
apps/web/src/components/charts/
  chartTheme.ts           ← tokens light/dark, função chartThemeTokens(isDark)
  chartColors.ts          ← constante CHART_COLORS
  Sparkline.tsx           ← já feito na Fase 3
  TinySparkline.tsx       ← canvas 72×22px para células de tabela
  LineAreaChart.tsx       ← dual-axis (Visão Geral — Receita & Margem)
  MultiLineChart.tsx      ← multi-série (Combustível evolução, DRE margem %)
  DonutChart.tsx          ← 72% cutout, legenda custom
  ConvAreaChart.tsx       ← stacked area (Conveniência)
  WaterfallChart.tsx      ← DRE waterfall
  ScatterChart.tsx        ← Conveniência matriz quadrantes
  Heatmap.tsx             ← CSS Grid puro (sem Recharts)
```

### 4.1 — chartTheme.ts + chartColors.ts

```ts
// chartColors.ts
export const C = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  arla:          '#1D8102',
  servicos:      '#0891b2',
  s1: '#0073BB', s2: '#EC7211', s3: '#6B40C4',
  s4: '#1D8102', s5: '#0891b2', s6: '#db2777',
  pos: '#16a34a', neg: '#dc2626', neutral: '#64748b',
} as const;

// chartTheme.ts
export function chartThemeTokens(isDark: boolean) {
  return isDark ? {
    grid: '#1f2937', tick: '#94a3b8', tooltipBg: '#0f172a',
    tooltipBorder: '#1f2937', titleColor: '#f1f5f9', bodyColor: '#94a3b8', surface: '#0f172a',
  } : {
    grid: '#e2e8f0', tick: '#64748b', tooltipBg: '#ffffff',
    tooltipBorder: '#e2e8f0', titleColor: '#0f172a', bodyColor: '#64748b', surface: '#ffffff',
  };
}
```

Hooks para detectar dark mode: `const isDark = document.documentElement.classList.contains('dark')`.

### 4.2 — TinySparkline

Canvas 72×22px renderizado com Recharts `<LineChart>` sem eixos:

```tsx
<LineChart width={72} height={22} data={data.map(v => ({ v }))}
           margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
  <Line type="monotone" dataKey="v" stroke={color}
        strokeWidth={1.4} dot={false} isAnimationActive={false} />
</LineChart>
```

### 4.3 — LineAreaChart (dual-axis)

Equivalente ao `revenueDual()` de `charts.js`. Ver especificação em `docs/design/FRONTEND_TODO.md` Bloco 13 e `docs/design/components.md` seção "LineAreaChart".

Props: `labels`, `receita`, `margemPct`

Datasets:
1. Receita Bruta — Area, `#0073BB`, gradiente `#0073BB80` → `#0073BB10`
2. Margem Bruta — Area, `#16a34a`, gradiente `#16a34a80` → `#16a34a10`
3. Margem % — Line dashed (`strokeDasharray="6 4"`), `#EC7211`, eixo direito, **hidden por padrão**

Legend: position bottom, `iconType="circle"`, 11px, cor `token.tick`.

### 4.4 — MultiLineChart

Props: `labels`, `datasets: Array<{ name: string; data: number[]; color: string }>`, `fill?: boolean`, `yFormatter?`

- `fill=true` → stacked area com gradientes (Combustível evolução)
- `fill=false` → multi-line limpo com `pointRadius: 3` (DRE margem %)
- Paleta padrão: `C.s1..s6`

### 4.5 — DonutChart

Props: `items: Array<{ label: string; value: number; color: string }>`, `centerLabel: string`, `centerValue: string`

```tsx
// Recharts PieChart — não usa legend nativa
// innerRadius="72%" outerRadius="100%"
// strokeWidth={2} stroke={token.surface}
// Legenda customizada: .donut-legend grid 2 cols, .dl-dot border-radius 2px (quadrado!)
```

### 4.6 — ConvAreaChart

Props: `labels`, `receita`, `margem`

```tsx
// Receita: #EC7211, gradiente EC7211 80→10, fill origin
// Margem Bruta: #16a34a, gradiente 16a34a 80→10, fill origin
// Sem pontos, sem legend nativa — usar LEG_B equivalente
```

### 4.7 — WaterfallChart

Props: `items: Array<{ label: string; type: 'start'|'plus'|'minus'|'total'; value: number }>`

Implementar conforme `charts.js waterfall()`: BarChart com 3 datasets (helper transparente + positivos + negativos), stacked, `borderRadius: 4`, `maxBarThickness: 28`.

### 4.8 — ScatterChart (Quadrantes)

Props: `points: Array<{ name: string; qty: number; mg: number; rev: number; color: string }>`, `medianX: number`, `medianY: number`

Implementação:
- Recharts `ScatterChart` com `<Scatter>` por ponto (bubble via z ou r custom)
- Quadrantes via `<ReferenceArea>` (4 áreas com fill `rgba(22,163,74,0.04)` e `rgba(220,38,38,0.04)`)
- Linhas medianas via `<ReferenceLine>` com `strokeDasharray="3 3"` e `stroke={token.tick + '66'}`
- Labels dos quadrantes via `<customized>` label nos ReferenceArea
- Tooltip custom: nome, `Qtd: {n}`, `Margem: {v}%`, `Receita: {fmtBRL}`

### 4.9 — Heatmap

**CSS Grid puro — sem Recharts.**

Props: `cells: Array<{ day: string; values: number[] }>`, `min: number`, `max: number`

Implementar conforme `docs/design/components.md` seção "Heatmap" e `docs/design/FRONTEND_TODO.md` Bloco 10.

Lógica de cor:
```ts
const t = (value - min) / (max - min);
const alpha = 0.08 + t * 0.92;
const bg = `hsl(204 100% 37% / ${alpha})`;
const color = t > 0.55 ? '#fff' : 'hsl(var(--foreground))';
```

## Critério de aceite

Adicionar ao `Storybook.tsx` temporário:
- LineAreaChart com 30 pontos de dados mock
- MultiLineChart com 4 séries
- DonutChart com 4 segmentos
- ConvAreaChart com 30 pontos
- WaterfallChart com 4 itens (start, minus, minus, total)
- ScatterChart com 10 pontos
- Heatmap 7×4

Abrir ao lado do HTML de referência (navegar para a página correspondente): sem diferença visual perceptível.

---

---

# FASE 5 — Página Visão Geral

**1–2 sessões. Pré-requisito: Fases 3 e 4 concluídas.**

## Objetivo

Implementar a página `/` completa, consumindo dados reais da API.

## Arquivos de referência

- `docs/design/patterns.md` seção "/ — Visão Geral"
- `docs/design/FRONTEND_TODO.md` Bloco 13
- HTML referência: `#page-visao-geral` (linhas 739–867)
- app.js: `renderVisaoGeral()` (linhas 67–131)

## Endpoints

```
GET /api/v1/vendas/resumo?period={period}&locationId={locationId}
  → { receita, cmv, margem, margemPct, itens, series: { labels, receita, margemPct } }

GET /api/v1/vendas/top-produtos?period={period}&locationId={locationId}&sort={receita|margem}
  → products[]

GET /api/v1/locations
  → locations[] (para o select)
```

Heatmap: se endpoint não existir, usar dados mock estáticos com EmptyState informando "Dados por semana — em breve".

## Tarefas

### 5.1 — Hook de dados

```ts
// hooks/useVisaoGeral.ts
export function useVisaoGeral(period: string, locationId: string) {
  const resumo = useQuery({ queryKey: ['vg-resumo', period, locationId], queryFn: ... });
  const topProdutos = useQuery({ queryKey: ['vg-top', period, locationId, sort], queryFn: ... });
  return { resumo, topProdutos };
}
```

### 5.2 — Estrutura da página

```tsx
// pages/VisaoGeral.tsx
export function VisaoGeral() {
  const { period, locationId } = useAppState();
  const { resumo, topProdutos } = useVisaoGeral(period, locationId);

  if (resumo.isLoading) return <PageSkeleton />;

  return (
    <section className="page active">
      <PageHead title="Visão Geral" sub="Consolidado da rede — vendas, margens e padrão de demanda.">
        <Button variant="outline" size="sm"><Download /> Exportar</Button>
      </PageHead>

      <div className="kpi-grid kpi-5">
        <KpiCard label="Receita Bruta" value={fmtBRL(data.receita)} ... sparkColor="#0073BB" />
        {/* + 4 cards */}
      </div>

      <div className="row row-3-2">
        <Card title="Evolução de Receita & Margem" desc="...">
          <div className="chart-box">
            <LineAreaChart labels={...} receita={...} margemPct={...} />
          </div>
        </Card>
        <Card title="Mix por Segmento" desc="% da receita bruta">
          <DonutChart items={segmentos} centerLabel="Total" centerValue={fmtBRL(total)} />
        </Card>
      </div>

      <Card title="Breakdown por Segmento" desc="Clique numa linha para abrir o detalhamento.">
        {/* tabela de segmentos clickable → drawer */}
      </Card>

      <div className="row row-2-1">
        <Card title="Top 10 Produtos por Receita" actions={<TopSortSegment />}>
          {/* tabela top produtos */}
        </Card>
        <Card title="Padrão Semanal" desc="Receita por dia × semana">
          <Heatmap cells={heatmap.cells} min={heatmap.min} max={heatmap.max} />
        </Card>
      </div>
    </section>
  );
}
```

### 5.3 — Drawer de segmentos

Ao clicar em linha da tabela de segmentos → `useDrawer().open(title, <SegmentDrillDown seg={seg} />)`.

Conteúdo do drawer: ver `docs/design/FRONTEND_TODO.md` Bloco 12 item #4.  
API real: `GET /api/v1/vendas/drill/subgrupos?segmento={seg}&period={period}&locationId={locationId}`

### 5.4 — TanStack Query keys

Todas as queries devem incluir `period` e `locationId` como parte do `queryKey` para que o React Query refaça o fetch ao mudar os filtros.

### 5.5 — Loading / error states

- Loading: `<div className="kpi-grid kpi-5">` com 5 `<div className="kpi" style="height:116px">` com skeleton `animate-pulse` (Tailwind)
- Error: card com EmptyState "Erro ao carregar dados" + botão Retry

## Critério de aceite

- Abrir `/` → dados reais carregados (não mock)
- Mudar period ou location → dados atualizam
- Clicar em linha da tabela → drawer abre com detalhamento
- Abrir ao lado do HTML de referência (com mock em modo "Mês"): layout e visual indistinguíveis

---

---

# FASE 6 — Página Combustível

**Sessão única. Pré-requisito: Fase 5 concluída.**

## Arquivos de referência

- `docs/design/patterns.md` seção "/combustivel"
- `docs/design/FRONTEND_TODO.md` Bloco 14
- HTML: `#page-combustivel` + app.js `renderCombustivel()`

## Endpoints

```
GET /api/v1/combustivel/resumo?period=&locationId=
GET /api/v1/combustivel/evolucao?por_produto=true&period=&locationId=&includeArla=
GET /api/v1/combustivel/subgrupos?period=&locationId=&includeArla=
```

## Tarefas

### 6.1 — Estado local da página

```ts
const [combMode, setCombMode] = useAppState().combMode;     // 'volume' | 'receita'
const [includeArla, setIncludeArla] = useAppState().includeArla;  // boolean
```

### 6.2 — Estrutura

```tsx
<PageHead title="Combustível" sub="Volumes, receitas e margens por produto.">
  <SegmentedControl
    options={['Volume','Receita']}
    value={combMode}
    onChange={v => setCombMode(v)} />
  <SegmentedControl
    options={['Sem Arla 32','Com Arla 32']}
    value={includeArla ? 'Com Arla 32' : 'Sem Arla 32'}
    onChange={v => setIncludeArla(v === 'Com Arla 32')} />
</PageHead>
```

### 6.3 — Itens críticos

- `card-desc` do chart de evolução: atualizar dinamicamente com `combMode` e `period`
- Donut total: label muda entre "L" e `fmtBRL()` conforme `combMode`
- Tabela: colunas Preço/L e Custo/L usam `.mono` e `toFixed(2).replace('.',',')`
- TinySparkline por produto na coluna Tendência 14d
- EmptyState no card "Ranking de Bicos": ícone clock, texto "Disponível em breve"

## Critério de aceite

- Toggle Volume/Receita → chart e donut atualizam
- Toggle Arla → produto Arla 32 aparece/some
- Mudar period ou location → tudo re-fetcha
- Visual idêntico ao HTML

---

---

# FASE 7 — Páginas Arla 32 + Lubrificantes

**Sessão única. Pré-requisito: Fase 6 concluída.**

## Arla 32 (`/arla`)

Endpoints: `GET /api/v1/arla/resumo`, `/arla/evolucao`, `/arla/produtos`

Estrutura simples:
- 5 KPIs (Volume, Receita, CMV, Margem, Margem %)
- LineChart simples cor `#1D8102`
- Tabela de produtos (6 colunas)

## Lubrificantes (`/lubrificantes`)

Endpoints: `GET /api/v1/lubrificantes/resumo`, `/lubrificantes/evolucao`, `/lubrificantes/grupos`

Estrutura:
- 4 KPIs (Receita, CMV, Margem, Margem %)
- `row row-3-2`: LineChart `#6B40C4` + DonutChart por grupo
- Tabela de grupos (4 colunas)

Ambas as páginas sem segment controls na topbar (apenas period + location).

## Critério de aceite

- Dados carregam, filtros funcionam
- Visual segue o mesmo design system (mesmos tokens, mesmos componentes base)

---

---

# FASE 8 — Página Conveniência

**Sessão única. Pré-requisito: Fase 7 concluída.**

## Arquivos de referência

- `docs/design/patterns.md` seção "/conveniencia"
- `docs/design/FRONTEND_TODO.md` Bloco 15
- HTML: `#page-conveniencia` + app.js `renderConveniencia()`

## Endpoints

```
GET /api/v1/conveniencia/resumo?period=&locationId=
GET /api/v1/conveniencia/top-grupos?period=&locationId=
GET /api/v1/conveniencia/categorias?period=&locationId=
```

## Itens críticos

- ScatterChart com 4 quadrantes e linhas medianas
- Drawer de categoria: lista de produtos com barra de progresso + qtd + margem% + trend
- Escopo: **apenas loja** — sem toggle de view (diferente do HTML de referência)
- Donut "Mix da Loja": top grupos por receita

## Critério de aceite

- Scatter renderiza com quadrantes visíveis (labels ESTRELAS, QUESTIONÁVEIS, CAIXA, VOLUME)
- Clicar linha tabela → drawer com produtos
- Visual do scatter identifica claramente os 4 quadrantes

---

---

# FASE 9 — Página DRE Mensal

**Sessão única. Pré-requisito: Fase 8 concluída.**

## Arquivos de referência

- `docs/design/patterns.md` seção "/dre"
- `docs/design/FRONTEND_TODO.md` Bloco 16
- HTML: `#page-dre` + app.js `renderDRE()`

## Endpoint

```
GET /api/v1/dre?month={0..11}&year={2024..}&locationId=
→ { receita, desconto, receitaLiq, cmv, margem, margemPct, segmentos, series[] }
```

## Itens críticos

### DRE toolbar na topbar

Ao entrar em `/dre`, `period-tabs` some e `dre-date-toolbar` aparece. Implementado via `useLocation()` no Topbar.

Os selects de mês/ano sincronizam com `state.dre`. Botões ← → chamam `dreShift(±1)`.

### Tabela DRE

- `.dre-row-total`: `border-top: 2px solid border`, `font-weight: 600`, `bg: muted/0.4`
- `.dre-row-result`: `border-top: 2px solid success/0.3`, `bg: success-subtle`, `font-weight: 700`, `color: success`
- Dark: `.dre-row-result td { color: hsl(140 70% 60%) }`
- Linhas negativas (Descontos, CMV): prefixo `"−"` nos valores
- Coluna Atual (última): `font-weight: 600` inline
- Coluna δ: `<DeltaTag value={delta} isPP={isMargemPct} />`
- YTD Margem %: exibir `"—"`

### Headers dinâmicos

```ts
// series[i].label = "Jan/26", "Fev/26", etc.
// Colunas M-5..Atual → series[0..5].label
```

### WaterfallChart

Itens: Receita Bruta (start, azul) → (−) Descontos (minus, vermelho) → (−) CMV (minus, vermelho) → Margem Bruta (total, verde)

## Critério de aceite

- DRE toolbar visível apenas em `/dre`
- ← → navegam entre meses com wrap ano correto
- Tabela com 6 linhas, headers de mês corretos
- Linha Margem Bruta em verde/success
- WaterfallChart com 4 barras nas cores corretas

---

---

# FASE 10 — Páginas Sync + Settings

**Sessão única. Pré-requisito: Fase 9 concluída.**

## Sync (`/sync`)

Endpoint: `GET /api/v1/sync/status`

### Estrutura

```
page-head: "Sincronização" + btn-primary "Sincronizar agora"
sync-grid (2 cols):
  card: Status ERP (sync-dot.ok com pulse + badge-success)
  card: Status WebPosto (sync-dot.warn + badge-warning)
card: Histórico de execuções (sync-list)
```

### Botão Sincronizar agora

`POST /api/v1/sync/trigger`:
1. Botão: spinner + "Sincronizando…" (desabilitado)
2. Aguardar resposta
3. Toast success "Sincronização concluída · {n} registros novos"
4. Restaurar botão

StatusDot.ok: `@keyframes pulse` com `::after` ring animado.

---

## Settings (`/settings`)

Endpoint: `GET /auth/me` (tenant, user) + `GET /api/v1/locations`

### Estrutura

```
cfg-grid (2 cols):
  card: Tenant (5 cfg-rows)
  card: Integração — Status ERP (5 cfg-rows)
card: Locations (cfg-loc-list)
card: Usuários (cfg-loc-list)
```

Avatar owner: `linear-gradient(135deg, #0073BB, #6B40C4); color: white`  
Avatar demais: `hsl(var(--primary-subtle))` + `hsl(var(--primary))`

## Critério de aceite

- Sync: dot.ok com animação pulse visível; botão dispara POST real
- Settings: dados reais do tenant; 4 cards com layout correto

---

---

# FASE 11 — Login + Auth guard

**Sessão única. Pré-requisito: Fase 10 concluída.**

## Objetivo

Implementar página de login e garantir que rotas protegidas redirecionem para `/login` quando não autenticado.

## Endpoint

```
POST /auth/login  body: { email, password }
→ 200 + cookie HttpOnly  |  401 credenciais inválidas
```

## Estrutura da página Login

```tsx
// Sem Sidebar e Topbar — fora do AuthGuard/AppShell
<div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'hsl(var(--background))' }}>
  <div className="card" style={{ width: 380, padding: 32 }}>
    {/* Logo SVG + "PostoInsight" */}
    <h2 style={{ fontSize:18, fontWeight:600, marginBottom:24 }}>Entrar na sua conta</h2>
    <form onSubmit={handleSubmit}>
      <label style={{ fontSize:12, fontWeight:500, color:'hsl(var(--muted-foreground))' }}>Email</label>
      <input className="input" type="email" style={{ width:'100%', marginBottom:16 }} />
      <label style={{ fontSize:12, fontWeight:500, color:'hsl(var(--muted-foreground))' }}>Senha</label>
      <input className="input" type="password" style={{ width:'100%', marginBottom:24 }} />
      <button className="btn btn-primary" style={{ width:'100%' }} disabled={isLoading}>
        {isLoading ? <Spinner /> : 'Entrar'}
      </button>
    </form>
    {error && <p style={{ color:'hsl(var(--danger))', fontSize:12, marginTop:12 }}>Credenciais inválidas.</p>}
  </div>
</div>
```

## AuthGuard

```tsx
export function AuthGuard({ children }) {
  const { session, isLoading } = useAuth();  // GET /auth/me
  if (isLoading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

## Critério de aceite

- Acessar qualquer rota sem cookie → redireciona para `/login`
- Login bem-sucedido → redireciona para `/`
- Login com credenciais erradas → mensagem de erro (sem reload)
- Página de login usa o mesmo design system (tokens, fonte, card)

---

---

# FASE 12 — QA Visual + Dark mode + Responsive

**Sessão única. Pré-requisito: Fase 11 concluída.**

## Objetivo

Garantir fidelidade visual completa, dark mode funcional e responsividade básica.

## Checklist

### Dark mode

- Toggle dark: `document.documentElement.classList.toggle('dark')` + `localStorage.setItem('theme', value)`
- Ao montar: ler `localStorage.getItem('theme')` → aplicar antes do primeiro render
- Charts re-renderizam com `chartThemeTokens(isDark)` corretos
- `.dre-row-result td`: cor verde mais brilhante em dark (`hsl(140 70% 60%)`)
- Sparklines: `opacity: 0.28` → `0.38` em dark

Criar botão de toggle acessível (pode ser no Settings ou ícone na topbar).

### Compact mode

- Toggle density: `document.documentElement.classList.toggle('compact')` + `localStorage`
- Verificar que `--kpi-val-size: 20px`, `--pad-card: 14px`, etc. aplicam corretamente
- KPIs devem reduzir visualmente em compact

### Responsividade

- `@media (max-width: 1180px)`: `.row-2-1`, `.row-1-1`, `.row-3-2` → 1 coluna
- `@media (max-width: 1100px)`: crumb chevron e context ocultos; kpi-4 ainda em 4 colunas
- `@media (max-width: 980px)`: crumb inteiro oculto
- Verificar que Drawer funciona em viewports menores (max-width: 92vw)

### QA por página

Para cada página, abrir o HTML de referência ao lado e verificar:

| Item | Verificar |
|------|-----------|
| Espaçamentos | padding, gap, margin — exatamente iguais |
| Tipografia | font-size, font-weight, letter-spacing — iguais |
| Cores | sem cor hardcoded que não seja constante de chart |
| Bordas | border-radius, border-color — iguais |
| Hover states | row.clickable, btn hover, heat-cell scale |
| Transições | drawer 0.22s, toast 0.2s, overlay 0.18s |
| Animações | pulse no sync-dot.ok, spin no spinner |
| Scrollbar | 6px, thumb border, hover |

### Bugs comuns a verificar

- [ ] KpiCard: sparkline cobre todo o card (left: -2px, right: -2px)
- [ ] DeltaTag: vírgula decimal (não ponto)
- [ ] Donut legend: dots com `border-radius: 2px` (quadrado — não círculo)
- [ ] Tabela: primeira/última coluna com 20px de padding lateral
- [ ] Tfoot: `border-top` e `bg: muted/0.4`
- [ ] Drawer: `max-width: 92vw` em telas pequenas
- [ ] Period tabs: escondidos nas rotas corretas
- [ ] DRE toolbar: visível APENAS em `/dre`

## Critério de aceite final

1. Abrir cada página ao lado do HTML de referência (mesmo período, mesma location) — sem diferença visível
2. Ativar dark mode → visual correto em todas as páginas
3. Ativar compact → KPIs menores, espaçamentos reduzidos
4. Reduzir janela para 1100px → grids colapsam para 1 coluna
5. Fluxo completo: login → navegar entre páginas → filtrar por período/location → abrir drawer → sincronizar → logout

---

---

## Notas para o agente

### Ao iniciar cada fase

1. Ler os arquivos de referência indicados na fase
2. Verificar o estado atual de `apps/web/src/` para não duplicar código existente
3. Nunca instalar dependência sem listar para o founder aprovar
4. Nunca commitar — o founder commita

### Ao terminar cada fase

1. Verificar o critério de aceite da fase
2. Reportar ao founder: o que foi feito, o que ficou pendente e qualquer decisão arquitetural tomada
3. Se uma decisão de produto foi necessária (ex: endpoint com shape diferente do esperado) → documentar a divergência

### Em caso de bloqueio

Se um endpoint não retornar o shape esperado:
1. Parar
2. Reportar ao founder: endpoint, shape esperado, shape recebido
3. Aguardar decisão antes de continuar

Se um componente do design não tiver spec clara:
1. Ler o HTML de referência diretamente (o HTML é sempre a fonte de verdade)
2. Se ainda houver dúvida → reportar ao founder

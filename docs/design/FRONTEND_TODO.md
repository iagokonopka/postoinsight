# Frontend — To-Do List de Implementação

> Tasks em ordem de dependência. Nunca começar uma task sem ter concluído as anteriores do mesmo grupo.
> Cada task é atômica — produz um deliverable claro e testável.
> Referência visual definitiva: `design_example/postoinsight/PostoInsight.html`
> Última atualização: 2026-05-18

---

## Fase 1 — Scaffold e Infraestrutura

> Resultado esperado: `pnpm dev` funciona, proxy para o backend está ativo, TypeScript compila sem erro.

- [ ] **1.1 — Inicializar package.json e dependências de runtime**
  - Arquivo: `apps/web/package.json`
  - Comandos exatos (rodar dentro de `apps/web/`):
    ```bash
    pnpm init
    pnpm add react@18 react-dom@18
    pnpm add react-router-dom@6
    pnpm add @tanstack/react-query@5
    pnpm add recharts
    pnpm add lucide-react
    pnpm add clsx tailwind-merge class-variance-authority
    pnpm add sonner
    pnpm add @radix-ui/react-select @radix-ui/react-dropdown-menu @radix-ui/react-dialog
    pnpm add @radix-ui/react-tabs @radix-ui/react-accordion @radix-ui/react-tooltip
    pnpm add @radix-ui/react-avatar @radix-ui/react-separator @radix-ui/react-switch
    pnpm add @radix-ui/react-popover @radix-ui/react-slot
    ```
  - Critério de pronto: `node_modules/` criado sem erros de peer dependency.

- [ ] **1.2 — Instalar dependências de desenvolvimento**
  - Comandos:
    ```bash
    pnpm add -D vite@5 @vitejs/plugin-react typescript
    pnpm add -D @types/react@18 @types/react-dom@18 @types/node
    pnpm add -D tailwindcss@4 @tailwindcss/vite
    ```
  - Critério de pronto: todos os devDeps listados em `package.json`.

- [ ] **1.3 — Criar `vite.config.ts`**
  - Arquivo: `apps/web/vite.config.ts`
  - Configurar: `@vitejs/plugin-react`, `@tailwindcss/vite`, proxy `/api` e `/auth` → `http://localhost:3000`
  - Conteúdo:
    ```ts
    import { defineConfig } from 'vite';
    import react from '@vitejs/plugin-react';
    import tailwindcss from '@tailwindcss/vite';
    import path from 'path';

    export default defineConfig({
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
      },
      server: {
        proxy: {
          '/api': { target: 'http://localhost:3000', changeOrigin: true },
          '/auth': { target: 'http://localhost:3000', changeOrigin: true },
        },
      },
    });
    ```
  - Critério de pronto: sem erro no `vite.config.ts`.

- [ ] **1.4 — Criar `tsconfig.json`**
  - Arquivo: `apps/web/tsconfig.json`
  - Configurar: `strict: true`, `target: "ES2022"`, `moduleResolution: "bundler"`, `paths: { "@/*": ["./src/*"] }`
  - Critério de pronto: `tsc --noEmit` sem erros em arquivo vazio.

- [ ] **1.5 — Criar `index.html` e entry point**
  - Arquivos: `apps/web/index.html`, `apps/web/src/main.tsx`
  - `index.html`: referencia `src/main.tsx`, carrega fontes Geist e Geist Mono via `@fontsource` ou CDN (Google Fonts não tem Geist — usar `npm:geist` ou CDN `cdn.jsdelivr.net/npm/geist@*`)
    ```bash
    pnpm add geist
    ```
  - `main.tsx`: monta `<App />` com `QueryClientProvider`, `RouterProvider`
  - Critério de pronto: `pnpm dev` abre no browser sem erro de console.

- [ ] **1.6 — Criar `tailwind.config.ts`**
  - Arquivo: `apps/web/tailwind.config.ts`
  - Registrar **todos** os tokens de `docs/design/tokens.md` como extensão de tema
  - Incluir: cores (background, foreground, card, border, muted, primary, success, warning, danger, sidebar, popover), fontFamily (sans: Geist, mono: Geist Mono), borderRadius, boxShadow
  - Seguir exatamente o template da seção 9 de `docs/design/tokens.md`
  - Critério de pronto: `className="bg-primary text-sidebar-foreground"` funciona sem purge.

- [ ] **1.7 — Scripts `package.json`**
  - Adicionar: `"dev": "vite"`, `"build": "tsc && vite build"`, `"preview": "vite preview"`
  - Ajustar `name` para `"@postoinsight/web"` e garantir consistência com workspace root
  - Critério de pronto: `pnpm build` gera `dist/` sem erro TypeScript.

---

## Fase 2 — Design Tokens e Globals

> Resultado esperado: CSS variables light/dark corretas; fontes Geist carregadas; scrollbar customizada.

- [ ] **2.1 — Criar `src/styles/globals.css`**
  - Arquivo: `apps/web/src/styles/globals.css`
  - Declarar todas as CSS variables de `docs/design/tokens.md` em `:root` (light) e `html.dark` (dark):
    - Seção 1: paleta base (background, foreground, card, card-foreground, border, input, ring)
    - Seção 1: muted, primary, primary-subtle
    - Seção 1: sidebar (sidebar, sidebar-foreground, sidebar-muted, sidebar-active, sidebar-active-bg)
    - Seção 1: success, warning, danger e suas variantes `-subtle`
    - Seção 1: popover, popover-foreground
    - Seção 4: tokens de densidade (--pad-card, --pad-card-y, --gap-grid, --gap-row, etc.)
    - Seção 5: radii (--radius, --radius-sm, --radius-full)
    - Seção 6: sombras (--shadow-sm, --shadow, --shadow-md)
  - Incluir reset base: `* { box-sizing: border-box; margin: 0; padding: 0; }`
  - Incluir `body { font-family: var(--font-sans); font-feature-settings: 'cv11', 'ss01'; -webkit-font-smoothing: antialiased; }`
  - Incluir scrollbar customizada (seção 8 de tokens.md)
  - Critério de pronto: inspetor do browser mostra as variáveis em `:root` e `html.dark` corretamente.

- [ ] **2.2 — Verificar importação das fontes Geist**
  - Se usando pacote `geist`: importar em `globals.css` via `@import 'geist/dist/geist.css'`
  - Definir CSS variables: `--font-sans: 'Geist', system-ui, ...` e `--font-mono: 'Geist Mono', ...`
  - Critério de pronto: texto da página usa Geist no DevTools > Computed > font-family.

- [ ] **2.3 — Implementar toggle de tema (dark/light)**
  - Arquivo: `apps/web/src/lib/theme.ts`
  - Função `setTheme(theme: 'light' | 'dark' | 'system')`: adiciona/remove classe `dark` em `html`
  - Ler preferência do `localStorage` ou `prefers-color-scheme` no boot (sem flash)
  - Critério de pronto: ao adicionar classe `dark` ao `<html>`, fundo muda para `hsl(222 47% 5%)`.

---

## Fase 3 — Biblioteca de Utilitários

> Resultado esperado: `cn()`, formatters e fetch wrapper funcionando e testáveis isoladamente.

- [ ] **3.1 — Criar `src/lib/cn.ts`**
  - Arquivo: `apps/web/src/lib/cn.ts`
  - Exportar `cn(...inputs)` usando `clsx` + `twMerge`
  - Critério de pronto: `cn('p-4', condition && 'bg-primary', 'p-2')` retorna `'bg-primary p-2'`.

- [ ] **3.2 — Criar `src/lib/formatters.ts`**
  - Arquivo: `apps/web/src/lib/formatters.ts`
  - Implementar e exportar:
    - `fmtBRL(value: number): string` → `"R$ 284.320,00"` (Intl.NumberFormat pt-BR currency)
    - `fmtBRLk(value: number): string` → `"R$ 284k"` / `"R$ 1,2M"` (abreviado para eixos de gráfico)
    - `fmtLitros(value: number): string` → `"28.400 L"` (sem casas decimais se inteiro)
    - `fmtPct(value: number, decimals?: number): string` → `"8,7%"`
    - `fmtNum(value: number): string` → `"1.234"` (separador de milhar, sem casas)
    - `fmtK(value: number): string` → `"12k"` (usado no Heatmap)
    - `fmtDelta(value: number): string` → `"+8,7%"` / `"-3,2%"` (com sinal)
  - Critério de pronto: `fmtBRL(284320)` === `"R$ 284.320,00"`.

- [ ] **3.3 — Criar `src/lib/api.ts`**
  - Arquivo: `apps/web/src/lib/api.ts`
  - Implementar `apiFetch<T>(path: string, options?: RequestInit): Promise<T>`
  - Configurar: `credentials: 'include'` (envia cookie automaticamente), `Content-Type: application/json`
  - Tratar erros: se status 401 → dispatch evento `'auth:unauthorized'` (escutado pelo AuthContext para redirecionar ao login)
  - Tratar erros: se não-2xx → throw com `{ status, message }` do body JSON
  - Critério de pronto: `apiFetch('/auth/me')` funciona sem erro de CORS com o backend rodando.

- [ ] **3.4 — Criar `src/lib/chart-theme.ts`**
  - Arquivo: `apps/web/src/lib/chart-theme.ts`
  - Exportar conforme ADR-011 e `docs/design/tokens.md` seção 2:
    ```ts
    export const CHART_COLORS = { combustivel, conveniencia, lubrificantes, servicos, arla, positive, negative }
    export const CHART_GRID = { stroke: 'hsl(var(--border))', strokeDasharray: '0' }
    export const CHART_TICK = { fill: 'hsl(var(--muted-foreground))', fontSize: 11, fontFamily: 'Geist, system-ui' }
    export const CHART_TOOLTIP_STYLE = { contentStyle: { background, border, borderRadius, fontSize } }
    ```
  - Critério de pronto: importado em qualquer chart sem erro de TypeScript.

---

## Fase 4 — Componentes de Layout

> Referência: `docs/design/components.md` seções 1–4.
> Resultado esperado: AppShell renderiza com sidebar + topbar; navegação entre rotas funciona.

- [ ] **4.1 — Criar `src/components/layout/AppShell.tsx`**
  - Anatomia exata da seção 1 de `docs/design/components.md`
  - `flex h-screen overflow-hidden bg-background` no root
  - Recebe `children` e compõe `<Sidebar /> + <main>` com `<Topbar />` e conteúdo
  - Critério de pronto: sem scroll na `<html>` — apenas o conteúdo interno scrolla.

- [ ] **4.2 — Criar `src/components/layout/Sidebar.tsx`**
  - Anatomia exata da seção 2 de `docs/design/components.md`
  - Logo/brand no topo com `LogoMark` (SVG inline 28×28, gradient azul→roxo)
  - `<nav>` com 3 seções: Análise, Financeiro, Sistema (itens conforme tabela de rotas da seção 2)
    - Análise: Visão Geral (`/dashboard`), Combustível (`/combustivel`), Arla 32 (`/arla`), Lubrificantes (`/lubrificantes`), Conveniência (`/conveniencia`)
    - Financeiro: DRE Mensal (`/dre`)
    - Sistema: Sincronização (`/sync`), Configurações (`/settings`)
  - `SidebarItem` com estados inativo/hover/ativo conforme spec (barra esquerda `w-[2.5px]`, ícone `sidebar-active`)
  - Section labels: `text-[10px] font-semibold uppercase tracking-[1.4px] text-sidebar-foreground/40`
  - Ícones Lucide, `size-[14px]`, `strokeWidth={1.6}`
  - `TenantBadge` no footer com avatar 28×28 gradiente + nome da rede + role
  - Usar `useLocation` do React Router para detectar rota ativa
  - Critério de pronto: ao navegar entre rotas, o item correto fica ativo com barra azul.

- [ ] **4.3 — Criar `src/components/layout/Topbar.tsx`**
  - Anatomia exata da seção 3 de `docs/design/components.md`
  - `h-[52px]`, `bg-card`, `border-b border-border`
  - Breadcrumb dinâmico derivado da rota atual (ex: "PostoInsight › Combustível")
  - `ThemeToggle`: ícone Sun/Moon que chama `setTheme()` do `lib/theme.ts`
  - `UserMenu`: Shadcn `DropdownMenu` com avatar do usuário + nome + role + separador + "Sair"
  - "Sair" chama `POST /auth/logout` e redireciona para `/login`
  - Critério de pronto: UserMenu abre/fecha; "Sair" redireciona.

- [ ] **4.4 — Criar `src/components/layout/PageHeader.tsx`**
  - Anatomia exata da seção 4 de `docs/design/components.md`
  - Props: `title: string`, `subtitle?: string`, `children?: ReactNode` (para ações/filtros)
  - `px-5 pt-5 pb-4 flex items-end justify-between gap-4 flex-wrap`
  - `h1` com `text-xl font-semibold text-foreground tracking-tight`
  - Subtítulo opcional com `text-sm text-muted-foreground mt-1`
  - Critério de pronto: título e ações renderizados lado a lado sem quebra em 1280px.

---

## Fase 5 — Componentes de UI

> Referência: `docs/design/components.md` seções 5–14 e 21.
> Nunca reescrever primitivos Shadcn do zero — usar `pnpm dlx shadcn@latest add <component>`.

- [ ] **5.1 — Instalar primitivos Shadcn**
  - Rodar: `pnpm dlx shadcn@latest init` (configura paths, aliases, globals.css)
  - Adicionar componentes:
    ```bash
    pnpm dlx shadcn@latest add button select dialog tabs accordion tooltip avatar
    pnpm dlx shadcn@latest add dropdown-menu separator switch popover skeleton badge
    pnpm dlx shadcn@latest add input label alert sheet sonner
    ```
  - Componentes são copiados para `src/components/ui/` — verificar que estão usando as CSS variables do projeto
  - Critério de pronto: `<Button size="sm">` renderiza com `h-8` (32px).

- [ ] **5.2 — Criar `src/components/ui/KpiCard.tsx`**
  - Referência: seção 5 de `docs/design/components.md`
  - Props: `label: string`, `icon?: LucideIcon`, `value: string`, `delta?: number`, `deltaLabel?: string`, `delta2?: number`, `delta2Label?: string`, `sparklineData?: number[]`, `sparklineColor?: string`
  - Fundo `bg-card border border-border rounded shadow-sm`, `min-h-[108px]`, `p-[14px]`
  - `<Sparkline>` de fundo com `opacity-25 pointer-events-none aria-hidden` (usa componente da Fase 6)
  - Valor: `text-[22px] font-semibold tabular-nums tracking-tight`
  - `<DeltaTag>` para delta e delta2 (usa componente 5.4)
  - Variante de loading: `<div class="h-[108px] rounded bg-muted animate-pulse" />`
  - Critério de pronto: KPI com sparkline, valor, 1 delta visível sem overflow.

- [ ] **5.3 — Criar `src/components/ui/SectionCard.tsx`**
  - Referência: seção 7 de `docs/design/components.md`
  - Props: `title?: string`, `description?: string`, `actions?: ReactNode`, `children: ReactNode`, `noPadding?: boolean`
  - Header: `px-[16px] pt-[14px] pb-2` com título `text-[13px] font-semibold tracking-[-0.1px]` + descrição + `actions`
  - Body: `px-[16px] pb-[14px]` (ou sem padding se `noPadding`)
  - Nunca aninhar SectionCards
  - Critério de pronto: `<SectionCard title="X" actions={<Button>Y</Button>}><p>Z</p></SectionCard>` renderiza corretamente.

- [ ] **5.4 — Criar `src/components/ui/DeltaTag.tsx`**
  - Referência: seção 10 de `docs/design/components.md`
  - Props: `value: number`, `label?: string`, `invertColors?: boolean`, `compact?: boolean`
  - Threshold neutro: `|value| < 0.15`
  - Positivo: `text-success` + `ArrowUp`; Negativo: `text-danger` + `ArrowDown`; Neutro: `text-muted-foreground` + `ArrowRight`
  - `invertColors`: inverte semântica (aumento de CMV é ruim)
  - Com label: flex row com DeltaTag + `<span class="text-[11px] text-muted-foreground lowercase">`
  - Critério de pronto: `value={8.7}` → verde com ↑; `value={-3.2}` → vermelho com ↓; `value={0.1}` → cinza com →.

- [ ] **5.5 — Criar `src/components/ui/StatusBadge.tsx`**
  - Referência: seção 9 de `docs/design/components.md`
  - Props: `variant: 'success' | 'warning' | 'danger' | 'neutral' | 'primary'`, `children: ReactNode`, `pulse?: boolean`
  - Dot pulsante com `animate-ping` quando `pulse={true}` (sync ativo)
  - Critério de pronto: badge success renderiza com fundo `bg-success-subtle`, texto `text-success`.

- [ ] **5.6 — Criar `src/components/ui/DataTable.tsx`**
  - Referência: seção 6 de `docs/design/components.md`
  - Props: `columns: Column[]`, `rows: Row[]`, `onRowClick?: (row) => void`, `loading?: boolean`, `emptyText?: string`, `footer?: ReactNode`
  - Colunas numéricas: `text-right tabular-nums` (declarado na definição da coluna)
  - Células especiais suportadas: rank (`#1`), color dot (`w-2 h-2 rounded-[2px]`), progress bar inline, sparkline inline
  - Loading: `SkeletonLoader` (5 linhas de skeleton) — nunca spinner
  - `hover:bg-muted/60 cursor-pointer` somente se `onRowClick` definido
  - `tfoot` com totais: `border-t border-border bg-muted/40`
  - Critério de pronto: tabela com 3 colunas, 1 numérica alinhada à direita, hover e click funcionando.

- [ ] **5.7 — Criar `src/components/ui/EmptyState.tsx`**
  - Referência: seção 12 de `docs/design/components.md`
  - Props: `icon?: LucideIcon`, `title: string`, `description?: string`
  - Border dashed, fundo `bg-muted/30`, ícone em círculo `bg-muted`
  - Critério de pronto: renderiza dentro de um SectionCard sem overflow.

- [ ] **5.8 — Criar `src/components/ui/SkeletonLoader.tsx`**
  - Referência: seção 13 de `docs/design/components.md`
  - Exportar variantes nomeadas: `KpiSkeleton`, `ChartSkeleton`, `TableSkeleton`, `TableRowSkeleton`
  - `KpiSkeleton`: `h-[108px] rounded bg-muted animate-pulse`
  - `ChartSkeleton`: `h-[260px] rounded bg-muted animate-pulse`
  - `TableSkeleton`: 5 rows de `TableRowSkeleton` com células em dimensões realistas
  - Critério de pronto: `<ChartSkeleton />` tem exatamente 260px de altura.

- [ ] **5.9 — Criar `src/components/ui/Drawer.tsx`**
  - Referência: seção 14 de `docs/design/components.md`
  - Props: `open: boolean`, `onClose: () => void`, `title: string`, `icon?: ReactNode`, `children: ReactNode`
  - Overlay: `fixed inset-0 z-40 bg-foreground/40` com `transition-opacity duration-[180ms]`
  - Painel: `fixed right-0 top-0 bottom-0 z-41 w-[420px] max-w-[92vw]` com `transition-transform duration-[220ms] ease-[cubic-bezier(0.16,1,0.3,1)]`
  - `useEffect` para fechar no `Escape`
  - Exportar `DrawerRow` para pares label/valor
  - Critério de pronto: abre/fecha com animação; ESC fecha; click no overlay fecha.

- [ ] **5.10 — Criar `src/components/ui/PeriodSelector.tsx`**
  - Referência: seção 4 (PageActions) de `docs/design/components.md` e seção 3.2 de `FRONTEND_SPEC.md`
  - Props: `value: Period`, `onChange: (v: Period) => void`
  - Tipo `Period`: `'today' | 'yesterday' | '7d' | 'this_week' | 'this_month' | 'custom'`
  - Segmented control: `inline-flex p-[3px] bg-muted rounded-[7px] gap-0.5`
  - Opção `custom`: abre Shadcn `Popover` com dois `Calendar` (date range), botão "Aplicar"
  - Limite máximo de range: 90 dias (warning inline se exceder)
  - Critério de pronto: mudar período dispara `onChange`; custom abre popover com calendários.

- [ ] **5.11 — Criar `src/components/ui/FilterBar.tsx`**
  - Referência: seção 8 de `docs/design/components.md`
  - Props: `children: ReactNode` (filtros) + `actions?: ReactNode` (botões à direita)
  - `flex items-center gap-2.5 flex-wrap px-5 pb-4`
  - Spacer `flex-1` entre filtros e ações
  - Critério de pronto: filtros à esquerda e botão "Exportar" à direita.

---

## Fase 6 — Componentes de Gráfico

> Referência: `docs/design/components.md` seções 15–20 e ADR-011.
> Todo gráfico importa constantes de `src/lib/chart-theme.ts`.
> Todo gráfico envolto em `<ResponsiveContainer width="100%" height={N}>` — nunca tamanho fixo.
> Critério geral: nenhuma importação direta de Recharts fora de `src/components/charts/`.

- [ ] **6.1 — Criar `src/components/charts/LineAreaChart.tsx`**
  - Referência: seção 15 de `docs/design/components.md`
  - Recharts: `AreaChart` com `linearGradient` defs
  - Props: `data: {label: string, [key: string]: number | string}[]`, `series: {key: string, color: string, name: string}[]`, `yFormatter?: (v: number) => string`, `height?: number`
  - Regras: `dot={false}`, `type="monotone"`, `CartesianGrid vertical={false}`, eixos sem linha/tick, `CustomTooltip` sempre
  - `CustomTooltip`: `bg-card border border-border rounded-[8px] text-[12px]`, valores formatados
  - Critério de pronto: dado com 30 pontos renderiza sem overflow; tooltip aparece no hover.

- [ ] **6.2 — Criar `src/components/charts/MultiLineChart.tsx`**
  - Recharts: `LineChart` com múltiplas `<Line>` series
  - Props idênticas ao `LineAreaChart`, sem área/gradiente
  - Suporte a `strokeDasharray` por série (ex: linha tracejada para margem %)
  - Critério de pronto: 4 séries com cores distintas renderizam com legenda.

- [ ] **6.3 — Criar `src/components/charts/ComposedChart.tsx`**
  - Referência: seção 16 de `docs/design/components.md`
  - Recharts: `ComposedChart` com `Bar` (eixo esquerdo) + `Line` (eixo direito)
  - Props: `data`, `barKey + barColor`, `lineKey + lineColor`, `barFormatter`, `lineFormatter`
  - Dual Y-axis: esquerdo em R$, direito em %
  - Barra com `radius={[3,3,0,0]}`, `maxBarSize={40}`; linha `strokeDasharray="6 4"`, `dot={false}`
  - Critério de pronto: barras e linha sobrepostas sem conflito de escala.

- [ ] **6.4 — Criar `src/components/charts/DonutChart.tsx`**
  - Referência: seção 17 de `docs/design/components.md`
  - Recharts: `PieChart` + `Pie` com `innerRadius="65%" outerRadius="90%"`, `paddingAngle={2}`, `strokeWidth={0}`
  - Props: `data: {name: string, value: number, color: string}[]`, `centerLabel?: string`, `centerValue?: string`
  - Centro customizável via posicionamento absoluto (não é feature nativa do Recharts — div sobreposta)
  - Legenda em grid `grid-cols-2` abaixo do gráfico com dot quadrado `w-2 h-2 rounded-[2px]`
  - Critério de pronto: 4 segmentos coloridos com legenda; centro mostra total.

- [ ] **6.5 — Criar `src/components/charts/BarChart.tsx`**
  - Referência: seção 18 de `docs/design/components.md`
  - Recharts: `BarChart` com suporte a `layout="vertical"` (horizontal) e `layout="horizontal"` (vertical)
  - Props: `data`, `dataKey`, `color`, `layout?: 'vertical' | 'horizontal'`, `formatter?`
  - Barras horizontais (ranking): `radius={[0,3,3,0]}`, `maxBarSize={24}`, `YAxis width={120}`
  - Critério de pronto: 6 barras horizontais de ranking renderizam sem cortar labels.

- [ ] **6.6 — Criar `src/components/charts/Sparkline.tsx`**
  - Referência: seção 19 de `docs/design/components.md`
  - **SVG inline puro — sem Recharts**
  - Props: `data: number[]`, `color: string`, `width?: number`, `height?: number`, `opacity?: number`, `showArea?: boolean`
  - Implementar `buildSmoothPath(xs, ys)` com curvas cúbicas de Bezier (suavidade)
  - Dois casos de uso: `opacity={0.25}` (fundo do KpiCard) e `opacity={1}` (inline em tabela sem área)
  - `aria-hidden="true"`, `vectorEffect="non-scaling-stroke"`
  - Critério de pronto: sparkline com 30 pontos renderiza em 72×22px sem distorção.

- [ ] **6.7 — Criar `src/components/charts/Heatmap.tsx`**
  - Referência: seção 20 de `docs/design/components.md`
  - **CSS Grid + lógica de cor JS — sem Recharts**
  - Props: `data: number[][]`, `rowLabels: string[]`, `colLabels: string[]`
  - Cor calculada por `intensity = value / max`: `hsl(204 100% ${97 - intensity * 60}%)` (azul claro → azul escuro)
  - Texto branco quando `intensity > 0.5`, foreground quando abaixo
  - Células: `h-9 rounded-[5px] hover:scale-105 transition-transform`
  - Critério de pronto: grid 7×24 renderiza sem overflow; células mais quentes mais escuras.

---

## Fase 7 — Autenticação

> Referência: ADR-012 + `docs/design/FRONTEND_SPEC.md` seção 1, screen-map seção 6.
> Resultado esperado: login funciona; rotas protegidas redirecionam para `/login`; sessão persiste no reload.

- [ ] **7.1 — Criar `src/hooks/useAuth.ts` e `AuthContext`**
  - Arquivo: `apps/web/src/hooks/useAuth.ts` + `src/contexts/AuthContext.tsx`
  - Context state: `user: User | null`, `isLoading: boolean`
  - Tipo `User`: `{ id: string, name: string | null, email: string, role: 'owner' | 'manager' | 'viewer', tenantId: string, locationId?: string }`
  - Funções: `login(email, password): Promise<void>` (chama `POST /auth/login`, salva user no state) e `logout(): Promise<void>` (chama `POST /auth/logout`, limpa state, redireciona)
  - Boot: no mount do provider, chama `GET /auth/me` para restaurar sessão (antes de renderizar qualquer rota)
  - Escutar evento `auth:unauthorized` do `api.ts` para logout automático
  - Critério de pronto: reload da página mantém sessão sem piscar login.

- [ ] **7.2 — Criar componente `PrivateRoute`**
  - Arquivo: `apps/web/src/components/layout/PrivateRoute.tsx`
  - Se `isLoading`: renderiza `<FullPageSkeleton />` (tela inteira com shimmer)
  - Se `!user`: redireciona para `/login?redirect=<current_path>`
  - Se `user`: renderiza `children` dentro do `<AppShell>`
  - Critério de pronto: acessar `/dashboard` sem sessão redireciona para `/login`.

- [ ] **7.3 — Criar página `src/pages/Login/index.tsx`**
  - Referência: seção 3.1 de `docs/product/screen-map.md`
  - Layout centralizado: logo PI 40×40 + "PostoInsight" + subtítulo "BI para redes de postos"
  - Formulário: Shadcn `Input` para e-mail + senha + `Button` "Entrar" (loading state com spinner durante request)
  - Erro de credenciais: inline abaixo do botão, `text-danger text-sm`
  - Após login: redirecionar para `?redirect` ou `/dashboard`
  - Fundo: `bg-background`, card centralizado `max-w-sm w-full bg-card border border-border rounded shadow-md p-8`
  - Critério de pronto: login com credenciais corretas redireciona para dashboard; erro exibe mensagem.

- [ ] **7.4 — Criar hooks `usePeriod.ts` e `useLocation.ts`**
  - Arquivo: `apps/web/src/hooks/usePeriod.ts`
  - Gerencia o filtro de período global com `FilterContext` (estado local por página, sem persistência entre sessões)
  - Exporta `period: Period`, `setPeriod`, `dateRange: { from: Date, to: Date }` (derivado do `period`)
  - Arquivo: `apps/web/src/hooks/useLocation.ts`
  - Gerencia o filtro de location; retorna `locationId: string | 'all'`, `setLocationId`
  - Lê lista de locations do user (do AuthContext) para saber se exibe o filtro
  - Critério de pronto: mudar período em uma página não afeta outra.

---

## Fase 8 — Configuração do Roteador

> Resultado esperado: todas as rotas configuradas; redirects funcionando; 404 tratado.

- [ ] **8.1 — Criar `src/router.tsx` com React Router v6**
  - Todas as rotas do screen-map (seção 6 de `docs/product/screen-map.md`):
    - `/` → redirect para `/dashboard`
    - `/login` → `<LoginPage>` (pública)
    - `/dashboard`, `/combustivel`, `/arla`, `/lubrificantes`, `/conveniencia`, `/dre`, `/sync` → dentro de `<PrivateRoute>`
    - `/settings` → redirect para `/settings/profile`
    - `/settings/profile`, `/settings/locations`, `/settings/users`, `/settings/integrations` → dentro de `<PrivateRoute>`
  - Tratar 404: `*` → `<NotFoundPage>` simples
  - Critério de pronto: todas as rotas navegam sem erro; `/` redireciona para `/dashboard`.

- [ ] **8.2 — Criar `src/App.tsx` com providers**
  - Envolver em ordem: `QueryClientProvider` → `AuthProvider` → `RouterProvider` → `Toaster` (Sonner)
  - `QueryClient` configurado: `staleTime: 5 * 60 * 1000` (5min), `retry: 1`
  - Critério de pronto: app monta sem erro de contexto.

---

## Fase 9 — Página: Dashboard de Vendas (`/dashboard`)

> Referência: `docs/design/FRONTEND_SPEC.md` seção 5 + `docs/design/patterns.md` seção 2.
> Endpoints: `GET /api/v1/vendas/resumo`, `/evolucao`, `/segmentos`, `/top-produtos`.

- [ ] **9.1 — Criar hooks de dados da página Dashboard**
  - Arquivo: `apps/web/src/pages/Dashboard/hooks.ts`
  - `useVendasResumo(filters)`: TanStack Query wrapping `GET /api/v1/vendas/resumo`
  - `useVendasEvolucao(filters)`: wrapping `GET /api/v1/vendas/evolucao`
  - `useVendasSegmentos(filters)`: wrapping `GET /api/v1/vendas/segmentos`
  - `useVendasTopProdutos(filters, segmento?)`: wrapping `GET /api/v1/vendas/top-produtos`
  - Cada hook: `queryKey` inclui todos os filtros; `staleTime: 5min`
  - Critério de pronto: hooks retornam dados tipados com os shapes da FRONTEND_SPEC.

- [ ] **9.2 — Criar `src/pages/Dashboard/index.tsx` — estrutura e KPI Row**
  - Padrão: seção 2 de `docs/design/patterns.md`
  - Skeleton completo (`DashboardSkeleton`) quando `isLoading`: 5 KpiSkeletons + ChartSkeleton + TableSkeleton
  - KPI Row: grid `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[14px]`
  - 5 KpiCards conforme seção 5.2 de FRONTEND_SPEC: Receita Bruta, Margem Bruta %, Volume Combustível, Ticket Médio, CMV %
  - Sparkline de cada KPI: 30 pontos da série `dia` do endpoint de evolução, cor `--primary`
  - Critério de pronto: 5 cards com valores, deltas e sparklines visíveis.

- [ ] **9.3 — Dashboard: Gráfico Principal (Dual-axis) + Donut**
  - Layout: `grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4`
  - Gráfico principal: `<ComposedChart>` — barras de receita bruta (eixo esquerdo, `CHART_COLORS.combustivel`) + linha de margem % (eixo direito, `CHART_COLORS.conveniencia`, `strokeDasharray="6 4"`)
  - Altura: `h-[260px]`; X-axis: labels de data do período
  - Donut: `<DonutChart>` com 4 segmentos de `/api/v1/vendas/segmentos`, cores por segmento
  - Donut interativo: clicar na fatia aplica filtro de segmento local → afeta Top Produtos (seção 9.4)
  - Altura donut: `h-[180px]` + legenda abaixo
  - Critério de pronto: gráfico dual-axis renderiza; clicar no donut altera o título do top produtos.

- [ ] **9.4 — Dashboard: Ranking Top 10 Produtos**
  - `<SectionCard title="Top produtos" description={segmentoAtivo ? `Mostrando: ${segmentoAtivo}` : undefined}>`
  - `<DataTable>` com colunas: `#`, Produto, Receita, Participação % (barra inline), Margem %
  - Barra inline de participação: `<div class="h-[5px] bg-muted rounded-full"><div style={{width: pct%}} bg-primary /></div>` + texto
  - Filtrado pelo segmento selecionado no donut (state local `selectedSegment`)
  - Loading: 10 `TableRowSkeleton`
  - Empty state: "Nenhum produto no período selecionado" com ícone `Package`
  - Critério de pronto: tabela com dados reais; filtro por segmento funciona.

---

## Fase 10 — Página: Combustível (`/combustivel`)

> Referência: `docs/design/FRONTEND_SPEC.md` seção 6 + `docs/design/patterns.md` seção 3.
> Endpoints: `GET /api/v1/combustivel/resumo`, `/evolucao`, `/produtos`, `/subgrupos`.

- [ ] **10.1 — Criar hooks de dados da página Combustível**
  - Arquivo: `apps/web/src/pages/Combustivel/hooks.ts`
  - `useCombustivelResumo(filters)`, `useCombustivelEvolucao(filters, porProduto?)`, `useCombustivelProdutos(filters)`
  - `porProduto=true` retorna séries individuais por produto (Gasolinas, Dieseis, Arla)
  - Critério de pronto: hooks tipados sem any.

- [ ] **10.2 — Criar `src/pages/Combustivel/index.tsx` — KPI Row**
  - Padrão: seção 3 de `docs/design/patterns.md`
  - 4 KpiCards conforme seção 6.2 de FRONTEND_SPEC: Volume Total (L), Receita Bruta, Margem Bruta %, Preço Médio/L
  - Skeleton: `grid-cols-2 lg:grid-cols-4`
  - Critério de pronto: 4 cards com valores e `fmtLitros` para volume.

- [ ] **10.3 — Combustível: Gráfico de Evolução por Produto**
  - `<SectionCard>` com toggle `Linha / Área` (Shadcn `Tabs`) e toggle `Volume / Receita`
  - `<MultiLineChart>` com uma série por produto (Gasolina Comum, Gasolina Aditivada, Diesel S10, Diesel S500, Etanol)
  - Ativa `porProduto=true` no endpoint de evolução
  - Altura: `h-[260px]`
  - Critério de pronto: 5 séries com cores distintas; toggle Volume/Receita troca o eixo Y.

- [ ] **10.4 — Combustível: Tabela de Breakdown por Produto**
  - Colunas conforme seção 6.5 de FRONTEND_SPEC: Produto, Volume (L), Part. %, Receita, CMV, Margem %, Preço/L, Custo/L, Tendência
  - Coluna Tendência: `<Sparkline width={72} height={22}>` de 14 dias + `<DeltaTag compact>`
  - Colunas numéricas `text-right tabular-nums`
  - Linha clicável abre `<Drawer>` com detalhe do produto (nome, todos os valores)
  - Critério de pronto: tabela com 5 produtos; coluna Tendência visível; drawer abre ao clicar.

---

## Fase 11 — Página: Arla 32 (`/arla`)

> Referência: `docs/product/screen-map.md` seção 3.4.
> Endpoints: `GET /api/v1/arla/resumo`, `/evolucao`, `/produtos`.

- [ ] **11.1 — Criar `src/pages/Arla/index.tsx`**
  - Estrutura idêntica ao padrão de análise por categoria (seção 3 de `docs/design/patterns.md`)
  - 4 KpiCards: Volume Total (L), Receita Bruta, CMV, Margem Bruta %
  - `<LineAreaChart>` com evolução de volume e receita no período, cor `CHART_COLORS.arla`
  - `<DataTable>` com breakdown por produto Arla (caso haja múltiplos SKUs)
  - Critério de pronto: página carrega dados do endpoint `/api/v1/arla/*` sem erro.

---

## Fase 12 — Página: Lubrificantes (`/lubrificantes`)

> Referência: `docs/product/screen-map.md` seção 3.5.
> Endpoints: `GET /api/v1/lubrificantes/resumo`, `/evolucao`, `/grupos`.

- [ ] **12.1 — Criar `src/pages/Lubrificantes/index.tsx`**
  - 5 KpiCards: Receita Bruta, CMV, Margem Bruta, Margem %, Qtd Itens
  - `<ComposedChart>` com evolução de receita (barras) + margem % (linha), cor `CHART_COLORS.lubrificantes`
  - `<DataTable>` com breakdown por grupo (Lubrificantes, Filtros, Fluidos e Aditivos, Acessórios)
  - Coluna com barra de participação proporcional
  - Critério de pronto: página carrega dados sem erro; 4 grupos na tabela.

---

## Fase 13 — Página: Conveniência (`/conveniencia`)

> Referência: `docs/design/FRONTEND_SPEC.md` seção 7 + `docs/design/patterns.md` seção 3.
> Endpoints: `GET /api/v1/conveniencia/resumo`, `/evolucao`, `/grupos`, `/top-grupos`, `/categorias`.

- [ ] **13.1 — Criar hooks de dados da página Conveniência**
  - Arquivo: `apps/web/src/pages/Conveniencia/hooks.ts`
  - `useConvenienciaResumo(filters)`, `useConvenienciaEvolucao(filters)`, `useConvenienciaTopGrupos(filters)`, `useConvenienciaCategorias(filters)`
  - Critério de pronto: hooks tipados.

- [ ] **13.2 — Criar `src/pages/Conveniencia/index.tsx` — KPI Row + Evolução**
  - 3 KpiCards: Receita Bruta, Margem Bruta %, Ticket Médio (usando `nf_count` do endpoint)
  - Layout 2 colunas: `<LineAreaChart>` (evolução, 3/5) + `<DonutChart>` (mix por segmento da loja, 2/5)
  - `<LineAreaChart>`: receita bruta em área + margem em linha, cores `CHART_COLORS.conveniencia` e `CHART_COLORS.lubrificantes`
  - Critério de pronto: KPIs e gráfico de evolução com dados reais.

- [ ] **13.3 — Conveniência: Top 10 Grupos (Accordion expansível)**
  - Referência: seção 7.5 de FRONTEND_SPEC
  - Shadcn `Accordion`, `type="multiple"`
  - Item de grupo: chevron + nome + receita + margem % + badge de participação %
  - Item de categoria (dentro do accordion): `pl-6`, nome + receita + margem % + qtd
  - Endpoint `top-grupos` retorna `categorias[]` aninhadas por grupo (já implementado no backend)
  - Critério de pronto: accordion expande/recolhe; múltiplos grupos abertos simultaneamente.

- [ ] **13.4 — Conveniência: Tabela de Breakdown por Categoria**
  - Referência: seção 7.6 de FRONTEND_SPEC
  - Colunas: Categoria, Receita, Qtd, Margem %, CMV, Part. %
  - Título dinâmico: "Todas as categorias" / "Produtos de: [categoria]" quando filtro ativo
  - Botão "Limpar filtro ×" quando filtrado (reseta `selectedCategory` state)
  - Sem cross-filter via scatter (scatter é pós-MVP) — filtro via click direto na tabela de grupos
  - Critério de pronto: tabela com dados reais; filtro por categoria funciona.

---

## Fase 14 — Página: DRE Mensal (`/dre`)

> Referência: `docs/design/FRONTEND_SPEC.md` seção 8 + `docs/design/patterns.md` seção 4.
> Endpoints: `GET /api/v1/dre/mensal`, `/meses-disponiveis`.

- [ ] **14.1 — Criar hooks e componente de seleção de mês**
  - Arquivo: `apps/web/src/pages/Dre/hooks.ts`
  - `useMesesDisponiveis()`: fetch `/api/v1/dre/meses-disponiveis`, retorna `string[]` (ex: `["2026-04", "2026-03"]`)
  - `useDreMensal(mes, locationId)`: fetch `/api/v1/dre/mensal?mes=YYYY-MM&location_id=X`
  - Seletor de mês: setas ← → para navegar entre meses adjacentes + label do mês atual centralizado
  - Default: primeiro mês da lista (mais recente com dados completos)
  - DRE **não herda** o filtro global de período — gestão local
  - Critério de pronto: navegar entre meses re-fetcha os dados.

- [ ] **14.2 — Criar `src/pages/Dre/index.tsx` — KPI Row + Tabela DRE**
  - Padrão: seção 4 de `docs/design/patterns.md`
  - 3 KpiCards: Receita Bruta, Margem Bruta (R$), Margem Bruta % — sem sparkline; delta vs mesmo mês do ano anterior
  - `<DreTabelaCompleta>` (sub-componente): tabela estruturada com linhas DRE:
    - Receita Bruta (`dre-row`)
    - (−) Descontos (`dre-row`, valor em `text-danger`)
    - = Receita Líquida (`dre-row-total`: `border-t-2 font-semibold bg-muted/40`)
    - (−) CMV (`dre-row`, valor em `text-danger`)
    - = Margem Bruta (`dre-row-total`)
    - Margem Bruta % (`dre-row`, derivado)
    - = Resultado Final (`dre-row-result`: `border-t-2 border-success/30 bg-success-subtle font-bold text-success`)
  - Colunas: por segmento (Combustível, Conveniência, Lubrificantes) + Total consolidado
  - Todos os valores: `tabular-nums text-right`
  - Critério de pronto: tabela com estrutura DRE completa e valores de produção.

- [ ] **14.3 — DRE: Gráfico de Evolução de Margem (6 meses)**
  - Referência: seção 8.6 de FRONTEND_SPEC (adaptada para Recharts)
  - `<MultiLineChart>` com últimos 6 meses no eixo X e Margem % no eixo Y
  - Série por segmento: Combustível, Conveniência, Lubrificantes + Total
  - Derivar os 6 meses dos dados de `meses-disponiveis` (os 6 anteriores ao selecionado)
  - Altura: `h-[260px]`
  - Critério de pronto: 4 séries de margem % visíveis para os últimos 6 meses.

---

## Fase 15 — Página: Sincronização (`/sync`)

> Referência: `docs/product/screen-map.md` seção 3.8 + `docs/design/patterns.md` seção 5.
> Endpoints: `GET /api/v1/sync/status`, `GET /api/v1/locations`, `POST /api/v1/sync/trigger`.

- [ ] **15.1 — Criar `src/pages/Sync/index.tsx`**
  - Referência: seção 5 de `docs/design/patterns.md`
  - Header: refetch automático a cada 30s (`refetchInterval: 30_000` no TanStack Query)
  - Grid 2 colunas: "Status da Rede" + "Última Sincronização"
  - Status da Rede: `<StatusBadge pulse>` quando sync ativo; status geral da rede
  - Última Sincronização: timestamp formatado + botão "Sincronizar agora" (`POST /api/v1/sync/trigger`) com toast de feedback
  - Lista de Locations: um `LocationRow` por location com nome, status do conector (`<StatusBadge>`), última sync, próxima sync agendada, botão "Sincronizar" individual
  - `LocationRow`: `flex items-center justify-between py-3 border-b border-border`
  - Histórico: `<DataTable>` com colunas: Location, Início, Fim, Duração, Registros, Status — linha de erro expansível inline com `<Alert variant="destructive">`
  - Critério de pronto: página mostra status real de cada location; botão sync dispara toast.

---

## Fase 16 — Página: Configurações (`/settings`)

> Referência: `docs/product/screen-map.md` seção 3.9.

- [ ] **16.1 — Criar shell de Settings com navegação lateral**
  - Arquivo: `apps/web/src/pages/Settings/index.tsx`
  - Layout: sub-sidebar dentro do conteúdo (não usar a sidebar principal) com links: Perfil, Unidades, Usuários, Integrações
  - `/settings` → redirect para `/settings/profile`
  - Sub-sidebar: `w-48 border-r border-border flex-shrink-0`, items com estado ativo
  - Critério de pronto: navegação entre sub-rotas de settings funciona.

- [ ] **16.2 — Criar `/settings/profile`**
  - Referência: seção 3.9.1 de `docs/product/screen-map.md`
  - Campos: Nome completo (`Input`), E-mail (somente leitura), Alterar senha (form separado)
  - Preferência de tema: `Select` com Claro / Escuro / Sistema — chama `setTheme()`
  - Botão "Salvar" com loading state e toast de confirmação
  - Acesso: todos os roles
  - Critério de pronto: trocar nome e salvar exibe toast de sucesso.

- [ ] **16.3 — Criar `/settings/locations`**
  - Referência: seção 3.9.2 de `docs/product/screen-map.md`
  - Lista read-only de locations: nome, ERP conectado, status do conector
  - Placeholder de ação futura ("Adicionar unidade — Em breve") desabilitado com `Tooltip`
  - Acesso: `owner` apenas (verificar via `user.role !== 'owner'` → redirect para `/dashboard`)
  - Critério de pronto: lista de locations reais da API; botão "Em breve" desabilitado.

- [ ] **16.4 — Criar `/settings/users`**
  - Referência: seção 3.9.3 de `docs/product/screen-map.md`
  - Lista de usuários: nome, e-mail, role (`<StatusBadge>`), locations com acesso
  - Botão "Convidar usuário" desabilitado com `Tooltip` "Em breve"
  - Acesso: `owner` apenas
  - Critério de pronto: lista de usuários do tenant visível.

- [ ] **16.5 — Criar `/settings/integrations`**
  - Referência: seção 3.9.4 de `docs/product/screen-map.md`
  - Lista de conectores por location: ERP, status, última sync, token (mascarado)
  - Read-only no MVP
  - Acesso: `owner` apenas
  - Critério de pronto: conectores da Rede JAM visíveis com status correto.

---

## Fase 17 — Estados Globais e Tratamento de Erros

> Referência: `docs/product/screen-map.md` seção 4.

- [ ] **17.1 — Implementar banner de backfill pendente**
  - Se `GET /api/v1/sync/status` retorna qualquer location com `backfill_completed_at = null`
  - Exibir `<Alert>` amarelo no topo do conteúdo (abaixo da Topbar) em todas as telas analíticas
  - Texto: "Importação histórica em andamento. Os dados podem estar incompletos."
  - Desaparece automaticamente quando todos os backfills concluídos (baseado no polling da query)
  - Critério de pronto: banner aparece em `/dashboard` quando backfill pendente; some quando completo.

- [ ] **17.2 — Implementar tratamento de sessão expirada**
  - Evento `auth:unauthorized` no `api.ts` → `useAuth` escuta e chama `logout()` + redirect para `/login?redirect=<path>`
  - Após login bem-sucedido, redirecionar de volta para a URL de retorno
  - Critério de pronto: sessão expirada redireciona para login preservando URL; após login, volta à página original.

- [ ] **17.3 — Implementar Toaster global**
  - Shadcn `Sonner` já instalado na Fase 5.1
  - Configurar no `App.tsx`: `<Toaster position="bottom-right" richColors />`
  - Criar helper `toast.success()`, `toast.error()` exportados de `src/lib/toast.ts`
  - Critério de pronto: `toast.success("Sync iniciado")` aparece no canto inferior direito.

---

## Fase 18 — Polimento e Deploy

> Resultado esperado: app pronta para deploy no Railway como site estático.

- [ ] **18.1 — Verificar responsividade em 1280px, 1024px e 640px**
  - Testar cada página nos 3 breakpoints definidos em `docs/design/patterns.md` seção 10
  - Sidebar: confirmar que recolhe em hamburguer em `sm` usando Shadcn `Sheet`
  - Criar `src/components/layout/MobileSidebarToggle.tsx` com botão hamburguer na Topbar (apenas `< sm`)
  - Tabelas: `overflow-x-auto` funcionando em mobile
  - Critério de pronto: sem overflow horizontal em 640px; todas as páginas acessíveis em mobile.

- [ ] **18.2 — Verificar dark mode em todos os componentes**
  - Alternar para dark mode e revisar cada componente implementado
  - Garantir que nenhuma cor está hardcoded — apenas classes Tailwind ou `hsl(var(--token))`
  - Verificar gráficos: `CHART_GRID.stroke` usa `hsl(var(--border))` e muda no dark
  - Critério de pronto: zero componente com cor hardcoded; dark mode visualmente correto.

- [ ] **18.3 — Verificar acessibilidade básica**
  - Todos os botões têm `aria-label` quando só ícone
  - Inputs têm `<Label htmlFor>` associado
  - Drawers têm `role="dialog"` e `aria-labelledby`
  - Navegação por teclado na Sidebar funciona (Radix UI já garante para Shadcn)
  - Critério de pronto: sem warnings evidentes de a11y no DevTools.

- [ ] **18.4 — Build de produção**
  - Rodar `pnpm build` — zero erros TypeScript, zero warnings críticos
  - Verificar `dist/` gerado com assets com hash de cache
  - Testar `pnpm preview` — app funciona servida como estática
  - Critério de pronto: `dist/` pronto para deploy; sem console.error em produção.

- [ ] **18.5 — Configurar deploy no Railway**
  - Criar `apps/web/Dockerfile` ou usar Railway Static Sites apontando para `dist/`
  - Configurar variável de ambiente `VITE_API_URL` para a URL de produção do backend
  - Atualizar `vite.config.ts` para usar `VITE_API_URL` em produção (sem proxy)
  - Verificar que cookies funcionam entre `app.postoinsight.com.br` e `api-production-3a9c.up.railway.app` (SameSite=Lax, domain configurado)
  - Critério de pronto: `pnpm build && railway up` funciona; login opera em produção.

---

## Checklist de Design — Aplicar em Todo Componente

> Verificar cada item antes de marcar uma task como concluída.

- [ ] **Cores via tokens** — nunca hardcoded. Sempre `hsl(var(--token))` ou classe Tailwind (`bg-primary`, `text-muted-foreground`, etc.)
- [ ] **Tipografia: Geist sans** para texto; **Geist Mono** (`font-mono tabular-nums`) para valores numéricos em tabelas e KPIs
- [ ] **Densidade compacta**: padding de card `p-[14px]` / `p-[16px]`, gap entre seções `gap-4` (16px), altura de botão/input `h-8` (32px)
- [ ] **Sidebar**: fundo `bg-sidebar` (dark), texto `text-sidebar-foreground` — nunca inverter
- [ ] **Dark mode**: todos os tokens têm variante dark declarada em `globals.css`. Testar com `document.documentElement.classList.add('dark')`
- [ ] **Sparklines**: sempre SVG inline (`<Sparkline>`), nunca Recharts. `aria-hidden="true"`, `pointer-events-none`
- [ ] **Gráficos Recharts**: sempre `<ResponsiveContainer width="100%" height={N}>`. Nunca tamanho fixo no componente de gráfico. Nunca importar Recharts fora de `src/components/charts/`
- [ ] **Loading states**: `<SkeletonLoader>` com as dimensões exatas do componente que vai substituir. Nunca spinner de página inteira exceto no boot de sessão
- [ ] **Tabelas numéricas**: `tabular-nums text-right` em todas as colunas de valor. Fonte mono se valor financeiro
- [ ] **Animações**: sidebar hover `120ms ease`, drawer `220ms cubic-bezier(0.16,1,0.3,1)`, toast `200ms ease`, página `150ms ease` — conforme seção 7 de `docs/design/tokens.md`
- [ ] **Componentes novos**: não implementar sem spec em `docs/design/components.md` primeiro
- [ ] **Tenant isolation**: nenhum dado cruza entre tenants. Toda query tem `locationId` ou usa implicitamente a location do token JWT

---

## Resumo de Dependências Entre Fases

```
Fase 1 (Scaffold)
  └→ Fase 2 (Globals CSS)
       └→ Fase 3 (Lib utils)
            ├→ Fase 4 (Layout)
            │    └→ Fase 5 (UI Components)
            │         └→ Fase 6 (Chart Components)
            │              └→ Fase 7 (Auth)
            │                   └→ Fase 8 (Router)
            │                        ├→ Fase 9 (Dashboard)
            │                        ├→ Fase 10 (Combustível)
            │                        ├→ Fase 11 (Arla)
            │                        ├→ Fase 12 (Lubrificantes)
            │                        ├→ Fase 13 (Conveniência)
            │                        ├→ Fase 14 (DRE)
            │                        ├→ Fase 15 (Sync)
            │                        ├→ Fase 16 (Settings)
            │                        └→ Fase 17 (Estados Globais)
            └→ Fase 18 (Polimento) ← depende de todas as páginas prontas
```

*Última atualização: 2026-05-18*

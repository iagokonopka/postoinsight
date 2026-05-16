# Design Tokens — PostoInsight

> Fonte de verdade do sistema visual do PostoInsight.
> Todo código de estilização deve derivar deste documento.
> Gerado com base em: Shadcn/ui (HSL system) + Polaris Viz (chart aesthetics) + Shopify Admin (layout patterns).

**Última atualização:** 2026-05-16
**Status:** Aprovado

---

## 1. Filosofia

- **Slate como neutro base** — cinza com temperatura levemente azulada. Casa com o azul primário e dá sofisticação ao produto.
- **Uma cor primária** — `#0073BB`. Usada com parcimônia: ações principais, links, foco.
- **Cores de dados são semânticas** — cada segmento do negócio tem sua cor. Nunca use cores de dados para UI.
- **Superfícies em camadas** — background → card → popover. Cada camada tem elevação leve.
- **Dark sidebar, light content** — sidebar escura à esquerda (Shopify Admin pattern), conteúdo principal claro.
- **Tipografia funcional** — hierarquia clara, sem decoração. Geist Sans.

---

## 2. Paleta Primitiva — Slate

Valores base que alimentam os tokens semânticos. **Nunca use diretamente no código** — use sempre os tokens semânticos abaixo.

```
slate-50:  hsl(210, 40%, 98%)   #f8fafc
slate-100: hsl(210, 40%, 96%)   #f1f5f9
slate-200: hsl(214, 32%, 91%)   #e2e8f0
slate-300: hsl(213, 27%, 84%)   #cbd5e1
slate-400: hsl(215, 20%, 65%)   #94a3b8
slate-500: hsl(215, 16%, 47%)   #64748b
slate-600: hsl(215, 19%, 35%)   #475569
slate-700: hsl(215, 25%, 27%)   #334155
slate-800: hsl(217, 33%, 17%)   #1e293b
slate-900: hsl(222, 47%, 11%)   #0f172a
slate-950: hsl(229, 84%, 5%)    #020617
```

### Azul Primário

```
primary-400: hsl(204, 100%, 47%)   #00a1e8
primary-500: hsl(204, 100%, 37%)   #0073BB   ← brand color
primary-600: hsl(204, 100%, 30%)   #005f99
primary-700: hsl(204, 100%, 23%)   #004a78
primary-50:  hsl(204, 100%, 95%)   #e6f4fc   ← subtle background
```

---

## 3. Tokens Semânticos — Light Mode

Sistema de pares `surface / surface-foreground`, no padrão Shadcn/ui.

### Superfícies

```css
--background:          210 40% 98%    /* slate-50 — fundo da aplicação */
--foreground:          222 47% 11%    /* slate-900 — texto principal */

--card:                0 0% 100%      /* branco — cards e painéis */
--card-foreground:     222 47% 11%    /* slate-900 */

--popover:             0 0% 100%      /* branco — dropdowns, tooltips */
--popover-foreground:  222 47% 11%

--sidebar:             217 33% 17%    /* slate-800 — sidebar escura */
--sidebar-foreground:  210 40% 96%    /* slate-100 */
--sidebar-muted:       215 25% 27%    /* slate-700 — itens inativos */
--sidebar-active:      204 100% 37%   /* primary — item ativo */
--sidebar-active-bg:   229 84% 5%     /* slate-950 — fundo item ativo */
```

### Ações e Marca

```css
--primary:             204 100% 37%   /* #0073BB */
--primary-foreground:  0 0% 100%      /* branco */
--primary-subtle:      204 100% 95%   /* #e6f4fc — hover, badges */
```

### Elementos de Suporte

```css
--secondary:           210 40% 96%    /* slate-100 — botão secundário */
--secondary-foreground: 215 25% 27%   /* slate-700 */

--muted:               210 40% 96%    /* slate-100 — backgrounds sutis */
--muted-foreground:    215 16% 47%    /* slate-500 — texto de apoio */

--accent:              210 40% 96%    /* slate-100 — highlight */
--accent-foreground:   222 47% 11%    /* slate-900 */
```

### Estruturais

```css
--border:              214 32% 91%    /* slate-200 — bordas padrão */
--input:               214 32% 91%    /* slate-200 — borda de inputs */
--ring:                204 100% 37%   /* primary — outline de foco */
```

### Semânticas de Status

```css
--success:             142 71% 45%    /* verde */
--success-foreground:  0 0% 100%
--success-subtle:      138 76% 97%    /* verde muito suave */

--warning:             38 92% 50%     /* âmbar */
--warning-foreground:  0 0% 100%
--warning-subtle:      48 100% 96%

--danger:              0 84% 60%      /* vermelho */
--danger-foreground:   0 0% 100%
--danger-subtle:       0 86% 97%

--info:                204 100% 37%   /* primary — reutiliza azul */
--info-foreground:     0 0% 100%
--info-subtle:         204 100% 95%
```

---

## 4. Tokens Semânticos — Dark Mode

```css
.dark {
  --background:          222 47% 11%    /* slate-900 */
  --foreground:          210 40% 98%    /* slate-50 */

  --card:                217 33% 17%    /* slate-800 */
  --card-foreground:     210 40% 98%

  --popover:             217 33% 17%
  --popover-foreground:  210 40% 98%

  --sidebar:             229 84% 5%     /* slate-950 — mais escuro no dark */
  --sidebar-foreground:  210 40% 96%
  --sidebar-muted:       217 33% 17%
  --sidebar-active:      204 100% 47%   /* primary levemente mais claro no dark */
  --sidebar-active-bg:   217 33% 17%

  --primary:             204 100% 47%   /* um tick mais claro para contrast */
  --primary-foreground:  0 0% 100%
  --primary-subtle:      217 33% 17%

  --secondary:           215 25% 27%    /* slate-700 */
  --secondary-foreground: 210 40% 96%

  --muted:               215 25% 27%
  --muted-foreground:    215 20% 65%    /* slate-400 */

  --accent:              215 25% 27%
  --accent-foreground:   210 40% 98%

  --border:              215 25% 27%    /* slate-700 */
  --input:               215 25% 27%
  --ring:                204 100% 47%
}
```

---

## 5. Cores de Dados — Segmentos

Usadas **exclusivamente em charts e badges de segmento**. Nunca em UI.

```css
/* Segmentos do negócio */
--data-combustivel:       204 100% 37%   /* #0073BB — azul primário */
--data-conveniencia:      24 87% 50%     /* #EC7211 — laranja */
--data-lubrificantes:     262 52% 51%    /* #6B40C4 — roxo */
--data-arla:              127 65% 31%    /* #1D8102 — verde */
--data-servicos:          172 66% 35%    /* teal */

/* Paleta sequencial para séries múltiplas */
--data-series-1:          204 100% 37%   /* azul */
--data-series-2:          24  87% 50%    /* laranja */
--data-series-3:          262 52% 51%    /* roxo */
--data-series-4:          127 65% 31%    /* verde */
--data-series-5:          172 66% 35%    /* teal */
--data-series-6:          340 75% 55%    /* rosa */

/* Positivo / Negativo (DRE, variações) */
--data-positive:          142 71% 45%    /* verde */
--data-negative:          0   84% 60%    /* vermelho */
--data-neutral:           215 16% 47%    /* slate-500 */
```

---

## 6. Tipografia

**Fonte:** [Geist Sans](https://vercel.com/font) — sem serifa, moderna, alta legibilidade em dashboards.
**Fallback:** `system-ui, -apple-system, sans-serif`

```css
--font-sans: 'Geist Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'Geist Mono', 'Fira Code', monospace;
```

### Escala de tamanho

```
xs:   12px / 0.75rem   — labels de chart, legendas
sm:   13px / 0.8125rem — texto auxiliar, badges
base: 14px / 0.875rem  — texto padrão da UI
md:   16px / 1rem      — labels primários
lg:   18px / 1.125rem  — subtítulos de seção
xl:   20px / 1.25rem   — títulos de página
2xl:  24px / 1.5rem    — KPI values
3xl:  30px / 1.875rem  — KPI grandes
4xl:  36px / 2.25rem   — destaque máximo
```

### Peso

```
normal:   400
medium:   500
semibold: 600
bold:     700
```

### Line height

```
tight:   1.25  — headings, KPIs
snug:    1.375 — subtítulos
normal:  1.5   — corpo de texto
relaxed: 1.625 — parágrafos longos
```

---

## 7. Spacing Scale

Baseado em múltiplos de 4px (padrão Tailwind).

```
1:  4px    — gap mínimo entre elementos
2:  8px    — padding interno de badges, chips
3:  12px   — gap entre ícone e texto
4:  16px   — padding padrão de card
5:  20px   — gap entre KpiCards
6:  24px   — padding de seção
8:  32px   — espaço entre seções
10: 40px   — padding de página
12: 48px   — espaçamento largo
16: 64px   — seções grandes
```

---

## 8. Border Radius

```css
--radius:    0.5rem    /* 8px — base */
--radius-sm: 0.3rem    /* 5px — badges, chips */
--radius-md: 0.5rem    /* 8px — cards, inputs */
--radius-lg: 0.75rem   /* 12px — modais, painéis */
--radius-xl: 1rem      /* 16px — elementos grandes */
--radius-full: 9999px  /* pills */
```

---

## 9. Shadows

Sombras sutis — Shadcn/ui style (sem exagero).

```css
--shadow-sm:  0 1px 2px 0 hsl(222 47% 11% / 0.05)
--shadow:     0 1px 3px 0 hsl(222 47% 11% / 0.1), 0 1px 2px -1px hsl(222 47% 11% / 0.1)
--shadow-md:  0 4px 6px -1px hsl(222 47% 11% / 0.1), 0 2px 4px -2px hsl(222 47% 11% / 0.1)
--shadow-lg:  0 10px 15px -3px hsl(222 47% 11% / 0.1), 0 4px 6px -4px hsl(222 47% 11% / 0.1)
```

---

## 10. Tema ECharts

Configuração JSON derivada dos tokens acima. Aplicar via `echarts.registerTheme('postoinsight', theme)`.

### Princípios visuais (Polaris Viz inspired)

- Grid lines: `slate-200` no light, `slate-700` no dark — quase invisíveis
- Eixos: sem linha de eixo visível, apenas labels em `slate-500`
- Tooltip: fundo branco, borda `slate-200`, sombra `shadow-md`, tipografia `sm`
- Legenda: texto `slate-600`, ícone circular pequeno
- Animação: `300ms` ease-out — rápida, sem chamar atenção

```json
{
  "color": [
    "#0073BB",
    "#EC7211",
    "#6B40C4",
    "#1D8102",
    "#0891b2",
    "#e11d48"
  ],
  "backgroundColor": "transparent",
  "textStyle": {
    "fontFamily": "Geist Sans, system-ui, sans-serif",
    "fontSize": 12,
    "color": "#64748b"
  },
  "title": {
    "textStyle": {
      "color": "#0f172a",
      "fontSize": 14,
      "fontWeight": "600"
    },
    "subtextStyle": {
      "color": "#64748b",
      "fontSize": 12
    }
  },
  "grid": {
    "left": 0,
    "right": 0,
    "top": 8,
    "bottom": 0,
    "containLabel": true
  },
  "categoryAxis": {
    "axisLine": { "show": false },
    "axisTick": { "show": false },
    "axisLabel": {
      "color": "#64748b",
      "fontSize": 12,
      "fontFamily": "Geist Sans, system-ui, sans-serif"
    },
    "splitLine": { "show": false }
  },
  "valueAxis": {
    "axisLine": { "show": false },
    "axisTick": { "show": false },
    "axisLabel": {
      "color": "#64748b",
      "fontSize": 12,
      "fontFamily": "Geist Sans, system-ui, sans-serif"
    },
    "splitLine": {
      "show": true,
      "lineStyle": {
        "color": "#e2e8f0",
        "type": "solid",
        "width": 1
      }
    }
  },
  "tooltip": {
    "backgroundColor": "#ffffff",
    "borderColor": "#e2e8f0",
    "borderWidth": 1,
    "textStyle": {
      "color": "#0f172a",
      "fontSize": 13,
      "fontFamily": "Geist Sans, system-ui, sans-serif"
    },
    "extraCssText": "box-shadow: 0 4px 6px -1px rgba(15,23,42,0.1); border-radius: 8px; padding: 10px 14px;"
  },
  "legend": {
    "textStyle": {
      "color": "#475569",
      "fontSize": 12,
      "fontFamily": "Geist Sans, system-ui, sans-serif"
    },
    "icon": "circle",
    "itemWidth": 8,
    "itemHeight": 8
  },
  "line": {
    "smooth": false,
    "symbol": "none",
    "lineStyle": { "width": 2 },
    "areaStyle": { "opacity": 0.08 }
  },
  "bar": {
    "barMaxWidth": 48,
    "itemStyle": { "borderRadius": [4, 4, 0, 0] }
  },
  "animation": true,
  "animationDuration": 300,
  "animationEasing": "cubicOut"
}
```

---

## 11. Layout Pattern — Shopify Analytics

```
┌─────────────────────────────────────────────────────┐
│  Topbar (opcional — logo + user menu)               │  h-14  bg-sidebar
├──────────┬──────────────────────────────────────────┤
│          │  Page Header                              │
│          │  ├─ Título da seção (xl, semibold)       │  p-6 border-b
│ Sidebar  │  └─ Filtros (período, location)          │
│          ├──────────────────────────────────────────┤
│  w-60    │  Conteúdo BI                             │
│  slate-  │  ├─ KPI row                              │  p-6 gap-5
│  800     │  ├─ Charts row                           │
│          │  └─ Tabelas                              │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Sidebar:**
- Largura: `w-60` (240px)
- Background: `slate-800` → token `--sidebar`
- Item ativo: texto `white` + fundo `slate-950` + borda esquerda `primary`
- Item inativo: texto `slate-400`, hover `slate-700`

**Page Header:**
- Background: `white` (card)
- Border bottom: `slate-200`
- Título: `text-xl font-semibold text-foreground`
- Filtros: alinhados à direita, componentes Shadcn `Select` + `Button`

**Conteúdo:**
- Background: `slate-50` (background)
- Padding: `p-6`
- Gap entre seções: `gap-6`

---

## 12. Componentes — Referências Shadcn/ui

Componentes a instalar via Shadcn CLI conforme necessidade:

| Componente | Uso no PostoInsight |
|------------|---------------------|
| `button` | Ações primárias e secundárias |
| `select` | Filtro de período, filtro de location |
| `card` | KpiCard, SectionCard, painéis |
| `badge` | Status de sync, segmentos |
| `table` | Tabelas de dados analíticos |
| `tabs` | Alternância de visualização |
| `dialog` | Modais de confirmação |
| `tooltip` | Informações adicionais em charts |
| `separator` | Divisórias de seção |
| `skeleton` | Loading states |
| `avatar` | User menu |
| `dropdown-menu` | Menu do usuário, ações de contexto |
| `alert` | Banners de erro / aviso |
| `input` | Formulários de settings |
| `label` | Labels de formulário |

---

*Este documento é a fonte de verdade. Qualquer decisão visual que não esteja aqui deve ser adicionada antes de ser implementada.*
# Design Tokens — PostoInsight

> Fonte de verdade do sistema visual do PostoInsight.
> Todo código de estilização deve derivar deste documento.
> Base: Shadcn/ui (HSL system) + Polaris Viz (chart aesthetics) + Shopify Admin (layout patterns).

**Última atualização:** 2026-05-17
**Versão:** 1.4
**Status:** Aprovado · alinhado com PostoInsight.html

---

## 1. Filosofia

- **Slate como neutro base** — cinza com leve temperatura azulada
- **Uma cor primária** — `#0073BB` (default azul; trocável via Tweak para indigo / emerald / rose)
- **Cores de dados são semânticas** — cada segmento de negócio tem cor própria. Nunca usar cores de dados na UI
- **Superfícies em camadas** — background → card → popover → drawer
- **Dark sidebar, light content** (light mode) · sidebar ainda mais escura no dark mode
- **Tipografia funcional** — hierarquia clara, sem decoração. **Geist** (Google Fonts)

---

## 2. Paleta Primitiva — Slate

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

### Acentos (Tweak-switchable)

```
azul (default):  hsl(204 100% 37%)   #0073BB
indigo:          hsl(243 75% 58%)    #4f46e5
emerald:         hsl(160 84% 32%)    #059669
rose:            hsl(350 89% 55%)    #e11d48
```

---

## 3. Tokens Semânticos — Light Mode

```css
--background:          210 40% 98%
--foreground:          222 47% 11%

--card:                0 0% 100%
--card-foreground:     222 47% 11%

--popover:             0 0% 100%
--popover-foreground:  222 47% 11%

--sidebar:             217 33% 17%       /* slate-800 */
--sidebar-foreground:  210 40% 96%
--sidebar-muted:       215 25% 27%       /* slate-700 */
--sidebar-active:      204 100% 47%      /* primary clarinho */
--sidebar-active-bg:   229 60% 8%        /* near-black com leve tom azul */

--primary:             204 100% 37%      /* #0073BB */
--primary-foreground:  0 0% 100%
--primary-subtle:      204 100% 95%

--secondary:           210 40% 96%
--secondary-foreground:215 25% 27%

--muted:               210 40% 96%
--muted-foreground:    215 16% 47%

--accent:              210 40% 96%
--accent-foreground:   222 47% 11%

--border:              214 32% 91%
--input:               214 32% 91%
--ring:                204 100% 37%

--success:             142 71% 45%
--success-subtle:      138 76% 97%
--warning:             38 92% 50%
--warning-subtle:      48 100% 96%
--danger:              0 84% 60%
--danger-subtle:       0 86% 97%
```

---

## 4. Tokens Semânticos — Dark Mode (atualizado v1.4)

```css
.dark {
  --background:          222 47% 5%        /* quase preto com tom azulado */
  --foreground:          210 40% 98%
  --card:                222 40% 8%        /* ligeiramente acima do bg */
  --card-foreground:     210 40% 98%

  --popover:             222 40% 8%
  --sidebar:             222 50% 4%        /* mais escuro que o bg */
  --sidebar-foreground:  210 40% 96%
  --sidebar-muted:       217 33% 15%
  --sidebar-active:      243 75% 65%       /* tweak-switchable */
  --sidebar-active-bg:   222 50% 9%

  --primary:             243 75% 65%       /* tweak-switchable */
  --primary-foreground:  0 0% 100%
  --primary-subtle:      243 50% 18%

  --secondary:           215 25% 18%
  --muted:               215 25% 14%
  --muted-foreground:    215 16% 60%
  --accent:              215 25% 18%
  --border:              215 25% 16%
  --input:               215 25% 16%
  --ring:                243 75% 65%
  --success-subtle:      142 30% 14%
  --warning-subtle:      38 60% 14%
  --danger-subtle:       0 50% 16%
}
```

---

## 5. Cores de Dados — Segmentos

```css
/* Segmentos do negócio */
--data-combustivel:    204 100% 37%    /* #0073BB */
--data-conveniencia:   24 87% 50%      /* #EC7211 */
--data-lubrificantes:  262 52% 51%     /* #6B40C4 */
--data-servicos:       193 89% 36%     /* #0891b2 */
--data-arla:           127 65% 31%     /* #1D8102 */

/* Paleta sequencial p/ séries múltiplas (Top 10, séries de combustível) */
--data-series-1: #0073BB    /* azul */
--data-series-2: #EC7211    /* laranja */
--data-series-3: #6B40C4    /* roxo */
--data-series-4: #1D8102    /* verde */
--data-series-5: #0891b2    /* teal */
--data-series-6: #db2777    /* rosa */

/* Categorias da Conveniência (drawer/donut) */
BEB → Bebidas       → #EC7211
TAB → Tabacaria     → #6B40C4
LAN → Lanchonete    → #1D8102
CV  → Outros        → #94a3b8
SRV → Serviços      → #0891b2
LUB → Lubrificantes → #db2777

/* Positivo / Negativo */
--data-positive:  142 71% 45%   /* verde   */
--data-negative:  0 84% 60%     /* vermelho */
--data-neutral:   215 16% 47%   /* slate   */
```

---

## 6. Tipografia — Geist

```css
--font-sans: 'Geist', system-ui, -apple-system, sans-serif
--font-mono: 'Geist Mono', 'JetBrains Mono', monospace
```

Importado via Google Fonts com pesos 400/500/600/700. Mono para datetimes, tenant IDs, watermarks, ticks de eixo.

### Escala

```
xs   12px   labels de chart, legendas, deltas
sm   13px   texto auxiliar, badges, base de tabela
base 14px   corpo da UI
md   16px   labels primários, page-title em compact
lg   18px   subtítulos
xl   20px   subtítulos de seção
2xl  22px   page-title
3xl  30px   KPI values padrão
4xl  36px   KPI destaque
```

### Pesos
400 normal · 500 medium · 600 semibold · 700 bold

### Font features
`font-variant-numeric: tabular-nums` em todos os KPIs, eixos, tabelas e quaisquer números alinhados em colunas. `font-feature-settings: 'cv11', 'ss01'` no body.

---

## 7. Spacing

Múltiplos de 4. Controlados por CSS custom properties que respondem à tweak de Densidade:

```css
/* Comfortable (default) */
--pad-card:    20px
--pad-card-y:  18px
--gap-grid:    16px
--gap-row:     20px
--kpi-pad:     18px
--kpi-val-size: 24px
--row-pad-y:   11px

/* html.compact (tweak) */
--pad-card:    14px
--pad-card-y:  12px
--gap-grid:    12px
--gap-row:     14px
--kpi-pad:     12px
--kpi-val-size: 20px
--row-pad-y:   8px
```

---

## 8. Border Radius

```css
--radius:      0.5rem    /* 8px — base (cards, inputs) */
--radius-sm:   0.3rem    /* 5px — badges, chips */
--radius-md:   0.5rem
--radius-lg:   0.75rem   /* 12px — drawer */
--radius-xl:   1rem
--radius-full: 9999px    /* pills */
```

---

## 9. Shadows

```css
--shadow-sm:  0 1px 2px 0 hsl(222 47% 11% / 0.05)
--shadow:     0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08)
--shadow-md:  0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08)
```

Drawer usa `--shadow-md`. Cards e KPIs usam `--shadow-sm`. Tooltips dos charts não usam shadow (fundo branco com border de slate-200 já basta).

---

## 10. Componentes

### 10.1 Segmented control (.segment)

Container `display: inline-flex` com `padding: 3px`, fundo `--muted`, `border-radius: 7px`. Botões filhos:
- `height: 28px`, `padding: 0 12px`
- Estado normal: `color: --muted-foreground`, background transparente
- Estado `.active`: `background: --card`, `box-shadow: --shadow-sm`, `color: --foreground`

Usado para Hoje/Semana/Mês/Mês ant., Volume/Receita, Sem/Com Arla 32, Todos/Conveniência/Serviços/Lubrificantes.

### 10.2 KPI card (.kpi)

- `min-height: 116px` no comfortable
- `padding: var(--kpi-pad)`, `border: 1px solid --border`, `border-radius: --radius`
- Estrutura: label (text-xs muted) → value (24px semibold tabular-nums) → 2 delta rows empilhadas → SVG sparkline absoluto cobrindo o card de borda a borda
- Sparkline com `opacity: 0.28` (light) / `0.38` (dark) — toggle via tweak `sparklines`

### 10.3 SVG Sparkline (hand-rolled — substitui Chart.js para KPIs)

```html
<svg viewBox="0 0 200 60" preserveAspectRatio="none" width="100%" height="100%">
  <path d="<area>" fill="#0073BB" fill-opacity="0.22"/>
  <path d="<line>" fill="none" stroke="#0073BB" stroke-width="1.4"
        stroke-linejoin="round" stroke-linecap="round"
        vector-effect="non-scaling-stroke"/>
</svg>
```

- `preserveAspectRatio="none"` para esticar sem distorção de Chart.js
- Curva ocupa **45% inferior** do viewBox — texto KPI tem respiro
- Path cúbico-bezier manual (controle de tangentes)
- Área fechada até `y=H` para o fill sempre tocar o rodapé do card
- `vector-effect="non-scaling-stroke"` mantém 1.4px independente do stretch

### 10.4 Drawer (.drawer)

- 420px de largura, `max-width: 92vw`
- Entra com `transform: translateX(100%)` → `0`, `transition: 220ms cubic-bezier(0.16, 1, 0.3, 1)`
- Overlay `hsl(222 47% 11% / 0.4)`
- Header com title + close button (btn-ghost btn-icon)

### 10.5 Tabela (.tbl)

- `font-size: 13px`, `border-collapse: collapse`
- Header em `text-xs uppercase tracking-wide`, `color: --muted-foreground`
- Células com padding `var(--row-pad-y) 14px`
- Linhas hover `bg-muted/0.6` quando `.clickable`
- Footer com `border-top` e `bg-muted/0.4` para totais

### 10.6 Badge

- Pílula com `border-radius: 999px`, `padding: 2px 8px`, `font-size: 11px`
- Variantes: `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-primary`, `.badge-soft`

### 10.7 Heatmap

- 4 semanas × 7 dias, cada célula 36px de altura
- Background `hsl(204 100% 37% / α)` onde `α = 0.08 + tier × 0.92`
- Texto branco quando `tier > 0.55`, senão `--foreground`
- Legenda gradiente embaixo

### 10.8 Status dot

- 10px, `border-radius: 999px`
- Variantes `.ok` (verde com pulse animation), `.warn` (amber), `.err` (vermelho)
- Pulse: `::after` com `2px solid green/0.3`, scale 1→1.8 em 2s

---

## 11. Tema Chart.js — Configuração Compartilhada

Configurações reaproveitadas em **TODOS** os charts via factories em `charts.js`:

```js
// Tooltip
function TT() {
  return {
    backgroundColor: t.tooltipBg, borderColor: t.tooltipBorder, borderWidth: 1,
    titleColor: t.titleColor, bodyColor: t.bodyColor,
    padding: { x: 14, y: 10 }, cornerRadius: 8, boxPadding: 4,
    usePointStyle: true,
    titleFont: { size: 12, weight: '600' }, bodyFont: { size: 12 }
  };
}

// Grid
function GRID() { return { color: t.grid, drawTicks: false }; }

// Axis ticks
function TICK() { return { color: t.tick, font: { size: 11 }, padding: 8 }; }

// Hide axis border
const NOBDR = { display: false };

// Bottom legend with circular dots
function LEG_B() {
  return {
    position: 'bottom',
    labels: { boxWidth: 8, boxHeight: 8, usePointStyle: true, pointStyle: 'circle',
              color: t.tick, padding: 16, font: { size: 11 } }
  };
}
```

Os tokens `t.*` vêm de `themeTokens()` que olha `html.dark` em runtime, então qualquer mudança de tema aplica em todos os charts no próximo `rerenderCurrent()`.

---

## 12. Padrão dos Charts (atualizado v1.4)

### 12.1 Evolução de Receita & Margem (Visão Geral)

- **Receita Bruta**: curva azul `#0073BB` com **gradient fill vertical** (top 50% opacity → bottom 6%) — `borderWidth: 2`, `tension: 0.35`, `pointRadius: 0`, `fill: 'origin'`, `order: 3`
- **Margem Bruta**: curva verde `#16a34a` com gradient verde, mesma curva, `order: 2`
- **Margem % (eixo dir.)**: linha **tracejada laranja** `#EC7211`, `borderDash: [6, 4]`, `fill: false`, `order: 0`, **`hidden: true` por padrão**
- Y2 (`scales.y2.display: 'auto'`) só renderiza quando a série está visível
- Legenda invertida (`legend.reverse: true`) para ordem visual: Receita Bruta · Margem Bruta · Margem %

### 12.2 Evolução por produto (Combustível)

- Sempre **stacked area com gradient** (botão Linha foi removido v1.4)
- Cada série usa gradient próprio (`top: color+80, bottom: color+10`)
- Paleta sequencial das séries (s1–s6)
- `fill: 'origin'` na primeira série, `'-1'` (relativa) nas seguintes

### 12.3 Receita × Margem Bruta (Conveniência)

- Mesma estética: duas curvas com gradient (laranja Receita, verde Margem Bruta)
- `fill: 'origin'` em ambas

### 12.4 Donut

- `cutout: '72%'` — anel fino
- Border do segmento usa cor do `--card` (branco no light, slate no dark) para criar gap visual
- Total no centro via `.donut-center`
- Legenda externa em grid 2-col

### 12.5 Waterfall (DRE)

- Padrão **alinhado com o gráfico da Visão Geral** (v1.4)
- 3 datasets stacked no mesmo `stack: 'wf'`:
  - `_helper` (transparente, eleva a barra)
  - `Resultado` (positives: receita azul, total verde)
  - `Deduções` (negatives vermelho)
- `maxBarThickness: 28` (igual ao da Visão Geral, era 56)
- `borderRadius: 4`, `borderSkipped: false` em todos os lados
- `minBarLength: 10` no negatives para garantir visibilidade de pequenas deduções (Descontos = 1.8% receita)
- Tooltip filtra o `_helper` e valores 0

### 12.6 Scatter w/ Quadrantes (Conveniência)

- Plugin custom desenha 4 quadrantes (Estrelas / Volume / Caixa / Questionáveis) com linhas medianas tracejadas
- Bolhas com `r = max(5, sqrt(rev / 200))`
- Fill da cor da categoria com 80% alpha + border sólida

---

## 13. Tweaks Panel

Painel React (Babel inline) no canto inferior direito que controla:

| Tweak | Aplicação |
|-------|-----------|
| `theme` (light/dark) | `html.classList.toggle('dark')` |
| `density` (comfortable/compact) | `html.classList.toggle('compact')` — switcha CSS custom properties de spacing |
| `accent` (blue/indigo/emerald/rose) | `document.documentElement.style.setProperty('--primary', ...)` |
| `sparklines` (bool) | `html.classList.toggle('no-spark')` — `display:none !important` em `.kpi-spark` |
| `chartStyle` (soft/flat/dashed) | passado pro builder de revenueDual |

Estado persistido via postMessage `__edit_mode_set_keys` ao host, que reescreve o bloco JSON `/*EDITMODE-BEGIN*/.../*EDITMODE-END*/` no HTML em disco.

---

## 14. Layout — Shopify Analytics Pattern

```
┌─────────────────────────────────────────────────────┐
│ Sidebar (240px slate)  │ Topbar (period + filters)  │
│ ┌─ Análise ──         │ ───────────────────────────  │
│ │ Visão Geral         │ Page header                  │
│ │ Combustível         │   ├─ Page title              │
│ │ Conveniência        │   └─ Subtitle                │
│ │ DRE Mensal          │ ───────────────────────────  │
│ ├─ Operação (auto-top)│ Content                      │
│ │ Sincronização       │   ├─ KPI row                 │
│ │ Configurações       │   ├─ Chart rows              │
│ └─                    │   └─ Tables                  │
│ ────────────          │                              │
│ Tenant card (footer)  │                              │
└─────────────────────────────────────────────────────┘
```

- Content padding `24px`, gap entre rows `--gap-row`
- Cards usam `--gap-grid` entre si
- `row-3-2` (3fr 2fr), `row-2-1` (2fr 1fr), `row-1-1` (1fr 1fr) — todas viram 1-col abaixo de 1180px

---

## 15. Boas Práticas (lições do protótipo)

| Situação | Abordagem |
|----------|-----------|
| Charts em páginas ocultas | Re-criar no `rerenderCurrent()` da página ativa; destruir o anterior antes |
| Atualizar charts sem animação | `chart.update('none')` (não usado por enquanto — re-criação está OK) |
| Sparkline com gradient que fade pra transparente | **Evitar Chart.js** — usar SVG hand-rolled. Chart.js força layout/padding que conflita com fill-to-edge |
| Canvas com `display: none` via classe `html.*` | Precisa `!important` porque Chart.js seta `display: block` inline no canvas |
| Linha do dual-axis ficando atrás das barras | `order: 0` no dataset da linha, `order: 2+` nas barras |
| Bar com valor pequeno demais para enxergar | `minBarLength: 10` no dataset, mas só com `null` (não `0`) nas outras colunas — senão aparece faixa fantasma |
| Selectors / dropdowns alinhados com botões | `height: 34px` igual em ambos; usar `.input` para selects estilizados shadcn |

---

*Este documento é a fonte de verdade. Qualquer decisão visual que não esteja aqui deve ser adicionada antes de ser implementada.*

# PostoInsight — Design Tokens

> Fonte de verdade extraída diretamente do `<style>` de `docs/design/PostoInsight/PostoInsight.html`.
> Valores exatos — sem aproximações. Use sempre `hsl(var(--nome))` — nunca valores hardcoded.

---

## CSS Variables — `:root` (light)

| Variável | Valor HSL | Uso |
|----------|-----------|-----|
| `--background` | `210 40% 98%` | Fundo da área de conteúdo (`body`, `.content`) |
| `--foreground` | `222 47% 11%` | Texto principal padrão |
| `--card` | `0 0% 100%` | Fundo de cards, topbar, modais |
| `--card-foreground` | `222 47% 11%` | Texto dentro de cards |
| `--popover` | `0 0% 100%` | Fundo de popovers/dropdowns |
| `--popover-foreground` | `222 47% 11%` | Texto de popovers |
| `--sidebar` | `217 33% 17%` | Fundo da sidebar |
| `--sidebar-foreground` | `210 40% 96%` | Texto e ícones na sidebar |
| `--sidebar-muted` | `215 25% 27%` | Hover e separadores na sidebar |
| `--sidebar-active` | `204 100% 47%` | Barra indicadora do item ativo (equivale a `#0073BB`) |
| `--sidebar-active-bg` | `229 60% 8%` | Fundo do item ativo na sidebar |
| `--primary` | `204 100% 37%` | Cor de ação principal (botões, links, anel de foco) |
| `--primary-foreground` | `0 0% 100%` | Texto sobre fundo primário |
| `--primary-subtle` | `204 100% 95%` | Fundo suave para badges/chips primários |
| `--secondary` | `210 40% 96%` | Fundo de elementos secundários |
| `--secondary-foreground` | `215 25% 27%` | Texto sobre fundo secundário |
| `--muted` | `210 40% 96%` | Fundo muted (segmented control, tfoot, empty state) |
| `--muted-foreground` | `215 16% 47%` | Texto secundário/auxiliar |
| `--accent` | `210 40% 96%` | Alias de muted no tema light |
| `--accent-foreground` | `222 47% 11%` | Texto sobre fundo de acento |
| `--border` | `214 32% 91%` | Bordas de cards, tabelas, separadores |
| `--input` | `214 32% 91%` | Borda de campos de input e select |
| `--ring` | `204 100% 37%` | Anel de foco (mesmo que `--primary`) |
| `--success` | `142 71% 45%` | Delta verde, badge-success, DRE result |
| `--warning` | `38 92% 50%` | Badge-warning, sync-dot.warn |
| `--danger` | `0 84% 60%` | Delta vermelho, badge-danger |
| `--success-subtle` | `138 76% 97%` | Fundo de badge-success / DRE result row |
| `--warning-subtle` | `48 100% 96%` | Fundo de badge-warning |
| `--danger-subtle` | `0 86% 97%` | Fundo de badge-danger |
| `--radius` | `0.5rem` | Raio padrão de cards e elementos grandes |
| `--radius-sm` | `0.3rem` | Raio pequeno |

### Sombras (valores literais)

| Variável | Valor |
|----------|-------|
| `--shadow-sm` | `0 1px 2px 0 hsl(222 47% 11% / 0.05)` |
| `--shadow` | `0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08)` |
| `--shadow-md` | `0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08)` |

---

## CSS Variables — `html.dark`

| Variável | Valor HSL |
|----------|-----------|
| `--background` | `222 47% 5%` |
| `--foreground` | `210 40% 98%` |
| `--card` | `222 40% 8%` |
| `--card-foreground` | `210 40% 98%` |
| `--popover` | `222 40% 8%` |
| `--popover-foreground` | `210 40% 98%` |
| `--sidebar` | `222 50% 4%` |
| `--sidebar-foreground` | `210 40% 96%` |
| `--sidebar-muted` | `217 33% 15%` |
| `--sidebar-active` | `243 75% 65%` |
| `--sidebar-active-bg` | `222 50% 9%` |
| `--primary` | `243 75% 65%` |
| `--primary-foreground` | `0 0% 100%` |
| `--primary-subtle` | `243 50% 18%` |
| `--secondary` | `215 25% 18%` |
| `--secondary-foreground` | `210 40% 96%` |
| `--muted` | `215 25% 14%` |
| `--muted-foreground` | `215 16% 60%` |
| `--accent` | `215 25% 18%` |
| `--accent-foreground` | `210 40% 98%` |
| `--border` | `215 25% 16%` |
| `--input` | `215 25% 16%` |
| `--ring` | `243 75% 65%` |
| `--success-subtle` | `142 30% 14%` |
| `--warning-subtle` | `38 60% 14%` |
| `--danger-subtle` | `0 50% 16%` |

> `--success`, `--warning`, `--danger` **não são redefinidos** em dark — permanecem do `:root`.
> Exceção: `.dre-row-result td` em dark usa `color: hsl(140 70% 60%)` (verde mais brilhante).

---

## CSS Variables — `html.compact`

| Variável | Padrão | Compact | Uso |
|----------|--------|---------|-----|
| `--pad-card` | `20px` | `14px` | Padding lateral de cards |
| `--pad-card-y` | `18px` | `12px` | Padding vertical de cards |
| `--gap-grid` | `16px` | `12px` | Gap entre cards do grid |
| `--gap-row` | `20px` | `14px` | Gap entre seções da página |
| `--kpi-pad` | `18px` | `12px` | Padding interno dos KPI cards |
| `--kpi-val-size` | `24px` | `20px` | Tamanho do valor principal do KPI |
| `--row-pad-y` | `11px` | `8px` | Padding vertical das linhas de tabela |

> **O protótipo usa `html.compact` por padrão** (`window.TWEAK_DEFAULTS.density = "compact"`).
> A implementação React deve iniciar com `html.compact` ativo.

---

## Accent colors (tweaks — `tweaks-app.jsx`)

O painel de tweaks permite trocar a cor primária. Valores injetados via `style.setProperty`:

| Accent | `--primary` HSL | `--primary-subtle` HSL | Hex equivalente |
|--------|-----------------|------------------------|-----------------|
| `blue` (padrão) | `204 100% 37%` | `204 100% 95%` | `#0073BB` |
| `indigo` | `243 75% 58%` | `243 80% 96%` | `#4f46e5` |
| `emerald` | `160 84% 32%` | `152 81% 96%` | `#059669` |
| `rose` | `350 89% 55%` | `356 100% 97%` | `#e11d48` |

Ao trocar, `--ring` e `--sidebar-active` também são atualizados para o mesmo valor de `--primary`.

---

## Tipografia

### Font family

```css
body {
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
}
```

Carregado via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

### Classes utilitárias

| Classe | Definição | Uso |
|--------|-----------|-----|
| `.mono` | `font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-feature-settings: 'tnum' 1` | Valores técnicos, timestamps, IDs, preços/litro |
| `.tnum` | `font-variant-numeric: tabular-nums` | Números em colunas de tabela (alternativa inline) |

### Tamanhos por contexto

| Contexto | `font-size` | `font-weight` | Detalhes |
|----------|-------------|---------------|----------|
| `.page-title` | `22px` | `600` | `letter-spacing: -0.3px; line-height: 1.2` |
| `.page-sub` | `13px` | `400` | `color: hsl(var(--muted-foreground)); margin-top: 4px` |
| `.card-title` | `13px` | `600` | `letter-spacing: -0.1px` |
| `.card-desc` | `12px` | `400` | `color: hsl(var(--muted-foreground)); margin-top: 3px` |
| `.kpi-value` | `var(--kpi-val-size)` → 24px / 20px compact | `600` | `letter-spacing: -0.6px; line-height: 1.1` |
| `.kpi-label` | `11px` | `500` | `color: hsl(var(--muted-foreground))` |
| `.kpi-delta-label` | `11px` | `400` | `text-transform: lowercase` |
| `.sb-section-label` | `10px` | `600` | `letter-spacing: 1.4px; text-transform: uppercase; opacity: 0.4` |
| `.sb-item` | `13px` | `500` | `color: hsl(var(--sidebar-foreground) / 0.7)` |
| `.sb-logo-name` | `14px` | `600` | `letter-spacing: -0.2px` |
| `.sb-logo-tag` | `10px` | `500` | `letter-spacing: 0.4px; opacity: 0.5` |
| `.sb-badge` | `9px` | `600` | `letter-spacing: 0.4px` |
| `.sb-tenant-name` | `12px` | `500` | — |
| `.sb-tenant-role` | `10px` | `400` | `opacity: 0.5` |
| `.tbl th` | `11px` | `500` | `letter-spacing: 0.1px; color: hsl(var(--muted-foreground))` |
| `.tbl td` | `13px` | `400` | — |
| `.tbl tfoot td` | `13px` | `600` | — |
| `.badge` | `11px` | `500` | — |
| `.btn` | `13px` | `500` | — |
| `.btn-sm` | `12px` | `500` | — |
| `.sync-time` | `11px` | `400` | Geist Mono |
| `.dre-month-label` | `16px` | `600` | `min-width: 110px; text-align: center` |
| `.drawer-title` | `15px` | `600` | — |
| `.donut-center-l` | `10px` | `600` | `letter-spacing: 0.8px; text-transform: uppercase` |
| `.donut-center-v` | `14px` | `600` | `margin-top: 2px` |
| `.dl-name` | `12px` | `400` | `color: hsl(var(--muted-foreground))` |
| `.dl-pct` | `12px` | `600` | — |
| `.bar-num` | `11px` | `400` | `min-width: 38px; text-align: right` |
| `.row-rank` | `12px` | `500` | `color: hsl(var(--muted-foreground))` |
| `.trend-up / .trend-down` | `11px` | `600` | — |
| `.trend-flat` | `11px` | `400` | — |
| `.cfg-label` | `12px` | `400` | `color: hsl(var(--muted-foreground))` |
| `.cfg-value` | `13px` | `500` | — |
| `.cfg-loc-name` | `13px` | `500` | — |
| `.cfg-loc-meta` | `11px` | `400` | `color: hsl(var(--muted-foreground)); margin-top: 2px` |
| `.cfg-loc-avatar` | `11px` | `600` | — |

---

## Estrutura de Layout

| Elemento | Valor |
|----------|-------|
| Sidebar width | `240px` |
| Topbar padding | `12px 24px` |
| Content padding | `24px` |
| `.chart-box` height | `280px` |
| `.chart-box.tall` height | `320px` |
| `.chart-box.short` height | `200px` |
| `.kpi` min-height | `116px` (`auto` quando `html.no-spark`) |
| Drawer width | `420px` (máx `92vw`) |
| Donut diameter | `180px × 180px` |

---

## Bordas e Raios

| Elemento | Raio |
|----------|------|
| `.card`, `.kpi`, `.empty-state`, `.toast` | `var(--radius)` = `0.5rem` |
| `.btn`, `.input`, `select.input`, `.sb-item`, `.sb-tenant-icon`, `.cfg-loc-avatar`, `.dre-month-btn` | `6px` |
| `.segment` (container) | `7px` |
| `.segment button` | `5px` |
| `.heat-cell` | `5px` |
| `.avatar`, `.sync-dot`, `.badge`, `.spinner` | `999px` |
| `.seg-dot`, `.dl-dot` | `2px` |
| `.bar-track`, `.bar-fill`, `.bar-num` contexto | `999px` |
| `.sb-item.active::before` | `2px` |

---

## Animações

| Elemento | Transition / Animation |
|----------|------------------------|
| `.sb-item` hover | `background 0.12s, color 0.12s` |
| `.btn` hover | `background 0.12s, border-color 0.12s, opacity 0.12s` |
| `.input` focus | `border-color 0.12s, box-shadow 0.12s` |
| `.segment button` | `background 0.12s, color 0.12s` |
| `.drawer` | `transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)` — `translateX(100%)` → `translateX(0)` |
| `.drawer-overlay` | `opacity 0.18s` |
| `.toast` | `transform 0.2s, opacity 0.2s` — `translateY(20px) opacity:0` → `translateY(0) opacity:1` |
| `.heat-cell` hover | `transform 0.1s` → `scale(1.05)` |
| `.sync-dot.ok::after` | `pulse 2s infinite` — `scale(1) opacity:1` → `scale(1.8) opacity:0` |
| `.spinner` | `spin 0.7s linear infinite` |

---

## Cores dos Gráficos

Extraídas da constante `C` em `charts.js`:

| Token | Hex | Uso |
|-------|-----|-----|
| `combustivel` | `#0073BB` | Combustíveis (Gasolinas, Diesel, Etanol) |
| `conveniencia` | `#EC7211` | Conveniência / loja |
| `lubrificantes` | `#6B40C4` | Lubrificantes |
| `arla` | `#1D8102` | Arla 32 |
| `servicos` | `#0891b2` | Serviços |
| `s6` | `#db2777` | 6ª série em gráficos multi-linha |
| `pos` | `#16a34a` | Delta positivo, trend up, Margem Bruta em charts |
| `neg` | `#dc2626` | Delta negativo, trend down, CMV em charts |
| `neutral` | `#64748b` | Sem variação (flat) |

Paleta sequencial (multi-série): `s1..s6` = `#0073BB`, `#EC7211`, `#6B40C4`, `#1D8102`, `#0891b2`, `#db2777`

### Tokens de tema para charts (light / dark)

| Propriedade | Light | Dark |
|-------------|-------|------|
| Grid color | `#e2e8f0` | `#1f2937` |
| Tick / axis label | `#64748b` | `#94a3b8` |
| Tooltip background | `#ffffff` | `#0f172a` |
| Tooltip border | `#e2e8f0` | `#1f2937` |
| Tooltip title | `#0f172a` | `#f1f5f9` |
| Tooltip body | `#64748b` | `#94a3b8` |
| Surface (donut border) | `#ffffff` | `#0f172a` |

### Sparklines KPI — cores por card

| KPI | Cor |
|-----|-----|
| Receita Bruta | `#0073BB` |
| CMV | `#dc2626` |
| Margem Bruta | `#16a34a` |
| Margem % | `#0073BB` |
| Itens vendidos | `#6B40C4` |
| Volume (combustível) | `#0073BB` |
| Ticket Médio | accent color da view |

`.kpi-spark { opacity: 0.28 }` — dark: `opacity: 0.38`  
`html.no-spark .kpi-spark { display: none !important }`

---

## Tailwind v4 — Setup

```css
@import "tailwindcss";

@theme inline {
  --color-background:       hsl(var(--background));
  --color-foreground:       hsl(var(--foreground));
  --color-card:             hsl(var(--card));
  --color-border:           hsl(var(--border));
  --color-input:            hsl(var(--input));
  --color-muted:            hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-primary:          hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-primary-subtle:   hsl(var(--primary-subtle));
  --color-success:          hsl(var(--success));
  --color-success-subtle:   hsl(var(--success-subtle));
  --color-warning:          hsl(var(--warning));
  --color-warning-subtle:   hsl(var(--warning-subtle));
  --color-danger:           hsl(var(--danger));
  --color-danger-subtle:    hsl(var(--danger-subtle));
  --color-sidebar:          hsl(var(--sidebar));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-muted:    hsl(var(--sidebar-muted));
  --color-sidebar-active:   hsl(var(--sidebar-active));
  --font-sans:  'Geist', system-ui, -apple-system, sans-serif;
  --font-mono:  'Geist Mono', 'JetBrains Mono', monospace;
  --radius:     0.5rem;
  --radius-sm:  0.3rem;
}
```

> Tailwind v4 usa `@import "tailwindcss"` (não `@tailwind base/components/utilities`).
> `@theme inline` injeta as vars no escopo CSS — Tailwind classes como `bg-card`, `text-foreground` funcionam automaticamente.

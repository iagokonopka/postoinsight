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
| `--sidebar-muted` | `215 25% 27%` | Cor do hover e separadores na sidebar |
| `--sidebar-active` | `204 100% 47%` | Barra indicadora do item ativo (`#0073BB` equivalente em HSL) |
| `--sidebar-active-bg` | `229 60% 8%` | Fundo do item ativo na sidebar |
| `--primary` | `204 100% 37%` | Cor de ação principal (botões, links, anel de foco) |
| `--primary-foreground` | `0 0% 100%` | Texto sobre fundo primário |
| `--primary-subtle` | `204 100% 95%` | Fundo suave para badges/chips primários |
| `--secondary` | `210 40% 96%` | Fundo de elementos secundários |
| `--secondary-foreground` | `215 25% 27%` | Texto sobre fundo secundário |
| `--muted` | `210 40% 96%` | Fundo muted (segmented control, tfoot, empty state) |
| `--muted-foreground` | `215 16% 47%` | Texto secundário/auxiliar |
| `--accent` | `210 40% 96%` | Fundo de acento (alias de muted no tema light) |
| `--accent-foreground` | `222 47% 11%` | Texto sobre fundo de acento |
| `--border` | `214 32% 91%` | Bordas de cards, tabelas, separadores |
| `--input` | `214 32% 91%` | Borda de campos de input e select |
| `--ring` | `204 100% 37%` | Anel de foco (mesmo que `--primary`) |
| `--success` | `142 71% 45%` | Cor positiva (delta verde, badge-success) |
| `--warning` | `38 92% 50%` | Cor de alerta (badge-warning, sync-dot.warn) |
| `--danger` | `0 84% 60%` | Cor negativa (delta vermelho, badge-danger) |
| `--success-subtle` | `138 76% 97%` | Fundo suave de badges de sucesso / DRE result row |
| `--warning-subtle` | `48 100% 96%` | Fundo suave de badges de aviso |
| `--danger-subtle` | `0 86% 97%` | Fundo suave de badges de perigo |
| `--radius` | `0.5rem` | Raio padrão de cards e elementos grandes |
| `--radius-sm` | `0.3rem` | Raio pequeno (não há CSS class dedicada — usado inline) |

### Sombras (valores literais)

| Variável | Valor |
|----------|-------|
| `--shadow-sm` | `0 1px 2px 0 hsl(222 47% 11% / 0.05)` |
| `--shadow` | `0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08)` |
| `--shadow-md` | `0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08)` |

---

## CSS Variables — `html.dark`

| Variável | Valor HSL | Diferença principal |
|----------|-----------|---------------------|
| `--background` | `222 47% 5%` | Fundo muito escuro |
| `--foreground` | `210 40% 98%` | Texto claro |
| `--card` | `222 40% 8%` | Cards levemente mais claros que background |
| `--card-foreground` | `210 40% 98%` | — |
| `--popover` | `222 40% 8%` | — |
| `--popover-foreground` | `210 40% 98%` | — |
| `--sidebar` | `222 50% 4%` | Sidebar mais escura que background |
| `--sidebar-foreground` | `210 40% 96%` | (igual ao light) |
| `--sidebar-muted` | `217 33% 15%` | — |
| `--sidebar-active` | `243 75% 65%` | Azul-violeta no dark (indigo) |
| `--sidebar-active-bg` | `222 50% 9%` | — |
| `--primary` | `243 75% 65%` | Muda para indigo no dark |
| `--primary-foreground` | `0 0% 100%` | — |
| `--primary-subtle` | `243 50% 18%` | — |
| `--secondary` | `215 25% 18%` | — |
| `--secondary-foreground` | `210 40% 96%` | — |
| `--muted` | `215 25% 14%` | — |
| `--muted-foreground` | `215 16% 60%` | — |
| `--accent` | `215 25% 18%` | — |
| `--accent-foreground` | `210 40% 98%` | — |
| `--border` | `215 25% 16%` | Bordas quase invisíveis |
| `--input` | `215 25% 16%` | — |
| `--ring` | `243 75% 65%` | (igual ao primary dark) |
| `--success-subtle` | `142 30% 14%` | Escuro no dark |
| `--warning-subtle` | `38 60% 14%` | — |
| `--danger-subtle` | `0 50% 16%` | — |

> **Nota:** `--success`, `--warning`, `--danger` não são redefinidos em dark — permanecem do `:root`.
> A exceção é `.dre-row-result td` em dark: `color: hsl(140 70% 60%)` (verde mais brilhante).

---

## CSS Variables — `html.compact`

| Variável | Valor padrão | Valor compact | Uso |
|----------|-------------|---------------|-----|
| `--pad-card` | `20px` | `14px` | Padding lateral de cards |
| `--pad-card-y` | `18px` | `12px` | Padding vertical de cards |
| `--gap-grid` | `16px` | `12px` | Gap entre cards do grid |
| `--gap-row` | `20px` | `14px` | Gap entre seções da página |
| `--kpi-pad` | `18px` | `12px` | Padding interno dos KPI cards |
| `--kpi-val-size` | `24px` | `20px` | Tamanho do valor principal do KPI |
| `--row-pad-y` | `11px` | `8px` | Padding vertical das linhas de tabela |

> O default do protótipo usa `html.compact` (`window.TWEAK_DEFAULTS.density = "compact"`).

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

### Classes utilitárias

| Classe | Definição | Uso |
|--------|-----------|-----|
| `.mono` | `font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-feature-settings: 'tnum' 1` | Valores, timestamps, IDs técnicos |
| `.tnum` | `font-variant-numeric: tabular-nums` | Números em colunas de tabela |

### Tamanhos por classe

| Classe | `font-size` | `font-weight` | Uso |
|--------|-------------|---------------|-----|
| `.page-title` | `22px` | `600` | Título da página (`letter-spacing: -0.3px`) |
| `.page-sub` | `13px` | `400` | Subtítulo da página |
| `.card-title` | `13px` | `600` | Título de section card (`letter-spacing: -0.1px`) |
| `.card-desc` | `12px` | `400` | Descrição de section card |
| `.kpi-value` | `var(--kpi-val-size)` → `24px` / `20px` compact | `600` | Valor principal do KPI (`letter-spacing: -0.6px`) |
| `.kpi-label` | `11px` | `500` | Label do KPI |
| `.kpi-delta-label` | `11px` | `400` | Texto auxiliar do delta |
| `.sb-section-label` | `10px` | `600` | Label de seção na sidebar (`letter-spacing: 1.4px`, uppercase) |
| `.sb-item` | `13px` | `500` | Item de nav na sidebar |
| `.sb-logo-name` | `14px` | `600` | Nome do produto na sidebar (`letter-spacing: -0.2px`) |
| `.sb-logo-tag` | `10px` | `500` | Tagline na sidebar (`letter-spacing: 0.4px`) |
| `.sb-tenant-name` | `12px` | `500` | Nome do tenant no footer da sidebar |
| `.tbl th` | `11px` | `500` | Cabeçalho de tabela (`letter-spacing: 0.1px`) |
| `.tbl td` | `13px` | `400` | Célula de tabela |
| `.badge` | `11px` | `500` | Badge/chip |
| `.dre-month-label` | `16px` | `600` | Label do mês no toolbar da DRE |
| `.sync-time` | `11px` | `400` | Timestamp na lista de sync (Geist Mono) |
| `.btn` | `13px` | `500` | Botões padrão |
| `.btn-sm` | `12px` | `500` | Botões pequenos |

---

## Estrutura de Layout

| Elemento | Valor | CSS |
|----------|-------|-----|
| Sidebar width | `240px` | `.sidebar { width: 240px; flex-shrink: 0 }` |
| Topbar padding | `12px 24px` | `.topbar { padding: 12px 24px }` |
| Content padding | `24px` | `.content { padding: 24px }` |
| ChartBox height padrão | `280px` | `.chart-box { height: 280px }` |
| ChartBox height tall | `320px` | `.chart-box.tall { height: 320px }` |
| ChartBox height short | `200px` | `.chart-box.short { height: 200px }` |
| KPI min-height | `116px` | `.kpi { min-height: 116px }` |
| Drawer width | `420px` (máx `92vw`) | `.drawer { width: 420px; max-width: 92vw }` |

---

## Bordas e Raios

| Elemento | Valor | Origem |
|----------|-------|--------|
| `--radius` | `0.5rem` (8px) | `:root` — usado em `.card`, `.kpi`, `.empty-state` |
| `--radius-sm` | `0.3rem` (≈5px) | `:root` — referenciado mas raramente aplicado via variável |
| `.btn`, `.input`, `select.input` | `6px` literal | CSS das classes |
| `.sb-item` | `6px` literal | CSS da classe |
| `.segment` | `7px` | Container do segmented control |
| `.segment button` | `5px` | Botões dentro do segmented |
| `.heat-cell` | `5px` | Célula do heatmap |
| `.avatar` | `999px` | Circular |
| `.sync-dot` | `999px` | Dot de status circular |
| `.sb-tenant-icon` | `6px` | Ícone do tenant na sidebar |
| `.cfg-loc-avatar` | `6px` | Avatar de location nas configurações |

---

## Cores de Segmento (Gráficos)

Extraídas de `charts.js` — constante `C`:

| Segmento | Cor hex | Uso |
|----------|---------|-----|
| `combustivel` | `#0073BB` | Combustível (Gasolinas, Diesel, Etanol) |
| `conveniencia` | `#EC7211` | Conveniência / loja |
| `lubrificantes` | `#6B40C4` | Lubrificantes |
| `arla` | `#1D8102` | Arla 32 |
| `servicos` | `#0891b2` | Serviços |
| `positive` (pos) | `#16a34a` | Delta positivo, trend up |
| `negative` (neg) | `#dc2626` | Delta negativo, trend down |
| `neutral` | `#64748b` | Sem variação (flat) |

Séries múltiplas (s1–s6): `#0073BB`, `#EC7211`, `#6B40C4`, `#1D8102`, `#0891b2`, `#db2777`

---

## Animações

| Elemento | Transição/Animation | Valor |
|----------|---------------------|-------|
| `.sb-item` hover/active | `transition: background 0.12s, color 0.12s` | — |
| `.btn` hover | `transition: background 0.12s, border-color 0.12s, opacity 0.12s` | — |
| `.drawer` open/close | `transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)` | translateX(100%) → translateX(0) |
| `.drawer-overlay` open/close | `transition: opacity 0.18s` | 0 → 1 |
| `.toast` show/hide | `transition: transform 0.2s, opacity 0.2s` | translateY(20px) + opacity:0 → translateY(0) + opacity:1 |
| `.heat-cell` hover | `transition: transform 0.1s` | scale(1.05) |
| `.sync-dot.ok::after` | `animation: pulse 2s infinite` | @keyframes: scale(1)→scale(1.8), opacity 1→0 |
| `.spinner` | `animation: spin 0.7s linear infinite` | @keyframes: rotate(360deg) |

---

## Temas de Gráfico (charts.js)

| Propriedade | Light | Dark |
|-------------|-------|------|
| Grid color | `#e2e8f0` | `#1f2937` |
| Tick color | `#64748b` | `#94a3b8` |
| Tooltip background | `#ffffff` | `#0f172a` |
| Tooltip border | `#e2e8f0` | `#1f2937` |
| Title color | `#0f172a` | `#f1f5f9` |
| Body color | `#64748b` | `#94a3b8` |
| Surface | `#ffffff` | `#0f172a` |

> Sparklines SVG: fill com opacity `0.22`, stroke-width `1.4`. KPI spark: `.kpi-spark { opacity: 0.28 }` (dark: `0.38`).

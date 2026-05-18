# PostoInsight — Catálogo de Componentes

> Extraído diretamente do CSS em `docs/design/PostoInsight/PostoInsight.html`.
> Valores exatos. Para cada componente: estrutura HTML, classes, variantes e regras.

---

## Layout

### AppShell

```html
<body>          <!-- display: flex; overflow: hidden -->
  <aside class="sidebar">…</aside>
  <div class="main">
    <header class="topbar">…</header>
    <div class="content">
      <section class="page active">…</section>
    </div>
  </div>
</body>
```

**Regras críticas:**
- `body`: `display: flex; overflow: hidden` — layout horizontal, sem scroll no body
- `.main`: `flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden`
- `.content`: `flex: 1; overflow-y: auto; padding: 24px` — único elemento com scroll

---

### Sidebar

```html
<aside class="sidebar">
  <div class="sb-logo">
    <svg>…</svg>
    <div>
      <div class="sb-logo-name">PostoInsight</div>
      <div class="sb-logo-tag">BI · Rede JAM</div>
    </div>
  </div>
  <nav class="sb-nav">
    <div>
      <div class="sb-section-label">Análise</div>
      <button class="sb-item active">
        <svg>…</svg>
        Visão Geral
      </button>
    </div>
    <div style="margin-top: auto;">
      <div class="sb-section-label">Operação</div>
      <button class="sb-item">
        …
        <span class="sb-badge">OK</span>
      </button>
    </div>
  </nav>
  <div class="sb-footer">
    <div class="sb-tenant">
      <div class="sb-tenant-icon">JM</div>
      <div>
        <div class="sb-tenant-name">Rede JAM</div>
        <div class="sb-tenant-role">owner · isabela.k</div>
      </div>
    </div>
  </div>
</aside>
```

| Classe | CSS relevante |
|--------|--------------|
| `.sidebar` | `width: 240px; flex-shrink: 0; background: hsl(var(--sidebar)); border-right: 1px solid hsl(var(--sidebar-muted) / 0.5)` |
| `.sb-logo` | `padding: 18px 20px; border-bottom: 1px solid hsl(var(--sidebar-muted) / 0.6)` |
| `.sb-logo-name` | `font-size: 14px; font-weight: 600; letter-spacing: -0.2px` |
| `.sb-logo-tag` | `font-size: 10px; font-weight: 500; color: hsl(var(--sidebar-foreground) / 0.5); letter-spacing: 0.4px; margin-top: 1px` |
| `.sb-nav` | `padding: 16px 12px; display: flex; flex-direction: column; gap: 20px; flex: 1; overflow-y: auto` |
| `.sb-section-label` | `font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: hsl(var(--sidebar-foreground) / 0.4); padding: 0 8px; margin-bottom: 4px` |
| `.sb-item` | `display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; color: hsl(var(--sidebar-foreground) / 0.7); transition: background 0.12s, color 0.12s; position: relative` |
| `.sb-item:hover` | `background: hsl(var(--sidebar-muted) / 0.6); color: hsl(var(--sidebar-foreground))` |
| `.sb-item.active` | `background: hsl(var(--sidebar-active-bg)); color: hsl(var(--sidebar-foreground))` |
| `.sb-item.active::before` | `content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2.5px; background: hsl(var(--sidebar-active)); border-radius: 2px` — **barra azul esquerda** |
| `.sb-item svg` | `width: 14px; height: 14px; stroke-width: 1.6; opacity: 0.85` |
| `.sb-item.active svg` | `color: hsl(var(--sidebar-active)); opacity: 1` |
| `.sb-badge` | `margin-left: auto; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 999px; background: hsl(var(--sidebar-foreground) / 0.1)` |
| `.sb-footer` | `padding: 12px; border-top: 1px solid hsl(var(--sidebar-muted) / 0.6)` |
| `.sb-tenant` | `display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px` |
| `.sb-tenant-icon` | `width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #0073BB, #6B40C4); font-size: 11px; font-weight: 700; color: white` |
| `.sb-tenant-name` | `font-size: 12px; font-weight: 500` |
| `.sb-tenant-role` | `font-size: 10px; color: hsl(var(--sidebar-foreground) / 0.5)` |

---

### Topbar

```html
<header class="topbar">
  <div class="crumb">
    <b id="crumb-page">Visão Geral</b>
    <svg>…</svg>
    <span id="crumb-context">Todas as unidades · Este mês</span>
  </div>
  <div class="topbar-right">
    <div class="segment" id="period-tabs">…</div>
    <!-- OU para DRE: -->
    <div class="dre-toolbar" id="dre-date-toolbar">…</div>
    <select class="input" id="location-select">…</select>
    <button class="btn btn-outline" id="btn-sync">…</button>
    <div class="avatar">IK</div>
  </div>
</header>
```

| Classe | CSS relevante |
|--------|--------------|
| `.topbar` | `display: flex; align-items: center; gap: 12px; padding: 12px 24px; background: hsl(var(--card)); border-bottom: 1px solid hsl(var(--border)); flex-shrink: 0` |
| `.crumb` | `font-size: 13px; color: hsl(var(--muted-foreground)); white-space: nowrap; flex-shrink: 0` |
| `.crumb b` | `color: hsl(var(--foreground)); font-weight: 600` |
| `.crumb svg` | `width: 12px; height: 12px; opacity: 0.5` |
| `.topbar-right` | `margin-left: auto; display: flex; align-items: center; gap: 8px` |

**Responsivo:** `@media (max-width: 1100px)` → `.crumb svg` e `#crumb-context` ocultos. `@media (max-width: 980px)` → `.crumb` inteiro oculto.

---

### ContentArea

| Classe | CSS |
|--------|-----|
| `.content` | `flex: 1; overflow-y: auto; padding: 24px` |
| `.page` | `display: none; flex-direction: column; gap: var(--gap-row)` |
| `.page.active` | `display: flex` |
| `.page-head` | `display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap` |
| `.page-title` | `font-size: 22px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2` |
| `.page-sub` | `font-size: 13px; color: hsl(var(--muted-foreground)); margin-top: 4px` |
| `.page-actions` | `display: flex; align-items: center; gap: 8px` |

---

## Controles

### Button

| Variante | CSS |
|----------|-----|
| `.btn` (base) | `display: inline-flex; align-items: center; gap: 6px; height: 34px; padding: 0 12px; border-radius: 6px; font-size: 13px; font-weight: 500; border: 1px solid transparent; transition: background 0.12s, border-color 0.12s, opacity 0.12s` |
| `.btn svg` | `width: 14px; height: 14px; stroke-width: 1.8` |
| `.btn-outline` | `background: hsl(var(--card)); color: hsl(var(--foreground)); border-color: hsl(var(--border))` — hover: `background: hsl(var(--muted))` |
| `.btn-primary` | `background: hsl(var(--primary)); color: hsl(var(--primary-foreground))` — hover: `opacity: 0.92` |
| `.btn-ghost` | `background: transparent; color: hsl(var(--muted-foreground))` — hover: `background: hsl(var(--muted)); color: hsl(var(--foreground))` |
| `.btn-icon` | `width: 34px; padding: 0; justify-content: center` |
| `.btn-sm` | `height: 28px; padding: 0 10px; font-size: 12px` — svg: `12px` |

---

### Select / Input

| Propriedade | Valor |
|-------------|-------|
| Height | `34px` |
| Padding | `0 28px 0 12px` |
| Border-radius | `6px` |
| Border | `1px solid hsl(var(--input))` |
| Font | `inherit; font-size: 13px` |
| Chevron | SVG inline via `background-image` (stroke `#64748b`), `background-position: right 10px center` |
| Focus | `border-color: hsl(var(--ring)); box-shadow: 0 0 0 3px hsl(var(--ring) / 0.15)` |

---

### SegmentedControl

| Classe | CSS |
|--------|-----|
| `.segment` | `display: inline-flex; padding: 3px; background: hsl(var(--muted)); border-radius: 7px; gap: 2px` |
| `.segment button` | `height: 28px; padding: 0 12px; border: none; background: transparent; font-size: 12px; font-weight: 500; color: hsl(var(--muted-foreground)); border-radius: 5px; transition: background 0.12s, color 0.12s` |
| `.segment button:hover` | `color: hsl(var(--foreground))` |
| `.segment button.active` | `background: hsl(var(--card)); color: hsl(var(--foreground)); box-shadow: var(--shadow-sm)` |

---

### Avatar

| Propriedade | Valor |
|-------------|-------|
| Size | `32px × 32px` |
| Border-radius | `999px` |
| Background | `linear-gradient(135deg, #0073BB, #6B40C4)` |
| Font | `font-size: 11px; font-weight: 700; color: white` |

---

## Cards

### SectionCard

```html
<div class="card">
  <div class="card-h">
    <div>
      <div class="card-title">Título</div>
      <div class="card-desc">Descrição opcional</div>
    </div>
    <!-- slot direito opcional: segment, botão -->
  </div>
  <div class="card-b"><!-- conteúdo --></div>
</div>
```

| Classe | CSS |
|--------|-----|
| `.card` | `background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); box-shadow: var(--shadow-sm)` |
| `.card-h` | `padding: var(--pad-card-y) var(--pad-card) 8px; display: flex; align-items: flex-start; justify-content: space-between; gap: 12px` |
| `.card-b` | `padding: 0 var(--pad-card) var(--pad-card-y)` |
| `.card-title` | `font-size: 13px; font-weight: 600; letter-spacing: -0.1px` |
| `.card-desc` | `font-size: 12px; color: hsl(var(--muted-foreground)); margin-top: 3px` |

---

### KpiCard

```html
<div class="kpi-grid kpi-5">
  <div class="kpi">
    <svg class="kpi-spark">…</svg>  <!-- fundo absoluto, pointer-events: none -->
    <div class="kpi-label">Receita Bruta</div>
    <div class="kpi-value">R$ 1.240k</div>
    <div class="kpi-deltas">
      <div class="kpi-delta-row">
        <span class="delta-pos">+8,2%</span>
        <span class="kpi-delta-label">vs período ant.</span>
      </div>
    </div>
  </div>
</div>
```

| Classe | CSS |
|--------|-----|
| `.kpi-grid` | `display: grid; gap: var(--gap-grid)` |
| `.kpi-5` | `repeat(auto-fit, minmax(160px, 1fr))` — `≥1280px`: `repeat(5, minmax(0,1fr))` |
| `.kpi-4` | `repeat(auto-fit, minmax(190px, 1fr))` — `≥1100px`: `repeat(4, minmax(0,1fr))` |
| `.kpi-3` | `repeat(auto-fit, minmax(220px, 1fr))` |
| `.kpi` | `position: relative; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); padding: var(--kpi-pad); overflow: hidden; display: flex; flex-direction: column; min-height: 116px` |
| `.kpi-label` | `font-size: 11px; font-weight: 500; color: hsl(var(--muted-foreground)); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: relative; z-index: 1` |
| `.kpi-label svg` | `width: 12px; height: 12px; opacity: 0.7` |
| `.kpi-value` | `font-size: var(--kpi-val-size); font-weight: 600; letter-spacing: -0.6px; margin: 6px 0 8px; line-height: 1.1; font-variant-numeric: tabular-nums; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; position: relative; z-index: 1` |
| `.kpi-deltas` | `display: flex; flex-direction: column; gap: 2px; font-size: 11px; margin-top: auto; position: relative; z-index: 1` |
| `.kpi-delta-row` | `display: flex; align-items: center; gap: 6px` |
| `.kpi-delta-label` | `font-size: 11px; color: hsl(var(--muted-foreground)); white-space: nowrap; text-transform: lowercase` |
| `.kpi-spark` | `position: absolute; left: -2px; right: -2px; top: 0; bottom: -1px; height: auto; opacity: 0.28; pointer-events: none; z-index: 0` — dark: `opacity: 0.38` |

---

### DeltaTag

| Classe | CSS |
|--------|-----|
| `.delta-pos` | `color: hsl(var(--success))` |
| `.delta-neg` | `color: hsl(var(--danger))` |
| `.delta-neu` | `color: hsl(var(--muted-foreground))` |

---

## Tabelas

### DataTable

```html
<div class="tbl-wrap">
  <table class="tbl">
    <thead><tr>
      <th style="width: 28px;">#</th>
      <th>Produto</th>
      <th class="r">Receita</th>
      <th style="width: 200px;">Peso</th>
    </tr></thead>
    <tbody>
      <tr class="clickable">
        <td><span class="row-rank">1</span></td>
        <td>
          <div class="seg-cell">
            <span class="seg-dot" style="background:#0073BB"></span>
            Gasolina Comum
          </div>
        </td>
        <td class="r">R$ 420.000</td>
        <td>
          <div class="bar-cell">
            <div class="bar-track"><div class="bar-fill" style="width:72%"></div></div>
            <span class="bar-num">72%</span>
          </div>
        </td>
      </tr>
    </tbody>
    <tfoot><tr>
      <td>TOTAL</td><td></td>
      <td class="r">R$ 1.240k</td><td></td>
    </tr></tfoot>
  </table>
</div>
```

| Classe | CSS |
|--------|-----|
| `.tbl-wrap` | `overflow-x: auto` |
| `table.tbl` | `width: 100%; border-collapse: collapse; font-size: 13px` |
| `.tbl thead tr` | `border-bottom: 1px solid hsl(var(--border))` |
| `.tbl th` | `padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 500; color: hsl(var(--muted-foreground)); white-space: nowrap; letter-spacing: 0.1px` |
| `.tbl th:first-child, td:first-child` | `padding-left: 20px` |
| `.tbl th:last-child, td:last-child` | `padding-right: 20px` |
| `.tbl th.r, .tbl td.r` | `text-align: right; font-variant-numeric: tabular-nums` |
| `.tbl td` | `padding: var(--row-pad-y) 14px; border-bottom: 1px solid hsl(var(--border)); vertical-align: middle` |
| `.tbl tbody tr:last-child td` | `border-bottom: 0` |
| `.tbl tbody tr.clickable` | `cursor: pointer` — hover: `background: hsl(var(--muted) / 0.6)` |
| `.tbl tfoot td` | `border-top: 1px solid hsl(var(--border)); border-bottom: 0; font-weight: 600; padding: 12px 14px; background: hsl(var(--muted) / 0.4)` |
| `.row-rank` | `font-size: 12px; font-weight: 500; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums` |
| `.seg-cell` | `display: flex; align-items: center; gap: 10px` |
| `.seg-dot` | `width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0` |
| `.bar-cell` | `display: flex; align-items: center; gap: 8px; min-width: 120px` |
| `.bar-track` | `flex: 1; height: 5px; background: hsl(var(--muted)); border-radius: 999px; overflow: hidden` |
| `.bar-fill` | `height: 100%; border-radius: 999px; background: hsl(var(--primary))` |
| `.bar-num` | `font-size: 11px; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; min-width: 38px; text-align: right` |
| `.spark-cell` | `display: flex; align-items: center; gap: 8px; min-width: 110px` |
| `.spark-cell canvas` | `width: 72px !important; height: 22px !important; flex-shrink: 0` |
| `.trend-up` | `color: hsl(var(--success)); font-size: 11px; font-weight: 600` |
| `.trend-down` | `color: hsl(var(--danger)); font-size: 11px; font-weight: 600` |
| `.trend-flat` | `color: hsl(var(--muted-foreground)); font-size: 11px` |

---

## Feedback

### Badge

| Variante | CSS |
|----------|-----|
| `.badge` (base) | `display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 500; border: 1px solid hsl(var(--border)); background: hsl(var(--muted)); color: hsl(var(--foreground))` |
| `.badge-success` | `background: hsl(var(--success-subtle)); color: hsl(var(--success)); border-color: hsl(var(--success) / 0.3)` |
| `.badge-warning` | `background: hsl(var(--warning-subtle)); color: hsl(var(--warning)); border-color: hsl(var(--warning) / 0.3)` |
| `.badge-danger` | `background: hsl(var(--danger-subtle)); color: hsl(var(--danger)); border-color: hsl(var(--danger) / 0.3)` |
| `.badge-primary` | `background: hsl(var(--primary-subtle)); color: hsl(var(--primary)); border-color: hsl(var(--primary) / 0.3)` |
| `.badge-soft` | `background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); border: none` |

---

### StatusDot

| Classe | CSS |
|--------|-----|
| `.sync-dot` | `width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; position: relative` |
| `.sync-dot.ok` | `background: hsl(var(--success))` |
| `.sync-dot.ok::after` | `content: ''; position: absolute; inset: -3px; border-radius: 999px; border: 2px solid hsl(var(--success) / 0.3); animation: pulse 2s infinite` |
| `.sync-dot.warn` | `background: hsl(var(--warning))` |
| `.sync-dot.err` | `background: hsl(var(--danger))` |

`@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }`

---

### EmptyState

| Classe | CSS |
|--------|-----|
| `.empty-state` | `display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 24px; border: 1.5px dashed hsl(var(--border)); border-radius: var(--radius); background: hsl(var(--muted) / 0.3)` |
| `.empty-icon` | `width: 40px; height: 40px; border-radius: 999px; background: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; margin-bottom: 12px` |
| `.empty-title` | `font-size: 14px; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 4px` |
| `.empty-desc` | `font-size: 12px; max-width: 320px` |

---

### Toast

| Classe | CSS |
|--------|-----|
| `.toast` | `position: fixed; right: 24px; bottom: 24px; background: hsl(var(--card)); border: 1px solid hsl(var(--border)); border-radius: var(--radius); box-shadow: var(--shadow-md); padding: 12px 16px; display: flex; align-items: center; gap: 10px; font-size: 13px; z-index: 50; transform: translateY(20px); opacity: 0; transition: transform 0.2s, opacity 0.2s` |
| `.toast.show` | `transform: translateY(0); opacity: 1` |
| `.toast.success .toast-icon` | `color: hsl(var(--success))` |
| `.toast.info .toast-icon` | `color: hsl(var(--primary))` |

---

### Spinner

| Classe | CSS |
|--------|-----|
| `.spinner` | `width: 14px; height: 14px; border: 2px solid hsl(var(--muted)); border-top-color: hsl(var(--primary)); border-radius: 999px; animation: spin 0.7s linear infinite` |
| `.spinner-lg` | `width: 32px; height: 32px; border-width: 3px` |

`@keyframes spin { to { transform: rotate(360deg); } }`

---

## Overlay

### Drawer

```html
<div class="drawer-overlay"></div>
<div class="drawer">
  <div class="drawer-head">
    <div class="drawer-title">Gasolina Comum</div>
    <button class="btn btn-ghost btn-icon btn-sm">✕</button>
  </div>
  <div class="drawer-body">
    <div class="drawer-row">
      <span class="drawer-row-l">Volume total</span>
      <span class="drawer-row-v">1.240 L</span>
    </div>
  </div>
</div>
```

| Classe | CSS |
|--------|-----|
| `.drawer-overlay` | `position: fixed; inset: 0; background: hsl(222 47% 11% / 0.4); opacity: 0; pointer-events: none; transition: opacity 0.18s; z-index: 40` |
| `.drawer-overlay.open` | `opacity: 1; pointer-events: auto` |
| `.drawer` | `position: fixed; right: 0; top: 0; bottom: 0; width: 420px; max-width: 92vw; background: hsl(var(--card)); border-left: 1px solid hsl(var(--border)); box-shadow: var(--shadow-md); transform: translateX(100%); transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1); z-index: 41` |
| `.drawer.open` | `transform: translateX(0)` |
| `.drawer-head` | `padding: 18px 20px; border-bottom: 1px solid hsl(var(--border)); display: flex; align-items: center; gap: 10px` |
| `.drawer-title` | `font-size: 15px; font-weight: 600; flex: 1; display: flex; align-items: center; gap: 10px` |
| `.drawer-body` | `flex: 1; overflow-y: auto; padding: 20px` |
| `.drawer-row` | `display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid hsl(var(--border)); font-size: 13px` |
| `.drawer-row-l` | `color: hsl(var(--muted-foreground))` |
| `.drawer-row-v` | `font-weight: 600; font-variant-numeric: tabular-nums` |

---

## Gráficos

### Sparkline (SVG inline — sem biblioteca)

Implementado em `charts.js` (`svgSpark()`) e na KpiCard.

- ViewBox: `0 0 200 60`
- Curva comprimida à metade inferior (`H * 0.45`)
- Path suavizado com cubic-bezier (controle horizontal: `x0 + (x1-x0) * 0.5`)
- Fill: cor do segmento com `fill-opacity: 0.22`
- Stroke: `stroke-width: 1.4`, `stroke-linecap: round`, `stroke-linejoin: round`
- No KpiCard: `.kpi-spark { position: absolute; left: -2px; right: -2px; top: 0; bottom: -1px; opacity: 0.28; pointer-events: none; z-index: 0 }`

---

### Donut

| Classe | CSS |
|--------|-----|
| `.donut-wrap` | `position: relative; width: 180px; height: 180px; margin: 8px auto` |
| `.donut-center` | `position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; pointer-events: none` |
| `.donut-center-l` | `font-size: 10px; font-weight: 600; letter-spacing: 0.8px; color: hsl(var(--muted-foreground)); text-transform: uppercase` |
| `.donut-center-v` | `font-size: 14px; font-weight: 600; margin-top: 2px; font-variant-numeric: tabular-nums` |
| `.donut-legend` | `display: grid; grid-template-columns: 1fr 1fr; gap: 10px 14px; margin-top: 16px` |
| `.dl-row` | `display: flex; align-items: center; gap: 8px` |
| `.dl-dot` | `width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0` |
| `.dl-name` | `flex: 1; font-size: 12px; color: hsl(var(--muted-foreground))` |
| `.dl-pct` | `font-size: 12px; font-weight: 600; font-variant-numeric: tabular-nums` |

---

### Heatmap

| Classe | CSS |
|--------|-----|
| `.heat-wrap` | `display: flex; gap: 8px` |
| `.heat-days` | `display: flex; flex-direction: column; gap: 5px; padding-top: 22px` |
| `.heat-day` | `height: 36px; font-size: 11px; color: hsl(var(--muted-foreground)); display: flex; align-items: center` |
| `.heat-grid` | `flex: 1; display: flex; flex-direction: column; gap: 5px` |
| `.heat-row` | `display: flex; gap: 5px` |
| `.heat-head` | `display: flex; gap: 5px; margin-bottom: 4px` |
| `.heat-wk` | `flex: 1; text-align: center; font-size: 10px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase` |
| `.heat-cell` | `flex: 1; height: 36px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; font-variant-numeric: tabular-nums; transition: transform 0.1s` — hover: `scale(1.05)` |
| `.heat-legend` | `display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 10px` |
| `.legend-bar` | `flex: 1; height: 6px; margin: 0 10px; border-radius: 999px; background: linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--primary)))` |

---

### ChartBox

| Classe | CSS |
|--------|-----|
| `.chart-box` | `position: relative; height: 280px` |
| `.chart-box.tall` | `height: 320px` |
| `.chart-box.short` | `height: 200px` |

---

### Layouts de linha (grid de seções)

| Classe | CSS | Breakpoint |
|--------|-----|------------|
| `.row` | `display: grid; gap: var(--gap-grid)` | — |
| `.row-2-1` | `grid-template-columns: 2fr 1fr` | `≤1180px` → `1fr` |
| `.row-1-1` | `grid-template-columns: 1fr 1fr` | `≤1180px` → `1fr` |
| `.row-3-2` | `grid-template-columns: 3fr 2fr` | `≤1180px` → `1fr` |

---

## Específicos por Página

### DRE

| Classe | CSS |
|--------|-----|
| `.dre-toolbar` | `display: flex; align-items: center; gap: 12px` — na topbar, substitui o `.segment` de período |
| `.dre-month-btn` | `width: 34px; height: 34px; border: 1px solid hsl(var(--border)); border-radius: 6px; background: hsl(var(--card)); cursor: pointer` — hover: `background: hsl(var(--muted)); border-color: hsl(var(--ring) / 0.5)` |
| `.dre-month-btn svg` | `width: 14px; height: 14px` |
| `.dre-month-label` | `font-size: 16px; font-weight: 600; min-width: 110px; text-align: center` |
| `.dre-row td` | `padding: 12px 14px` |
| `.dre-row-total td` | `border-top: 2px solid hsl(var(--border)); font-weight: 600; background: hsl(var(--muted) / 0.4)` |
| `.dre-row-result td` | `border-top: 2px solid hsl(var(--success) / 0.3); background: hsl(var(--success-subtle)); font-weight: 700; color: hsl(var(--success))` — dark: `color: hsl(140 70% 60%)` |

---

### Sync

| Classe | CSS |
|--------|-----|
| `.sync-grid` | `display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid)` |
| `.sync-card` | `padding: var(--pad-card)` |
| `.sync-status-row` | `display: flex; align-items: center; gap: 10px; margin-top: 12px` |
| `.sync-stat` | `font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px` |
| `.sync-stat b` | `color: hsl(var(--foreground)); font-weight: 600` |
| `.sync-list` | `display: flex; flex-direction: column` |
| `.sync-row` | `display: flex; align-items: center; gap: 14px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--border)); font-size: 12px` |
| `.sync-time` | `color: hsl(var(--muted-foreground)); font-family: 'Geist Mono', monospace; font-size: 11px; min-width: 130px` |
| `.sync-loc` | `font-weight: 500; min-width: 130px` |
| `.sync-recs` | `margin-left: auto; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums` |

---

### Settings

| Classe | CSS |
|--------|-----|
| `.cfg-grid` | `display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid)` |
| `.cfg-row` | `display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid hsl(var(--border))` |
| `.cfg-label` | `font-size: 12px; color: hsl(var(--muted-foreground))` |
| `.cfg-value` | `font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px` |
| `.cfg-loc-list` | `display: flex; flex-direction: column` |
| `.cfg-loc-row` | `display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--border))` |
| `.cfg-loc-avatar` | `width: 32px; height: 32px; border-radius: 6px; background: hsl(var(--primary-subtle)); color: hsl(var(--primary)); font-size: 11px; font-weight: 600; flex-shrink: 0` |
| `.cfg-loc-name` | `font-size: 13px; font-weight: 500` |
| `.cfg-loc-meta` | `font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px` |

---

## Scrollbar customizada

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
```

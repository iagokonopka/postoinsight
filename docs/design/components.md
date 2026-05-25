# PostoInsight — Catálogo de Componentes

> Fonte de verdade: `docs/design/PostoInsight/PostoInsight.html` (CSS) + `app.js` (lógica) + `charts.js` (gráficos).
> Valores exatos — sem aproximações. Para cada componente: estrutura, classes CSS, variantes e regras de comportamento.

---

## 1. Layout

### AppShell

```
body (display: flex; overflow: hidden; height: 100%)
  <Sidebar />           240px, flex-shrink: 0
  <div.main>            flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden
    <Topbar />          flex-shrink: 0
    <div.content>       flex: 1; overflow-y: auto; padding: 24px
      {página ativa}
    </div>
  </div>
  <DrawerOverlay />     position: fixed, z-index: 40
  <Drawer />            position: fixed, z-index: 41
  <Toast />             position: fixed, z-index: 50
```

**Regras:**
- `body`: `display: flex; overflow: hidden` — layout horizontal, sem scroll no body
- `.content` é o **único** elemento com scroll vertical (`overflow-y: auto`)
- Drawer, Toast e DrawerOverlay são os únicos elementos com `position: fixed`

---

### Sidebar

```css
.sidebar {
  width: 240px; flex-shrink: 0;
  background: hsl(var(--sidebar));
  color: hsl(var(--sidebar-foreground));
  display: flex; flex-direction: column;
  border-right: 1px solid hsl(var(--sidebar-muted) / 0.5);
}
```

#### Logo

```css
.sb-logo {
  display: flex; align-items: center; gap: 10px;
  padding: 18px 20px;
  border-bottom: 1px solid hsl(var(--sidebar-muted) / 0.6);
}
.sb-logo-name { font-size: 14px; font-weight: 600; letter-spacing: -0.2px; }
.sb-logo-tag  { display: block; font-size: 10px; font-weight: 500; letter-spacing: 0.4px; margin-top: 1px;
                color: hsl(var(--sidebar-foreground) / 0.5); }
```

SVG do logo: 30×30px, viewBox "0 0 32 32", `<rect rx="8" fill="url(#g1)"/>` (gradiente `#0073BB` → `#005f99`), path "P" + círculo branco.

#### Nav

```css
.sb-nav { padding: 16px 12px; display: flex; flex-direction: column; gap: 20px; flex: 1; overflow-y: auto; }
.sb-section-label {
  font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase;
  color: hsl(var(--sidebar-foreground) / 0.4);
  padding: 0 8px; margin-bottom: 4px;
}
.sb-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px;
  font-size: 13px; font-weight: 500; color: hsl(var(--sidebar-foreground) / 0.7);
  background: transparent; border: none; width: 100%; text-align: left;
  transition: background 0.12s, color 0.12s; position: relative; cursor: pointer;
}
.sb-item:hover { background: hsl(var(--sidebar-muted) / 0.6); color: hsl(var(--sidebar-foreground)); }
.sb-item.active { background: hsl(var(--sidebar-active-bg)); color: hsl(var(--sidebar-foreground)); }
.sb-item.active::before {
  content: ''; position: absolute; left: 0; top: 6px; bottom: 6px;
  width: 2.5px; background: hsl(var(--sidebar-active)); border-radius: 2px;
}
.sb-item svg { width: 14px; height: 14px; stroke-width: 1.6; opacity: 0.85; }
.sb-item.active svg { color: hsl(var(--sidebar-active)); opacity: 1; }
```

**Badge inline** (ex: "OK" em Sincronização):
```css
.sb-badge {
  margin-left: auto; font-size: 9px; font-weight: 600; letter-spacing: 0.4px;
  padding: 2px 6px; border-radius: 999px;
  background: hsl(var(--sidebar-foreground) / 0.1);
  color: hsl(var(--sidebar-foreground) / 0.8);
}
```

#### Footer (tenant)

```css
.sb-footer { padding: 12px; border-top: 1px solid hsl(var(--sidebar-muted) / 0.6); }
.sb-tenant { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px; }
.sb-tenant-icon {
  width: 28px; height: 28px; border-radius: 6px;
  background: linear-gradient(135deg, #0073BB, #6B40C4);
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: white;
}
.sb-tenant-name { font-size: 12px; font-weight: 500; }
.sb-tenant-role { font-size: 10px; color: hsl(var(--sidebar-foreground) / 0.5); }
```

#### Itens de navegação (React — rotas reais)

| Seção | Label | Rota |
|-------|-------|------|
| Análise | Visão Geral | `/` |
| Análise | Combustível | `/combustivel` |
| Análise | Arla 32 | `/arla` |
| Análise | Lubrificantes | `/lubrificantes` |
| Análise | Conveniência | `/conveniencia` |
| Financeiro | DRE Mensal | `/dre` |
| Operação | Sincronização | `/sync` (badge "OK") |
| Operação | Configurações | `/settings` |

> O HTML de referência tem 4 itens de análise (sem Arla/Lubrificantes) e chama a seção financeira de "Análise". A implementação React tem 5 itens de análise + seção "Financeiro" separada — esta é a estrutura **correta** por decisão de produto.

---

### Topbar

```css
.topbar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 24px;
  background: hsl(var(--card)); border-bottom: 1px solid hsl(var(--border));
  flex-shrink: 0;
}
.crumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: hsl(var(--muted-foreground)); white-space: nowrap; flex-shrink: 0; }
.crumb b { color: hsl(var(--foreground)); font-weight: 600; }
.crumb svg { width: 12px; height: 12px; opacity: 0.5; }
.topbar-right { margin-left: auto; display: flex; align-items: center; gap: 8px; }
```

**Responsivo:**
- `@media (max-width: 1100px)`: `.crumb svg` e `#crumb-context` ocultos
- `@media (max-width: 980px)`: `.crumb` inteiro oculto

**Visibilidade dos controles por rota:**

| Rota | Period tabs | DRE toolbar | Location select | Btn Sync |
|------|------------|-------------|-----------------|----------|
| `/` | ✅ | ❌ | ✅ | ✅ |
| `/combustivel` | ✅ | ❌ | ✅ | ✅ |
| `/arla` | ✅ | ❌ | ✅ | ❌ |
| `/lubrificantes` | ✅ | ❌ | ✅ | ❌ |
| `/conveniencia` | ✅ | ❌ | ✅ | ❌ |
| `/dre` | ❌ | ✅ | ✅ | ❌ |
| `/sync` | ❌ | ❌ | ❌ | ❌ |
| `/settings` | ❌ | ❌ | ❌ | ❌ |

---

### ContentArea

```css
.content { flex: 1; overflow-y: auto; padding: 24px; }
.page { display: none; flex-direction: column; gap: var(--gap-row); }
.page.active { display: flex; }
.page-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.page-title { font-size: 22px; font-weight: 600; letter-spacing: -0.3px; line-height: 1.2; }
.page-sub { font-size: 13px; color: hsl(var(--muted-foreground)); margin-top: 4px; }
.page-actions { display: flex; align-items: center; gap: 8px; }
```

---

## 2. Controles

### Button

```css
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px; border-radius: 6px;
  font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer; border: 1px solid transparent;
  transition: background 0.12s, border-color 0.12s, opacity 0.12s; white-space: nowrap;
}
.btn svg { width: 14px; height: 14px; stroke-width: 1.8; }

.btn-outline { background: hsl(var(--card)); color: hsl(var(--foreground)); border-color: hsl(var(--border)); }
.btn-outline:hover { background: hsl(var(--muted)); }

.btn-primary { background: hsl(var(--primary)); color: hsl(var(--primary-foreground)); }
.btn-primary:hover { opacity: 0.92; }

.btn-ghost { background: transparent; color: hsl(var(--muted-foreground)); }
.btn-ghost:hover { background: hsl(var(--muted)); color: hsl(var(--foreground)); }

.btn-icon { width: 34px; padding: 0; justify-content: center; }
.btn-sm { height: 28px; padding: 0 10px; font-size: 12px; }
.btn-sm svg { width: 12px; height: 12px; }
```

---

### Select / Input

```css
select.input, .input {
  height: 34px; padding: 0 28px 0 12px; border-radius: 6px;
  border: 1px solid hsl(var(--input));
  background: hsl(var(--card)); color: hsl(var(--foreground));
  font: inherit; font-size: 13px; cursor: pointer; outline: none; appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron stroke #64748b */
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color 0.12s, box-shadow 0.12s;
}
select.input:focus, .input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.15);
}
```

---

### SegmentedControl

```css
.segment { display: inline-flex; padding: 3px; background: hsl(var(--muted)); border-radius: 7px; gap: 2px; }
.segment button {
  height: 28px; padding: 0 12px; border: none; background: transparent;
  font: inherit; font-size: 12px; font-weight: 500;
  color: hsl(var(--muted-foreground)); border-radius: 5px; cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.segment button:hover { color: hsl(var(--foreground)); }
.segment button.active { background: hsl(var(--card)); color: hsl(var(--foreground)); box-shadow: var(--shadow-sm); }
```

Comportamento: ao clicar, remove `.active` de todos e adiciona no clicado. Sem animação de "thumb" deslizante (diferente do tweaks panel).

---

### DRE Toolbar (topbar especial)

```css
.dre-toolbar { display: flex; align-items: center; gap: 12px; }
.dre-month-btn {
  width: 34px; height: 34px; border: 1px solid hsl(var(--border)); border-radius: 6px;
  background: hsl(var(--card)); color: hsl(var(--muted-foreground));
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.dre-month-btn:hover { color: hsl(var(--foreground)); border-color: hsl(var(--ring) / 0.5); background: hsl(var(--muted)); }
.dre-month-btn svg { width: 14px; height: 14px; }
```

Composto de: `← btn` + `select[month] (min-width: 130px)` + `select[year] (min-width: 90px)` + `→ btn`

---

### Avatar

```css
.avatar {
  width: 32px; height: 32px; border-radius: 999px;
  background: linear-gradient(135deg, #0073BB, #6B40C4);
  color: white; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
```

---

## 3. Cards

### SectionCard

```css
.card {
  background: hsl(var(--card)); color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border)); border-radius: var(--radius); box-shadow: var(--shadow-sm);
}
.card-h {
  padding: var(--pad-card-y) var(--pad-card) 8px;
  display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
}
.card-b { padding: 0 var(--pad-card) var(--pad-card-y); }
.card-title { font-size: 13px; font-weight: 600; letter-spacing: -0.1px; }
.card-desc  { font-size: 12px; color: hsl(var(--muted-foreground)); margin-top: 3px; }
```

Slot direito do `.card-h`: segment control, botão ou vazio. O `.card-h` usa `justify-content: space-between` — o slot direito vai para a direita automaticamente.

Quando há `border-bottom` no `.card-h` (Locations, Usuários, Histórico):
```html
<div class="card-h" style="border-bottom: 1px solid hsl(var(--border));">
```

---

### KpiCard

```css
.kpi {
  position: relative; background: hsl(var(--card));
  border: 1px solid hsl(var(--border)); border-radius: var(--radius);
  padding: var(--kpi-pad); box-shadow: var(--shadow-sm);
  overflow: hidden; display: flex; flex-direction: column; min-height: 116px;
}
.kpi-label {
  font-size: 11px; font-weight: 500; color: hsl(var(--muted-foreground));
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: relative; z-index: 1;
}
.kpi-label svg { width: 12px; height: 12px; opacity: 0.7; }
.kpi-value {
  font-size: var(--kpi-val-size); font-weight: 600; letter-spacing: -0.6px;
  color: hsl(var(--foreground)); margin: 6px 0 8px; line-height: 1.1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: relative; z-index: 1;
}
.kpi-deltas { display: flex; flex-direction: column; gap: 2px; font-size: 11px; margin-top: auto; position: relative; z-index: 1; }
.kpi-delta-row { display: flex; align-items: center; gap: 6px; }
.kpi-delta-label { font-size: 11px; color: hsl(var(--muted-foreground)); white-space: nowrap; text-transform: lowercase; }
.kpi-spark {
  position: absolute; left: -2px; right: -2px; top: 0; bottom: -1px;
  height: auto; opacity: 0.28; pointer-events: none; z-index: 0;
}
html.dark .kpi-spark { opacity: 0.38; }
html.no-spark .kpi-spark { display: none !important; }
html.no-spark .kpi { min-height: auto; }
```

#### DeltaTag

```tsx
function DeltaTag({ value, isPP }: { value: number; isPP?: boolean }) {
  const unit = isPP ? ' p.p.' : '%';
  if (Math.abs(value) < 0.15)
    return <span className="delta-neu">→ {value.toFixed(1).replace('.', ',')}{unit}</span>;
  const cls = value >= 0 ? 'delta-pos' : 'delta-neg';
  const arrow = value >= 0 ? '↑' : '↓';
  return <span className={cls}>{arrow} {Math.abs(value).toFixed(1).replace('.', ',')}{unit}</span>;
}
```

```css
.delta-pos { color: hsl(var(--success)); }
.delta-neg { color: hsl(var(--danger)); }
.delta-neu { color: hsl(var(--muted-foreground)); }
```

#### Grids de KPI

```css
.kpi-grid { display: grid; gap: var(--gap-grid); }
.kpi-5 { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.kpi-4 { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.kpi-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
@media (min-width: 1280px) { .kpi-5 { grid-template-columns: repeat(5, minmax(0,1fr)); } }
@media (min-width: 1100px) { .kpi-4 { grid-template-columns: repeat(4, minmax(0,1fr)); } }
```

---

## 4. Tabelas

### DataTable

```css
.tbl-wrap { overflow-x: auto; }
table.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl thead tr { border-bottom: 1px solid hsl(var(--border)); }
.tbl th {
  padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 500;
  color: hsl(var(--muted-foreground)); white-space: nowrap; letter-spacing: 0.1px;
}
.tbl th:first-child, .tbl td:first-child { padding-left: 20px; }
.tbl th:last-child,  .tbl td:last-child  { padding-right: 20px; }
.tbl th.r, .tbl td.r { text-align: right; font-variant-numeric: tabular-nums; }
.tbl th.sortable { cursor: pointer; user-select: none; }
.tbl th.sortable:hover { color: hsl(var(--foreground)); }
.tbl td {
  padding: var(--row-pad-y) 14px; /* 11px normal, 8px compact */
  color: hsl(var(--foreground)); border-bottom: 1px solid hsl(var(--border)); vertical-align: middle;
}
.tbl tbody tr:last-child td { border-bottom: 0; }
.tbl tbody tr.clickable { cursor: pointer; }
.tbl tbody tr.clickable:hover td { background: hsl(var(--muted) / 0.6); }
.tbl tfoot td {
  border-top: 1px solid hsl(var(--border)); border-bottom: 0;
  font-weight: 600; padding: 12px 14px; background: hsl(var(--muted) / 0.4);
}
```

### Elementos de célula

```css
/* Rank */
.row-rank { font-size: 12px; font-weight: 500; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; }

/* Segmento com dot colorido */
.seg-cell { display: flex; align-items: center; gap: 10px; }
.seg-dot  { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }

/* Barra de progresso inline */
.bar-cell  { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.bar-track { flex: 1; height: 5px; background: hsl(var(--muted)); border-radius: 999px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 999px; background: hsl(var(--primary)); }
.bar-num   { font-size: 11px; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; min-width: 38px; text-align: right; }

/* Sparkline inline em tabela (canvas Recharts mini ou SVG) */
.spark-cell        { display: flex; align-items: center; gap: 8px; min-width: 110px; }
.spark-cell canvas { width: 72px !important; height: 22px !important; flex-shrink: 0; }

/* Trend indicators */
.trend-up   { color: hsl(var(--success)); font-size: 11px; font-weight: 600; }
.trend-down { color: hsl(var(--danger));  font-size: 11px; font-weight: 600; }
.trend-flat { color: hsl(var(--muted-foreground)); font-size: 11px; }
```

**Lógica trend:** `trend > 0.02 → ↑ trend-up` | `trend < -0.02 → ↓ trend-down` | senão `→ trend-flat`

### DRE — linhas especiais

```css
.dre-row td { padding: 12px 14px; }
.dre-row-total td {
  border-top: 2px solid hsl(var(--border));
  font-weight: 600; background: hsl(var(--muted) / 0.4);
}
.dre-row-result td {
  border-top: 2px solid hsl(var(--success) / 0.3);
  background: hsl(var(--success-subtle));
  font-weight: 700; color: hsl(var(--success));
}
html.dark .dre-row-result td { color: hsl(140 70% 60%); }
```

---

## 5. Grids de Layout

```css
.row { display: grid; gap: var(--gap-grid); }
.row-2-1 { grid-template-columns: 2fr 1fr; }
.row-1-1 { grid-template-columns: 1fr 1fr; }
.row-3-2 { grid-template-columns: 3fr 2fr; }
@media (max-width: 1180px) {
  .row-2-1, .row-1-1, .row-3-2 { grid-template-columns: 1fr; }
}
```

```css
.chart-box       { position: relative; height: 280px; }
.chart-box.tall  { height: 320px; }
.chart-box.short { height: 200px; }
```

---

## 6. Feedback

### Badge

```css
.badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 500;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--muted)); color: hsl(var(--foreground));
  white-space: nowrap;
}
.badge-success { background: hsl(var(--success-subtle)); color: hsl(var(--success)); border-color: hsl(var(--success) / 0.3); }
.badge-warning { background: hsl(var(--warning-subtle)); color: hsl(var(--warning)); border-color: hsl(var(--warning) / 0.3); }
.badge-danger  { background: hsl(var(--danger-subtle));  color: hsl(var(--danger));  border-color: hsl(var(--danger) / 0.3); }
.badge-primary { background: hsl(var(--primary-subtle)); color: hsl(var(--primary)); border-color: hsl(var(--primary) / 0.3); }
.badge-soft    { background: hsl(var(--muted)); color: hsl(var(--muted-foreground)); border: none; }
```

### StatusDot

```css
.sync-dot { width: 10px; height: 10px; border-radius: 999px; flex-shrink: 0; position: relative; }
.sync-dot.ok   { background: hsl(var(--success)); }
.sync-dot.ok::after {
  content: ''; position: absolute; inset: -3px; border-radius: 999px;
  border: 2px solid hsl(var(--success) / 0.3);
  animation: pulse 2s infinite;
}
.sync-dot.warn { background: hsl(var(--warning)); }
.sync-dot.err  { background: hsl(var(--danger)); }
@keyframes pulse { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.8); opacity: 0; } }
```

Na tabela de histórico (sync-row): dot é 8×8px (sem a classe `.sync-dot` — inline style `width:8px;height:8px`).

### EmptyState

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  text-align: center; padding: 40px 24px;
  color: hsl(var(--muted-foreground));
  border: 1.5px dashed hsl(var(--border)); border-radius: var(--radius);
  background: hsl(var(--muted) / 0.3);
}
.empty-icon  { width: 40px; height: 40px; border-radius: 999px; background: hsl(var(--muted)); display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
.empty-title { font-size: 14px; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 4px; }
.empty-desc  { font-size: 12px; max-width: 320px; }
```

### Toast

```css
.toast {
  position: fixed; right: 24px; bottom: 24px;
  background: hsl(var(--card)); border: 1px solid hsl(var(--border));
  border-radius: var(--radius); box-shadow: var(--shadow-md);
  padding: 12px 16px; display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: hsl(var(--foreground)); z-index: 50;
  transform: translateY(20px); opacity: 0;
  transition: transform 0.2s, opacity 0.2s;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-icon { width: 18px; height: 18px; }
.toast.success .toast-icon { color: hsl(var(--success)); }
.toast.info    .toast-icon { color: hsl(var(--primary)); }
```

**Comportamento:** `requestAnimationFrame(() => toast.classList.add('show'))` → após 2800ms: `classList.remove('show')`.

### Spinner

```css
.spinner {
  width: 14px; height: 14px;
  border: 2px solid hsl(var(--muted));
  border-top-color: hsl(var(--primary));
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
@keyframes spin { to { transform: rotate(360deg); } }
```

Usado no botão Sincronizar durante os 1800ms de loading: conteúdo trocado para `<spinner /> Sincronizando…`.

---

## 7. Overlay

### Drawer

```css
.drawer-overlay {
  position: fixed; inset: 0;
  background: hsl(222 47% 11% / 0.4); /* literal — não usa var() */
  opacity: 0; pointer-events: none;
  transition: opacity 0.18s; z-index: 40;
}
.drawer-overlay.open { opacity: 1; pointer-events: auto; }

.drawer {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 420px; max-width: 92vw;
  background: hsl(var(--card)); border-left: 1px solid hsl(var(--border));
  box-shadow: var(--shadow-md);
  transform: translateX(100%);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 41; display: flex; flex-direction: column; overflow: hidden;
}
.drawer.open { transform: translateX(0); }

.drawer-head { padding: 18px 20px; border-bottom: 1px solid hsl(var(--border)); display: flex; align-items: center; gap: 10px; }
.drawer-title { font-size: 15px; font-weight: 600; flex: 1; display: flex; align-items: center; gap: 10px; }
.drawer-body  { flex: 1; overflow-y: auto; padding: 20px; }
.drawer-row   { display: flex; align-items: center; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid hsl(var(--border)); font-size: 13px; }
.drawer-row:last-child { border-bottom: 0; }
.drawer-row-l { color: hsl(var(--muted-foreground)); }
.drawer-row-v { font-weight: 600; font-variant-numeric: tabular-nums; }
```

**Fechar:** clicar no overlay OU no botão X (`.btn-ghost.btn-icon.btn-sm`).

**Título:** inclui `.seg-dot` colorido (14×14px, border-radius 3px) + texto do segmento/categoria.

#### Conteúdo do drawer — Segmentos (Visão Geral)

```
grid 2 colunas, gap 12px, margin-bottom 18px:
  Box "Receita": label 10px uppercase + valor 18px font-weight 600
  Box "Margem %": label 10px uppercase + valor 18px font-weight 600

"COMPOSIÇÃO" — 12px, uppercase, letter-spacing 1px, margin-bottom 10px
  drawer-rows: "{nome}" → "{pct}% · R$ {valor}"

"POR UNIDADE" — mesmo formato de header
  drawer-rows: JAM Centro/Rodovia/Norte/Sul → R$ {valor}
```

Boxes de KPI: `background: hsl(var(--muted) / 0.5); padding: 12px; border-radius: 8px`

#### Conteúdo do drawer — Categorias (Conveniência)

```
"PRODUTOS ({n})" — 12px, uppercase, letter-spacing 1px, margin-bottom 10px

Por produto (list):
  [display: flex; flex-direction: column; gap: 6px; padding: 12px 0; border-bottom]
    row: nome (13px, font-weight 500) | receita (13px, font-weight 600)
    row: barra (flex:1, height 4px, bg color do grupo) | qtd (min-width 50px, right) | margem% (min-width 50px, right, success se ≥50%) | trend (min-width 42px, right)
```

---

## 8. Gráficos

### Sparkline SVG (KpiCard)

Implementar em React como SVG inline puro — **sem Recharts**.

```tsx
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 200, H = 60;
  const min = Math.min(...data), max = Math.max(...data);
  const range = (max - min) || 1;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map(v => H - 4 - ((v - min) / range) * (H * 0.45)); // bottom 45%

  let path = `M ${xs[0]},${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cpx = xs[i-1] + (xs[i] - xs[i-1]) * 0.5;
    path += ` C ${cpx},${ys[i-1]} ${cpx},${ys[i]} ${xs[i]},${ys[i]}`;
  }
  const area = `${path} L ${W},${H} L 0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
         width="100%" height="100%" style={{ display: 'block' }}>
      <path d={area} fill={color} fillOpacity={0.22} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.4}
            strokeLinejoin="round" strokeLinecap="round"
            vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
```

**Crítico:** `viewBox="0 0 200 60"`, `preserveAspectRatio="none"`, curva no bottom 45%.

### TinySparkline (células de tabela)

Canvas 72×22px renderizado via Recharts `<LineChart>` sem eixos, ou SVG inline simplificado.

```tsx
// Recharts — mantainAspectRatio: false, width=72, height=22
<LineChart width={72} height={22} data={data.map(v => ({ v }))}>
  <Line type="monotone" dataKey="v" stroke={color}
        strokeWidth={1.4} dot={false} isAnimationActive={false} />
</LineChart>
```

### Donut (Recharts)

```tsx
<PieChart width={180} height={180}>
  <Pie data={items} dataKey="value" cx="50%" cy="50%"
       innerRadius="72%" outerRadius="100%"
       strokeWidth={2} stroke={surfaceColor}>  {/* surfaceColor = hsl(var(--card)) */}
    {items.map((item, i) => <Cell key={i} fill={item.color} />)}
  </Pie>
  <Tooltip ... />
</PieChart>
```

Legenda: usar `.donut-legend` customizado — **não** a legend nativa do Recharts.

Dot da legenda: `.dl-dot` = 8×8px, border-radius **2px** (quadrado, não círculo).

### LineAreaChart (Visão Geral — Receita & Margem)

Equivalente ao `revenueDual()` de charts.js:

- **3 datasets:** Receita Bruta (area #0073BB), Margem Bruta (area #16a34a), Margem % (line dashed #EC7211, eixo direito, **hidden por padrão**)
- Gradientes: `color + '80'` → `color + '10'` em direção Y
- `interaction.mode: 'index'` — tooltip de todas as séries no mesmo ponto
- Legend: position bottom, `iconType: 'circle'`, 11px, `color: token.tick`
- Eixo Y esquerdo: `callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k'`
- Eixo Y direito: `callback: v => v + '%'`, `display: 'auto'`
- Grid: sem linha no eixo X (`display: false`), grid lines Y visíveis
- Sem `axisLine` (NOBDR), sem `tickLine`

### MultiLineChart (Combustível — Evolução; DRE — Margem %)

Equivalente ao `combLines()` e `marginEvolution()`:

- Paleta sequencial: `[#0073BB, #EC7211, #6B40C4, #1D8102, #0891b2, #db2777]`
- `fill: true` → stacked area com gradientes | `fill: false` → multi-line limpo
- DRE margin evo: `pointRadius: 3`, `pointHoverRadius: 5`, `fill: false`
- Combustível: `fill: true`, `pointRadius: 0`

### ConvAreaChart (Conveniência — Receita × Margem)

Equivalente ao `convArea()`:

- Receita: `#EC7211` com gradiente
- Margem Bruta: `#16a34a` com gradiente
- Ambos `fill: 'origin'`, sem pontos

### WaterfallChart (DRE)

Equivalente ao `waterfall()`:

```
items = [
  { label: 'Receita Bruta', type: 'start',  value: cur.receita  } → barra azul   (#0073BB)
  { label: '(−) Descontos', type: 'minus',  value: cur.desconto } → barra vermelha (#dc2626)
  { label: '(−) CMV',       type: 'minus',  value: cur.cmv      } → barra vermelha (#dc2626)
  { label: 'Margem Bruta',  type: 'total',  value: cur.margem   } → barra verde   (#16a34a)
]
```

Implementação: BarChart com dataset "helper" transparente para offset + dataset de positivos + dataset de negativos.

- `borderRadius: 4`, `maxBarThickness: 28`, `minBarLength: 4` (pos) / `10` (neg)
- Stacked bars: `stack: 'wf'`

### ScatterQuadrants (Conveniência — Matriz de Categorias)

Equivalente ao `scatterQuadrants()`:

- BubbleChart (Recharts `ScatterChart` com `r` como `z`)
- Raio das bolhas: `Math.max(5, Math.sqrt(rev / 200))`
- Quadrantes: plugin de desenho custom (canvas `beforeDraw`)
  - top-right (ESTRELAS): `rgba(22,163,74,0.04)`
  - bottom-left (CAIXA): `rgba(220,38,38,0.04)`
  - Linhas medianas: dashed `[3,3]`, cor `token.tick + '66'`
  - Labels: 9.5px, font-weight 600, texto em maiúsculas
- X-axis title: "Quantidade vendida" — Y-axis title: "Margem %"
- Sem legend nativa

---

## 9. Específicos por Página

### Heatmap (Visão Geral)

```css
.heat-wrap  { display: flex; gap: 8px; }
.heat-days  { display: flex; flex-direction: column; gap: 5px; padding-top: 22px; }
.heat-day   { height: 36px; font-size: 11px; color: hsl(var(--muted-foreground)); display: flex; align-items: center; }
.heat-grid  { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.heat-row   { display: flex; gap: 5px; }
.heat-head  { display: flex; gap: 5px; margin-bottom: 4px; }
.heat-wk    { flex: 1; text-align: center; font-size: 10px; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
.heat-cell  { flex: 1; height: 36px; border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500; font-variant-numeric: tabular-nums; transition: transform 0.1s; }
.heat-cell:hover { transform: scale(1.05); }
.heat-legend { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 10px; color: hsl(var(--muted-foreground)); }
.legend-bar  { flex: 1; height: 6px; margin: 0 10px; border-radius: 999px; background: linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--primary))); }
```

Estrutura: cabeçalho `S1 S2 S3 S4` (com `padding-left: 42px`) + `.heat-wrap` com `.heat-days` (Dom..Sáb) + `.heat-grid` (7 linhas × 4 colunas).

Cor das células:
```ts
const t = (value - min) / (max - min);
const alpha = 0.08 + t * 0.92;
style.background = `hsl(204 100% 37% / ${alpha})`;
style.color = t > 0.55 ? '#fff' : 'hsl(var(--foreground))';
```

### Sync cards

```css
.sync-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid); }
.sync-card { padding: var(--pad-card); }
.sync-status-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
.sync-stat { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
.sync-stat b { color: hsl(var(--foreground)); font-weight: 600; }
.sync-list { display: flex; flex-direction: column; }
.sync-row { display: flex; align-items: center; gap: 14px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--border)); font-size: 12px; }
.sync-row:last-child { border-bottom: 0; }
.sync-time { color: hsl(var(--muted-foreground)); font-family: 'Geist Mono', monospace; font-size: 11px; min-width: 130px; }
.sync-loc  { font-weight: 500; min-width: 130px; }
.sync-recs { margin-left: auto; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; }
```

### Settings cards

```css
.cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid); }
.cfg-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid hsl(var(--border)); }
.cfg-row:last-child { border-bottom: 0; }
.cfg-label { font-size: 12px; color: hsl(var(--muted-foreground)); }
.cfg-value { font-size: 13px; font-weight: 500; display: flex; align-items: center; gap: 8px; }
.cfg-loc-list { display: flex; flex-direction: column; }
.cfg-loc-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--border)); }
.cfg-loc-row:last-child { border-bottom: 0; }
.cfg-loc-avatar { width: 32px; height: 32px; border-radius: 6px; background: hsl(var(--primary-subtle)); color: hsl(var(--primary)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.cfg-loc-name { font-size: 13px; font-weight: 500; }
.cfg-loc-meta { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
```

Avatar owner (usuário com role `owner`): `background: linear-gradient(135deg, #0073BB, #6B40C4); color: white`

---

## 10. Scrollbar customizada

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
```

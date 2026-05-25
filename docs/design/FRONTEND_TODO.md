# Frontend — To-Do de Fidelidade Visual

> **Objetivo único:** o app React deve ser visualmente indistinguível do HTML de referência.
> Abrir os dois lado a lado. Se houver diferença visível → é um bug.
>
> **Fonte de verdade:** `docs/design/PostoInsight/PostoInsight.html` + `app.js` + `charts.js`
> Antes de implementar qualquer item: ler o trecho correspondente no HTML. Copiar. Não interpretar.

---

## Bloco 0 — globals.css (tokens, body, scrollbar)

**Referência:** HTML `<style>` linhas 15–610

### CSS Custom Properties (HSL — não hex)

Todas as variáveis ficam em `:root`. Mapear para `@theme inline` do Tailwind v4 E manter como `var()` nativo para uso em `style={}`.

```css
/* Light mode (:root) */
--background:          210 40% 98%;
--foreground:          222 47% 11%;
--card:                0 0% 100%;
--card-foreground:     222 47% 11%;
--popover:             0 0% 100%;
--popover-foreground:  222 47% 11%;
--sidebar:             217 33% 17%;
--sidebar-foreground:  210 40% 96%;
--sidebar-muted:       215 25% 27%;
--sidebar-active:      204 100% 47%;
--sidebar-active-bg:   229 60% 8%;
--primary:             204 100% 37%;
--primary-foreground:  0 0% 100%;
--primary-subtle:      204 100% 95%;
--secondary:           210 40% 96%;
--secondary-foreground:215 25% 27%;
--muted:               210 40% 96%;
--muted-foreground:    215 16% 47%;
--accent:              210 40% 96%;
--accent-foreground:   222 47% 11%;
--border:              214 32% 91%;
--input:               214 32% 91%;
--ring:                204 100% 37%;
--success:             142 71% 45%;
--warning:             38 92% 50%;
--danger:              0 84% 60%;
--success-subtle:      138 76% 97%;
--warning-subtle:      48 100% 96%;
--danger-subtle:       0 86% 97%;
--radius:              0.5rem;
--radius-sm:           0.3rem;
--shadow-sm:  0 1px 2px 0 hsl(222 47% 11% / 0.05);
--shadow:     0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08);
--shadow-md:  0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08);

/* Density scale */
--pad-card:   20px;
--pad-card-y: 18px;
--gap-grid:   16px;
--gap-row:    20px;
--kpi-pad:    18px;
--kpi-val-size: 24px;
--row-pad-y:  11px;
```

### Dark mode (`html.dark`)

```css
--background:          222 47% 5%;
--foreground:          210 40% 98%;
--card:                222 40% 8%;
--card-foreground:     210 40% 98%;
--popover:             222 40% 8%;
--popover-foreground:  210 40% 98%;
--sidebar:             222 50% 4%;
--sidebar-foreground:  210 40% 96%;
--sidebar-muted:       217 33% 15%;
--sidebar-active:      243 75% 65%;
--sidebar-active-bg:   222 50% 9%;
--primary:             243 75% 65%;
--primary-foreground:  0 0% 100%;
--primary-subtle:      243 50% 18%;
--secondary:           215 25% 18%;
--secondary-foreground:210 40% 96%;
--muted:               215 25% 14%;
--muted-foreground:    215 16% 60%;
--accent:              215 25% 18%;
--accent-foreground:   210 40% 98%;
--border:              215 25% 16%;
--input:               215 25% 16%;
--ring:                243 75% 65%;
--success-subtle:      142 30% 14%;
--warning-subtle:      38 60% 14%;
--danger-subtle:       0 50% 16%;
/* success/warning/danger mantidos do light */
```

### Compact mode (`html.compact`)

```css
--pad-card:   14px;
--pad-card-y: 12px;
--gap-grid:   12px;
--gap-row:    14px;
--kpi-pad:    12px;
--kpi-val-size: 20px;
--row-pad-y:  8px;
```

### Body e reset

```css
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body { height: 100%; }
body {
  font-family: 'Geist', system-ui, -apple-system, sans-serif;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-size: 14px;
  line-height: 1.5;
  display: flex;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: 'cv11', 'ss01';
}
.mono { font-family: 'Geist Mono', 'JetBrains Mono', monospace; font-feature-settings: 'tnum' 1; }
.tnum { font-variant-numeric: tabular-nums; }
```

### Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
```

### Tailwind v4 setup

```css
@import "tailwindcss";
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-border: hsl(var(--border));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-success: hsl(var(--success));
  --color-warning: hsl(var(--warning));
  --color-danger: hsl(var(--danger));
  /* ... demais tokens */
  --font-sans: 'Geist', system-ui, -apple-system, sans-serif;
  --font-mono: 'Geist Mono', 'JetBrains Mono', monospace;
}
```

**Critério de aceite:** `:root` e `html.dark` devem ter exatamente os mesmos valores HSL do HTML. Sem arredondar. Sem converter para hex.

---

## Bloco 1 — AppShell

**Referência:** HTML linhas 612–1205 (estrutura geral), app.js `setPage()`

### Estrutura

```
<body> (display: flex; overflow: hidden; height: 100%)
  <Sidebar />                         ← 240px, flex-shrink 0
  <div class="main">                  ← flex: 1, display: flex, flex-direction: column, min-width: 0, overflow: hidden
    <Topbar />                        ← flex-shrink: 0
    <div class="content">             ← flex: 1, overflow-y: auto, padding: 24px
      {página ativa}
    </div>
  </div>
  <DrawerOverlay />
  <Drawer />
  <Toast />
```

### Regras
- **Nenhum `position: fixed`** no layout principal — apenas Drawer, Toast e DrawerOverlay usam fixed
- `.content` tem `overflow-y: auto` — é o único scroll do app
- `.main` tem `overflow: hidden` para conter o content

---

## Bloco 2 — Sidebar

**Referência:** HTML linhas 614–676, CSS linhas 117–196

### Medidas exatas

| Elemento | Regra |
|----------|-------|
| `.sidebar` | `width: 240px; flex-shrink: 0; background: hsl(var(--sidebar)); color: hsl(var(--sidebar-foreground)); display: flex; flex-direction: column; border-right: 1px solid hsl(var(--sidebar-muted) / 0.5)` |
| `.sb-logo` | `display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid hsl(var(--sidebar-muted) / 0.6)` |
| `.sb-logo-name` | `font-size: 14px; font-weight: 600; letter-spacing: -0.2px; color: hsl(var(--sidebar-foreground))` |
| `.sb-logo-tag` | `display: block; font-size: 10px; font-weight: 500; color: hsl(var(--sidebar-foreground) / 0.5); letter-spacing: 0.4px; margin-top: 1px` |
| `.sb-nav` | `padding: 16px 12px; display: flex; flex-direction: column; gap: 20px; flex: 1; overflow-y: auto` |
| `.sb-section-label` | `font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: hsl(var(--sidebar-foreground) / 0.4); padding: 0 8px; margin-bottom: 4px` |
| `.sb-item` | `display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; font-size: 13px; font-weight: 500; color: hsl(var(--sidebar-foreground) / 0.7); background: transparent; border: none; width: 100%; text-align: left; transition: background 0.12s, color 0.12s; position: relative` |
| `.sb-item:hover` | `background: hsl(var(--sidebar-muted) / 0.6); color: hsl(var(--sidebar-foreground))` |
| `.sb-item.active` | `background: hsl(var(--sidebar-active-bg)); color: hsl(var(--sidebar-foreground))` |
| `.sb-item.active::before` | `content: ''; position: absolute; left: 0; top: 6px; bottom: 6px; width: 2.5px; background: hsl(var(--sidebar-active)); border-radius: 2px` |
| `.sb-item svg` | `width: 14px; height: 14px; stroke-width: 1.6; opacity: 0.85` |
| `.sb-item.active svg` | `color: hsl(var(--sidebar-active)); opacity: 1` |
| `.sb-badge` | `margin-left: auto; font-size: 9px; font-weight: 600; padding: 2px 6px; border-radius: 999px; background: hsl(var(--sidebar-foreground) / 0.1); color: hsl(var(--sidebar-foreground) / 0.8); letter-spacing: 0.4px` |
| `.sb-footer` | `padding: 12px; border-top: 1px solid hsl(var(--sidebar-muted) / 0.6)` |
| `.sb-tenant` | `display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-radius: 6px` |
| `.sb-tenant-icon` | `width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #0073BB, #6B40C4); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: white` |
| `.sb-tenant-name` | `font-size: 12px; font-weight: 500; color: hsl(var(--sidebar-foreground))` |
| `.sb-tenant-role` | `font-size: 10px; color: hsl(var(--sidebar-foreground) / 0.5)` |

### Logo SVG

SVG 30×30, viewBox "0 0 32 32":
- `<rect width="32" height="32" rx="8" fill="url(#g1)"/>` — gradiente #0073BB → #005f99
- `<path d="M11 8 V24 M11 8 H17 a4 4 0 0 1 0 8 H11" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`
- `<circle cx="22" cy="22" r="2.2" fill="white"/>`

### Navegação (itens)

| id | Label | Seção | Badge |
|----|-------|-------|-------|
| `visao-geral` | Visão Geral | Análise | — |
| `combustivel` | Combustível | Análise | — |
| `conveniencia` | Conveniência | Análise | — |
| `dre` | DRE Mensal | Análise | — |
| `sincronizacao` | Sincronização | Operação | "OK" |
| `configuracoes` | Configurações | Operação | — |

Os 4 primeiros ficam em um `<div>`. Os 2 últimos ficam em `<div style="margin-top: auto">` — isso os empurra para o fundo da nav.

### Dados dinâmicos (via API real)

- `.sb-logo-tag`: `"BI · {tenant.name}"` — vem de `GET /auth/me`
- `.sb-tenant-icon`: iniciais do tenant (2 letras)
- `.sb-tenant-name`: `tenant.name`
- `.sb-tenant-role`: `"{role} · {user.name | username}"`
- badge `"OK"` na Sincronização: status real

**Critério de aceite:** sidebar visualmente idêntica ao HTML. Active indicator (barra 2.5px) visível. SVG do logo renderiza igual.

---

## Bloco 3 — Topbar

**Referência:** HTML linhas 681–734, CSS linhas 198–218, app.js `setPage()`, `rerenderCurrent()`

### Layout

```
.topbar (display: flex; align-items: center; gap: 12px; padding: 12px 24px;
         background: hsl(var(--card)); border-bottom: 1px solid hsl(var(--border)); flex-shrink: 0)
  .crumb
    <b id="crumb-page">Visão Geral</b>
    <svg chevron 12×12 opacity 0.5>
    <span id="crumb-context">Todas as unidades · Este mês</span>
  .topbar-right (margin-left: auto; display: flex; align-items: center; gap: 8px)
    #period-tabs .segment   ← escondido nas páginas dre/sincronizacao/configuracoes
    #dre-date-toolbar       ← visível apenas na página dre
    #location-select        ← escondido nas páginas sincronizacao/configuracoes
    #btn-sync
    .avatar
```

### Crumb

```css
.crumb {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: hsl(var(--muted-foreground));
  white-space: nowrap; flex-shrink: 0;
}
.crumb b { color: hsl(var(--foreground)); font-weight: 600; }
.crumb svg { width: 12px; height: 12px; opacity: 0.5; }
@media (max-width: 1100px) { .crumb svg, #crumb-context { display: none; } }
@media (max-width: 980px) { .crumb { display: none; } }
```

- Conteúdo: `<b>{pageName}</b> › {location.label} · {period.label}`
- Atualizado a cada mudança de página/período/location

### Period tabs (`.segment#period-tabs`)

Opções: Hoje | Semana | Mês | Mês ant.  
- `data-period`: `hoje | semana | mes | mes-ant`
- Default ativo: `mes`
- Ao clicar: remove `.active` de todos, adiciona no clicado, chama `setPeriod()`
- Escondido (`display: none`) em: `dre`, `sincronizacao`, `configuracoes`

### DRE toolbar (`#dre-date-toolbar`)

```css
.dre-toolbar { display: flex; align-items: center; gap: 12px; }
.dre-month-btn {
  width: 34px; height: 34px;
  border: 1px solid hsl(var(--border)); border-radius: 6px;
  background: hsl(var(--card)); color: hsl(var(--muted-foreground));
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.dre-month-btn:hover { color: hsl(var(--foreground)); border-color: hsl(var(--ring) / 0.5); background: hsl(var(--muted)); }
.dre-month-btn svg { width: 14px; height: 14px; }
```

- `← select[month 0..11] select[year] →`
- Visível **somente** em `dre`; `display: flex` quando visível, `display: none` no resto
- `dre-month` select: `min-width: 130px`
- `dre-year` select: `min-width: 90px`
- Ao clicar `←/→`: chama `dreShift(±1)` — com overflow de mês/ano
- Selects: `onChange` atualiza `state.dre.year/monthIdx` → `renderDRE()`

### Location select

```css
select.input { min-width: 170px; /* ver Bloco 4 */ }
```

- Opções: "Todas as unidades" + locations do tenant (vêm de `GET /api/v1/locations`)
- Escondido em: `sincronizacao`, `configuracoes`
- `onChange` → `setLocation(value)` → `rerenderCurrent()`

### Botão Sincronizar (`#btn-sync`)

```html
<button class="btn btn-outline">
  <svg><!-- ícone sync --></svg>
  Sincronizar
</button>
```

- Ao clicar: spinner 1800ms → toast success → re-render (ver Bloco 12 — Interações)

### Avatar

```css
.avatar {
  width: 32px; height: 32px; border-radius: 999px;
  background: linear-gradient(135deg, #0073BB, #6B40C4);
  color: white; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
```

- Iniciais do usuário logado (ex: "IK")

**Critério de aceite:** topbar visualmente idêntico. Period tabs ativo com fundo correto. DRE toolbar só aparece na página DRE. Crumb atualiza ao mudar de página/filtro.

---

## Bloco 4 — Botões, Inputs, Segment Control

**Referência:** CSS linhas 220–286

### Botão base (`.btn`)

```css
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  height: 34px; padding: 0 12px;
  border-radius: 6px;
  font-family: inherit; font-size: 13px; font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.12s, border-color 0.12s, opacity 0.12s;
  white-space: nowrap;
}
.btn svg { width: 14px; height: 14px; stroke-width: 1.8; }
```

### Variantes

| Classe | Regra |
|--------|-------|
| `.btn-outline` | `background: hsl(var(--card)); color: hsl(var(--foreground)); border-color: hsl(var(--border));` hover: `background: hsl(var(--muted))` |
| `.btn-primary` | `background: hsl(var(--primary)); color: hsl(var(--primary-foreground));` hover: `opacity: 0.92` |
| `.btn-ghost` | `background: transparent; color: hsl(var(--muted-foreground));` hover: `background: hsl(var(--muted)); color: hsl(var(--foreground))` |
| `.btn-icon` | `width: 34px; padding: 0; justify-content: center` |
| `.btn-sm` | `height: 28px; padding: 0 10px; font-size: 12px;` svg: `12×12px` |

### Select / Input (`.input`, `select.input`)

```css
select.input, .input {
  height: 34px;
  padding: 0 28px 0 12px;
  border-radius: 6px;
  border: 1px solid hsl(var(--input));
  background: hsl(var(--card)); color: hsl(var(--foreground));
  font: inherit; font-size: 13px;
  cursor: pointer; outline: none; appearance: none;
  background-image: url("data:image/svg+xml,..."); /* chevron #64748b */
  background-repeat: no-repeat; background-position: right 10px center;
  transition: border-color 0.12s, box-shadow 0.12s;
}
.input:focus, select.input:focus {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.15);
}
```

### Segmented control (`.segment`)

```css
.segment {
  display: inline-flex;
  padding: 3px;
  background: hsl(var(--muted));
  border-radius: 7px;
  gap: 2px;
}
.segment button {
  height: 28px; padding: 0 12px;
  border: none; background: transparent;
  font: inherit; font-size: 12px; font-weight: 500;
  color: hsl(var(--muted-foreground));
  border-radius: 5px; cursor: pointer;
  transition: background 0.12s, color 0.12s;
}
.segment button:hover { color: hsl(var(--foreground)); }
.segment button.active {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-sm);
}
```

**Critério de aceite:** botões com altura exata 34px (btn) / 28px (btn-sm). Segment control com padding 3px externo e gap 2px interno. Select com chevron SVG à direita.

---

## Bloco 5 — KpiCard

**Referência:** CSS linhas 313–357, app.js `kpiCard()`, `paintKPISpark()`, linhas 46–64

### Estrutura

```tsx
<div className="kpi">
  <div className="kpi-label">
    {/* icon svg opcional */} {label}
  </div>
  <div className="kpi-value">{value}</div>
  <div className="kpi-deltas">
    <div className="kpi-delta-row">
      <DeltaTag value={dM} isPP={deltaPP} />
      <span className="kpi-delta-label">vs mês ant.</span>
    </div>
    {dY !== undefined && (
      <div className="kpi-delta-row">
        <DeltaTag value={dY} isPP={deltaPP} />
        <span className="kpi-delta-label">vs ano ant.</span>
      </div>
    )}
  </div>
  <div className="kpi-spark">{/* SVG sparkline */}</div>
</div>
```

### CSS exato

```css
.kpi {
  position: relative;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  padding: var(--kpi-pad);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  display: flex; flex-direction: column;
  min-height: 116px;
}
.kpi-label {
  font-size: 11px; font-weight: 500;
  color: hsl(var(--muted-foreground));
  display: flex; align-items: center; gap: 6px;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: relative; z-index: 1;
}
.kpi-label svg { width: 12px; height: 12px; opacity: 0.7; }
.kpi-value {
  font-size: var(--kpi-val-size); /* 24px normal, 20px compact */
  font-weight: 600; letter-spacing: -0.6px;
  color: hsl(var(--foreground));
  margin: 6px 0 8px; line-height: 1.1;
  font-variant-numeric: tabular-nums;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  position: relative; z-index: 1;
}
.kpi-deltas {
  display: flex; flex-direction: column; gap: 2px;
  font-size: 11px; color: hsl(var(--muted-foreground));
  margin-top: auto; position: relative; z-index: 1;
}
.kpi-delta-row { display: flex; align-items: center; gap: 6px; }
.kpi-delta-label {
  font-size: 11px; color: hsl(var(--muted-foreground));
  white-space: nowrap; text-transform: lowercase; letter-spacing: 0;
}
.kpi-spark {
  position: absolute; left: -2px; right: -2px; top: 0; bottom: -1px;
  height: auto; opacity: 0.28; pointer-events: none; z-index: 0;
}
html.dark .kpi-spark { opacity: 0.38; }
html.no-spark .kpi-spark { display: none !important; }
html.no-spark .kpi { min-height: auto; }
```

### DeltaTag

```tsx
function DeltaTag({ value, isPP }: { value: number; isPP?: boolean }) {
  const unit = isPP ? ' p.p.' : '%';
  if (Math.abs(value) < 0.15) return <span className="delta-neu">→ {Math.abs(value).toFixed(1).replace('.', ',')}{unit}</span>;
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

**Cores dos sparks por KPI:**

| KPI | Cor |
|-----|-----|
| Receita Bruta | `#0073BB` |
| CMV | `#dc2626` |
| Margem Bruta | `#16a34a` |
| Margem % | `#0073BB` |
| Itens vendidos | `#6B40C4` |
| Volume (comb) | `#0073BB` |
| Ticket Médio | accent color |

**Critério de aceite:** sparkline cobre todo o fundo do card (absoluta, left -2px, top 0). DeltaTag com seta Unicode, cor correta. Valor ocupa toda a width com overflow ellipsis. min-height 116px em modo normal.

---

## Bloco 6 — Sparkline SVG

**Referência:** charts.js `svgSpark()` + `buildSmoothPath()`, linhas 63–93

### Especificação exata

```tsx
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const W = 200, H = 60;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = (max - min) || 1;

  // x: linear de 0 a W
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  // y: invertido, comprimido no bottom 45% do viewBox
  const ys = data.map(v => H - 4 - ((v - min) / range) * (H * 0.45));

  // cubic-bezier smooth path — cpx1 == cpx2
  function buildPath(xs: number[], ys: number[]) {
    let d = `M ${xs[0]},${ys[0]}`;
    for (let i = 1; i < xs.length; i++) {
      const x0 = xs[i-1], y0 = ys[i-1];
      const x1 = xs[i],   y1 = ys[i];
      const cpx = x0 + (x1 - x0) * 0.5;
      d += ` C ${cpx},${y0} ${cpx},${y1} ${x1},${y1}`;
    }
    return d;
  }

  const path = buildPath(xs, ys);
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

**Regras críticas:**
- `viewBox="0 0 200 60"` — sempre
- `preserveAspectRatio="none"` — estica para preencher o container
- Curva fica no **bottom 45%** do viewBox — não cobre a parte superior
- `fill-opacity: 0.22` — área de fill semi-transparente
- `stroke-width: 1.4` com `vector-effect="non-scaling-stroke"` — linha não escala com zoom
- Smooth path: `C cpx,y0 cpx,y1 x1,y1` onde `cpx = x0 + (x1-x0)*0.5`

**Critério de aceite:** sparkline ocupa todo o espaço do `.kpi-spark`. Curva visível no terço inferior do card. Fill semitransparente. Sem pontos visíveis.

---

## Bloco 7 — SectionCard, grids, chart-box heights

**Referência:** CSS linhas 299–379

### Card

```css
.card {
  background: hsl(var(--card));
  color: hsl(var(--card-foreground));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
}
.card-h {
  padding: var(--pad-card-y) var(--pad-card) 8px;
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 12px;
}
.card-b { padding: 0 var(--pad-card) var(--pad-card-y); }
.card-title { font-size: 13px; font-weight: 600; color: hsl(var(--foreground)); letter-spacing: -0.1px; }
.card-desc  { font-size: 12px; color: hsl(var(--muted-foreground)); margin-top: 3px; }
```

### Grids de layout

```css
.kpi-grid { display: grid; gap: var(--gap-grid); }
.kpi-5 { grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
.kpi-4 { grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.kpi-3 { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
@media (min-width: 1280px) { .kpi-5 { grid-template-columns: repeat(5, minmax(0,1fr)); } }
@media (min-width: 1100px) { .kpi-4 { grid-template-columns: repeat(4, minmax(0,1fr)); } }

.row { display: grid; gap: var(--gap-grid); }
.row-2-1 { grid-template-columns: 2fr 1fr; }
.row-1-1 { grid-template-columns: 1fr 1fr; }
.row-3-2 { grid-template-columns: 3fr 2fr; }
@media (max-width: 1180px) {
  .row-2-1, .row-1-1, .row-3-2 { grid-template-columns: 1fr; }
}
```

### Alturas dos chart containers

```css
.chart-box          { position: relative; height: 280px; }
.chart-box.tall     { height: 320px; }
.chart-box.short    { height: 200px; }
```

**Gap entre seções (`.page`):** `gap: var(--gap-row)` — 20px normal, 14px compact

**Critério de aceite:** grids colapsam em 1fr abaixo de 1180px. kpi-5 usa 5 colunas fixas acima de 1280px. chart-box com altura fixa — Recharts ocupa 100% do container.

---

## Bloco 8 — Tabelas

**Referência:** CSS linhas 396–430

```css
.tbl-wrap { overflow-x: auto; }
table.tbl { width: 100%; border-collapse: collapse; font-size: 13px; }
.tbl thead tr { border-bottom: 1px solid hsl(var(--border)); }
.tbl th {
  padding: 10px 14px; text-align: left;
  font-size: 11px; font-weight: 500;
  color: hsl(var(--muted-foreground));
  white-space: nowrap; letter-spacing: 0.1px;
}
.tbl th:first-child, .tbl td:first-child { padding-left: 20px; }
.tbl th:last-child, .tbl td:last-child { padding-right: 20px; }
.tbl th.r, .tbl td.r { text-align: right; font-variant-numeric: tabular-nums; }
.tbl th.sortable { cursor: pointer; user-select: none; }
.tbl th.sortable:hover { color: hsl(var(--foreground)); }
.tbl td {
  padding: var(--row-pad-y) 14px;   /* 11px normal, 8px compact */
  color: hsl(var(--foreground));
  border-bottom: 1px solid hsl(var(--border));
  vertical-align: middle;
}
.tbl tbody tr:last-child td { border-bottom: 0; }
.tbl tbody tr.clickable { cursor: pointer; }
.tbl tbody tr.clickable:hover td { background: hsl(var(--muted) / 0.6); }
.tbl tfoot td {
  border-top: 1px solid hsl(var(--border));
  border-bottom: 0;
  font-weight: 600; color: hsl(var(--foreground));
  padding: 12px 14px;
  background: hsl(var(--muted) / 0.4);
}
```

### Elementos auxiliares de célula

```css
/* Rank (#) */
.row-rank { font-size: 12px; font-weight: 500; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; }

/* Segmento com dot colorido */
.seg-cell { display: flex; align-items: center; gap: 10px; }
.seg-dot  { width: 9px; height: 9px; border-radius: 2px; flex-shrink: 0; }

/* Barra de progresso inline */
.bar-cell  { display: flex; align-items: center; gap: 8px; min-width: 120px; }
.bar-track { flex: 1; height: 5px; background: hsl(var(--muted)); border-radius: 999px; overflow: hidden; }
.bar-fill  { height: 100%; border-radius: 999px; background: hsl(var(--primary)); }
.bar-num   { font-size: 11px; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; min-width: 38px; text-align: right; }

/* Sparkline inline em tabela (Canvas Chart.js) */
.spark-cell        { display: flex; align-items: center; gap: 8px; min-width: 110px; }
.spark-cell canvas { width: 72px !important; height: 22px !important; flex-shrink: 0; }

/* Trend indicators */
.trend-up   { color: hsl(var(--success)); font-size: 11px; font-weight: 600; }
.trend-down { color: hsl(var(--danger));  font-size: 11px; font-weight: 600; }
.trend-flat { color: hsl(var(--muted-foreground)); font-size: 11px; }
```

**Lógica trend:** `trend > 0.02 → ↑ trend-up`, `trend < -0.02 → ↓ trend-down`, senão `→ trend-flat`

**Critério de aceite:** th em 11px. td padding vertical respeita `--row-pad-y`. Primeira/última coluna com 20px de padding horizontal. Tfoot com fundo muted/0.4.

---

## Bloco 9 — Donut

**Referência:** CSS linhas 380–394, charts.js `donut()`, app.js `renderVisaoGeral()` linhas 91–103

### Container

```css
.donut-wrap {
  position: relative; width: 180px; height: 180px; margin: 8px auto;
}
.donut-center {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  pointer-events: none;
}
.donut-center-l {
  font-size: 10px; font-weight: 600; letter-spacing: 0.8px;
  color: hsl(var(--muted-foreground)); text-transform: uppercase;
}
.donut-center-v {
  font-size: 14px; font-weight: 600; color: hsl(var(--foreground));
  margin-top: 2px; font-variant-numeric: tabular-nums;
}
```

### Legenda

```css
.donut-legend {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 10px 14px; margin-top: 16px;
}
.dl-row { display: flex; align-items: center; gap: 8px; }
.dl-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; } /* quadrado com radius 2px */
.dl-name { flex: 1; font-size: 12px; color: hsl(var(--muted-foreground)); }
.dl-pct  { font-size: 12px; font-weight: 600; color: hsl(var(--foreground)); font-variant-numeric: tabular-nums; }
```

### Recharts config

```tsx
// PieChart com Recharts — equivalente ao Chart.js donut()
<PieChart width={180} height={180}>
  <Pie
    data={data}
    dataKey="value"
    cx="50%"
    cy="50%"
    innerRadius="72%"      // cutout: '72%'
    outerRadius="100%"
    strokeWidth={2}
    stroke={surfaceColor}  // hsl(var(--card)) — tema-aware
  >
    {data.map((entry, i) => (
      <Cell key={i} fill={entry.color} />
    ))}
  </Pie>
  <Tooltip ... />           // sem legend nativa — usar custom .donut-legend
</PieChart>
```

**Critério de aceite:** donut 180×180. Legenda em 2 colunas. Dots quadrados (border-radius 2px). Centro absoluto. Texto "Total" em uppercase 10px.

---

## Bloco 10 — Badge, EmptyState, Drawer, Toast, Heatmap, Spinner

**Referência:** CSS linhas 432–609, app.js `showToast()`, `openDrillDown()`, `closeDrillDown()`

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

### EmptyState

```css
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; text-align: center;
  padding: 40px 24px;
  color: hsl(var(--muted-foreground));
  border: 1.5px dashed hsl(var(--border));
  border-radius: var(--radius);
  background: hsl(var(--muted) / 0.3);
}
.empty-icon {
  width: 40px; height: 40px; border-radius: 999px;
  background: hsl(var(--muted));
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12px;
}
.empty-title { font-size: 14px; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 4px; }
.empty-desc  { font-size: 12px; max-width: 320px; }
```

### Drawer

```css
.drawer-overlay {
  position: fixed; inset: 0;
  background: hsl(222 47% 11% / 0.4);
  opacity: 0; pointer-events: none;
  transition: opacity 0.18s; z-index: 40;
}
.drawer-overlay.open { opacity: 1; pointer-events: auto; }

.drawer {
  position: fixed; right: 0; top: 0; bottom: 0;
  width: 420px; max-width: 92vw;
  background: hsl(var(--card));
  border-left: 1px solid hsl(var(--border));
  box-shadow: var(--shadow-md);
  transform: translateX(100%);
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 41; display: flex; flex-direction: column; overflow: hidden;
}
.drawer.open { transform: translateX(0); }

.drawer-head {
  padding: 18px 20px; border-bottom: 1px solid hsl(var(--border));
  display: flex; align-items: center; gap: 10px;
}
.drawer-title {
  font-size: 15px; font-weight: 600; color: hsl(var(--foreground));
  flex: 1; display: flex; align-items: center; gap: 10px;
}
.drawer-body { flex: 1; overflow-y: auto; padding: 20px; }

.drawer-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 0; border-bottom: 1px solid hsl(var(--border)); font-size: 13px;
}
.drawer-row:last-child { border-bottom: 0; }
.drawer-row-l { color: hsl(var(--muted-foreground)); }
.drawer-row-v { font-weight: 600; color: hsl(var(--foreground)); font-variant-numeric: tabular-nums; }
```

### Toast

```css
.toast {
  position: fixed; right: 24px; bottom: 24px;
  background: hsl(var(--card)); border: 1px solid hsl(var(--border));
  border-radius: var(--radius); box-shadow: var(--shadow-md);
  padding: 12px 16px;
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: hsl(var(--foreground));
  z-index: 50;
  transform: translateY(20px); opacity: 0;
  transition: transform 0.2s, opacity 0.2s;
}
.toast.show { transform: translateY(0); opacity: 1; }
.toast-icon { width: 18px; height: 18px; }
.toast.success .toast-icon { color: hsl(var(--success)); }
.toast.info    .toast-icon { color: hsl(var(--primary)); }
```

**Lógica toast:**
1. Setar texto + classe (`success` / `info`)
2. `requestAnimationFrame(() => toast.classList.add('show'))`
3. Após 2800ms: `toast.classList.remove('show')`

### Heatmap

```css
.heat-wrap  { display: flex; gap: 8px; }
.heat-days  { display: flex; flex-direction: column; gap: 5px; padding-top: 22px; }
.heat-day   { height: 36px; font-size: 11px; color: hsl(var(--muted-foreground)); display: flex; align-items: center; }
.heat-grid  { flex: 1; display: flex; flex-direction: column; gap: 5px; }
.heat-row   { display: flex; gap: 5px; }
.heat-head  { display: flex; gap: 5px; margin-bottom: 4px; }
.heat-wk    { flex: 1; text-align: center; font-size: 10px; font-weight: 500; color: hsl(var(--muted-foreground)); letter-spacing: 0.5px; text-transform: uppercase; }
.heat-cell  {
  flex: 1; height: 36px; border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 500; font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground));
  transition: transform 0.1s;
}
.heat-cell:hover { transform: scale(1.05); }
.heat-legend { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 10px; color: hsl(var(--muted-foreground)); }
.legend-bar  { flex: 1; height: 6px; margin: 0 10px; border-radius: 999px; background: linear-gradient(to right, hsl(var(--primary) / 0.1), hsl(var(--primary))); }
```

**Lógica de cor das células:**
```ts
const t = (value - min) / (max - min);
const alpha = 0.08 + t * 0.92;
const bgColor = `hsl(204 100% 37% / ${alpha})`;
const textColor = t > 0.55 ? '#fff' : 'hsl(var(--foreground))';
```

**Dados:** 7 dias × 4 semanas. Dias: Dom, Seg, Ter, Qua, Qui, Sex, Sáb (nessa ordem — colunas). Semanas: S1, S2, S3, S4 (cabeçalho).

### Spinner

```css
.spinner {
  width: 14px; height: 14px;
  border: 2px solid hsl(var(--muted));
  border-top-color: hsl(var(--primary));
  border-radius: 999px;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.spinner-lg { width: 32px; height: 32px; border-width: 3px; }
```

**Critério de aceite:** drawer desliza da direita em 0.22s com cubic-bezier(0.16, 1, 0.3, 1). Toast aparece em 0.2s. Overlay com opacity. Heatmap células com hover scale. Sem diferença visual com o HTML.

---

## Bloco 11 — Constante de cores dos charts

**Referência:** charts.js linhas 8–16, `themeTokens()`

### Paleta principal (constante `C`)

```ts
export const CHART_COLORS = {
  combustivel:   '#0073BB',
  conveniencia:  '#EC7211',
  lubrificantes: '#6B40C4',
  arla:          '#1D8102',
  servicos:      '#0891b2',
  s1: '#0073BB', s2: '#EC7211', s3: '#6B40C4',
  s4: '#1D8102', s5: '#0891b2', s6: '#db2777',
  pos:     '#16a34a',
  neg:     '#dc2626',
  neutral: '#64748b',
} as const;
```

### Tokens de tema por modo

```ts
function chartThemeTokens(isDark: boolean) {
  return isDark ? {
    grid:         '#1f2937',
    tick:         '#94a3b8',
    tooltipBg:    '#0f172a',
    tooltipBorder:'#1f2937',
    titleColor:   '#f1f5f9',
    bodyColor:    '#94a3b8',
    surface:      '#0f172a',
  } : {
    grid:         '#e2e8f0',
    tick:         '#64748b',
    tooltipBg:    '#ffffff',
    tooltipBorder:'#e2e8f0',
    titleColor:   '#0f172a',
    bodyColor:    '#64748b',
    surface:      '#ffffff',
  };
}
```

### Tooltip config (compartilhado)

```ts
// Recharts <Tooltip> custom content — equivalente ao TT() do charts.js
tooltipStyle = {
  backgroundColor: token.tooltipBg,
  border: `1px solid ${token.tooltipBorder}`,
  borderRadius: 8,
  padding: '10px 14px',
  // titleFont: size 12, weight 600
  // bodyFont: size 12
};
```

### Grid config (compartilhado)

```ts
// Recharts CartesianGrid
<CartesianGrid stroke={token.grid} strokeDasharray="0" />
// Recharts XAxis / YAxis
tickStyle = { fill: token.tick, fontSize: 11 };
axisLine = false; // NOBDR equivalente
tickLine = false; // drawTicks: false equivalente
tick={{ padding: 8 }}
```

**Critério de aceite:** todas as cores correspondem exatamente. Gráficos re-renderizam quando tema muda (`html.dark` toggled).

---

## Bloco 12 — Interações completas

**Referência:** app.js `boot()`, `setPage()`, `setPeriod()`, `setLocation()`, `runSync()`, `showToast()`, tweaks-app.jsx `applyTweaks()`

### 1. Period selector

- Clicar em tab → remove `.active` de todos → adiciona no clicado → `state.period = value` → `rerenderCurrent()`
- Toda a página ativa re-renderiza do zero (novos dados para o período)
- KPIs, charts, tabelas, heatmap — tudo atualiza

### 2. Location select

- `onChange` → `state.location = value` → `rerenderCurrent()`
- Toda a página ativa re-renderiza com dados filtrados por location
- Crumb atualiza: `"{location.label} · {period.label}"`

### 3. Navegação sidebar

`setPage(name)`:
1. Atualiza `state.page`
2. Remove/adiciona `.active` nos `.sb-item`
3. Remove/adiciona `.active` nas `.page`
4. Controla visibilidade:
   - `#period-tabs`: `display: none` em `dre`, `sincronizacao`, `configuracoes`
   - `#dre-date-toolbar`: `display: flex` apenas em `dre`
   - `#location-select`: `display: none` em `sincronizacao`, `configuracoes`
5. Atualiza crumb
6. Chama `rerenderCurrent()`

### 4. Clique em linha da tabela de segmentos (Visão Geral)

`openDrillDown(seg)`:

**Drawer title:** `<div class="seg-dot" style="background:{seg.color}; width:14px; height:14px; border-radius:3px"> + seg.label`

**Drawer body:**
```
[grid 2 cols, gap 12px]
  Box Receita: label 10px uppercase, valor 18px font-weight 600
  Box Margem%: label 10px uppercase, valor 18px font-weight 600

"COMPOSIÇÃO" — 12px, uppercase, letter-spacing 1px, margin-bottom 10px

drawer-rows por produto:
  Quebra por segmento (hardcoded no protótipo):
  combustivel: Gasolina Comum 36%, Diesel S-10 30%, Gasolina Aditivada 18%, Etanol 10%, Diesel S-500 6%
  lubrificantes: Motor 62%, Transmissão 21%, Aditivos 10%, Outros 7%
  servicos: Troca de óleo 48%, Lavagem 32%, Calibragem 12%, Outros 8%
  conveniencia: Bebidas 34%, Tabacaria 24%, Alimentos 17%, Higiene 13%, Outros 12%
  Cada row: "{pct}% · R$ {value}"

"POR UNIDADE" — mesma formatação de header
  JAM Centro / JAM Rodovia / JAM Norte / JAM Sul
  Valor por unidade = seg.receita × peso (0.32, 0.41, 0.16, 0.11)
```

Na implementação real: substituir hardcoded por `GET /api/v1/vendas/drill/subgrupos` + dados por location.

### 5. Toggle donut → filtra segmentos

Na Visão Geral: clicar em slice do donut hilita o segmento correspondente na tabela. Implementado via Recharts `activeIndex` + filtro de tabela. (No protótipo é nativo do Chart.js.)

### 6. Toggle sort Top Produtos (Visão Geral)

- Segment control `#top-sort`: Receita | Margem %
- Clicar → `state.topSort = 'receita' | 'margem'` → `renderTop()`
- Apenas a tabela de top produtos re-renderiza (não a página inteira)
- A barra de peso muda para usar a métrica selecionada como max

### 7. Toggle Volume/Receita — Combustível

- Segment `#comb-mode`: Volume | Receita
- `state.combMode = 'volume' | 'receita'` → `renderCombustivel()`
- Muda: chart `combLines` eixo Y, donut total label (L vs R$), `#comb-evo-desc`
- Desc: `"{Volume|Receita} por produto · {period.label.toLowerCase()}"`

### 8. Toggle Sem/Com Arla 32 — Combustível

- Segment `#comb-arla`: Sem Arla 32 | Com Arla 32
- `state.includeArla = false | true` → `renderCombustivel()`
- Arla 32 aparece como produto adicional no chart, donut e tabela

### 9. Toggle de view — Conveniência

- Segment `#conv-view`: Todos | Conveniência | Serviços | Lubrificantes
- `state.convView = 'todos' | 'loja' | 'servicos' | 'lub'` → `renderConveniencia()`
- Filtra: categorias exibidas, scatter points, donut items
- Label do KPI de receita muda: "Receita Conv. + Serv." | "Receita Conveniência" | etc
- Cor dos sparks muda: todos→combustivel, loja→conveniencia, servicos→servicos, lub→lubrificantes

### 10. Navegação de meses DRE (← →)

`dreShift(dir)`:
```ts
state.dre.monthIdx += dir;
if (state.dre.monthIdx < 0)  { state.dre.monthIdx = 11; state.dre.year--; }
if (state.dre.monthIdx > 11) { state.dre.monthIdx = 0;  state.dre.year++; }
// atualiza selects de mês/ano
renderDRE();
```

### 11. Selects de mês/ano DRE

- `dre-month` onChange: `state.dre.monthIdx = parseInt(value)` → `renderDRE()`
- `dre-year` onChange: `state.dre.year = parseInt(value)` → `renderDRE()`

### 12. Botão Sincronizar

`runSync(btn)`:
```ts
// 1. Desabilita btn, troca conteúdo
btn.disabled = true;
btn.innerHTML = '<spinner /> Sincronizando…';

// 2. Simula 1800ms
setTimeout(() => {
  btn.innerHTML = original;  // restaura
  btn.disabled = false;
  showToast('Sincronização concluída · 3.913 registros novos', 'success');
  rerenderCurrent();
}, 1800);
```

Na implementação real: `POST /api/v1/sync/trigger` → aguarda resposta → toast.

### 13. Dark mode toggle (tweaks panel)

```ts
applyTweaks({ theme: 'dark' | 'light' })
// → document.documentElement.classList.toggle('dark', t.theme === 'dark')
```

- Persiste em `localStorage` via tweaks mechanism
- Todos os CSS vars atualizam automaticamente (cascade do `html.dark`)
- Charts re-renderizam: `window.PIApp.rerenderCurrent()`

### 14. Density toggle (tweaks panel)

```ts
// → document.documentElement.classList.toggle('compact', t.density === 'compact')
```

- Density vars (`--kpi-pad`, `--gap-grid`, etc.) atualizam via cascade

### 15. Fechar drawer

- Clicar no botão X (`#drawer-close`): `closeDrillDown()`
- Clicar no overlay (`#drawer-overlay`): `closeDrillDown()`
- `closeDrillDown()`: remove `.open` de drawer e overlay

### 16. Clique em linha da tabela de Conveniência

`openConvCatDrillDown(g)`:

**Drawer body:**
```
"PRODUTOS ({count})" — 12px, uppercase, letter-spacing 1px, margin-bottom 10px

Por produto (g.products[]):
  [flex, justify-between] nome (13px, font-weight 500) | receita (13px, font-weight 600)
  [flex, gap 10px, 11px muted-foreground]
    barra de progresso (flex:1, height 4px, bg muted, fill=g.color)
    "{qtd} un" (min-width 50px, text-align right)
    margem% (min-width 50px, text-align right, cor: success se >=50%, senão muted)
    trend arrow (trend-up/down/flat, min-width 42px, text-align right)
```

### 17. Accent color (tweaks panel)

```ts
const accents = {
  blue:    { primary: '204 100% 37%', subtle: '204 100% 95%' },
  indigo:  { primary: '243 75% 58%',  subtle: '243 80% 96%' },
  emerald: { primary: '160 84% 32%',  subtle: '152 81% 96%' },
  rose:    { primary: '350 89% 55%',  subtle: '356 100% 97%' },
};
// Seta --primary, --primary-subtle, --ring, --sidebar-active via style.setProperty
```

---

## Bloco 13 — Página: Visão Geral (`/`)

**Referência:** HTML linhas 739–867, app.js `renderVisaoGeral()` linhas 67–131

### Estrutura da página

```
page-head
  h1 "Visão Geral"
  sub "Consolidado da rede — vendas, margens e padrão de demanda."
  page-actions: btn-outline btn-sm [Exportar icon]

kpi-grid kpi-5 (5 cards)

row row-3-2
  card "Evolução de Receita & Margem"    ← chart-box 280px
  card "Mix por Segmento"                ← donut 180×180 + legenda 2 cols

card "Breakdown por Segmento"            ← tabela clickable

row row-2-1
  card "Top 10 Produtos por Receita"     ← tabela + segment sort
  card "Padrão Semanal"                  ← heatmap 7×4
```

### KPIs (5 cards)

| id | Label | Spark color |
|----|-------|-------------|
| `kpi-rec` | Receita Bruta | `#0073BB` |
| `kpi-cmv` | CMV | `#dc2626` |
| `kpi-mg` | Margem Bruta | `#16a34a` |
| `kpi-mp` | Margem % | `#0073BB` (deltaPP: true) |
| `kpi-it` | Itens vendidos | `#6B40C4` |

### Chart: Evolução de Receita & Margem

**Recharts** — equivalente ao `revenueDual()` (charts.js linhas 139–185):

```tsx
<ComposedChart data={labels.map((l, i) => ({ l, receita: receita[i], margemBruta: receita[i] * margemPct[i] / 100, margemPct: margemPct[i] }))}>
  <CartesianGrid stroke={token.grid} />
  <XAxis dataKey="l" {...tickStyle} axisLine={false} tickLine={false} />
  <YAxis yAxisId="left" tickFormatter={v => 'R$ ' + (v/1000).toFixed(0) + 'k'} {...} />
  <YAxis yAxisId="right" orientation="right" tickFormatter={v => v + '%'} hide={margemPctHidden} />
  <Tooltip {...} />
  <Legend position="bottom" />

  {/* Receita Bruta — fill com gradiente #0073BB */}
  <Area yAxisId="left" type="monotone" dataKey="receita"
        stroke="#0073BB" fill="url(#gradRevenue)" strokeWidth={2}
        dot={false} activeDot={{ r: 4 }} />

  {/* Margem Bruta — fill com gradiente #16a34a */}
  <Area yAxisId="left" type="monotone" dataKey="margemBruta"
        stroke="#16a34a" fill="url(#gradMargem)" strokeWidth={2}
        dot={false} activeDot={{ r: 4 }} />

  {/* Margem % — linha tracejada, eixo direito, hidden por padrão */}
  <Line yAxisId="right" type="monotone" dataKey="margemPct"
        stroke="#EC7211" strokeWidth={2} strokeDasharray="6 4"
        dot={false} activeDot={{ r: 4 }} hide={true} />
</ComposedChart>
```

Gradientes (LinearGradient):
- Receita: `#0073BB80` (stop 0) → `#0073BB10` (stop 1) — direção Y
- Margem Bruta: `#16a34a80` → `#16a34a10`

Legend: `position="bottom"`, `iconType="circle"`, `wrapperStyle={{ paddingTop: 12 }}`

### Donut: Mix por Segmento

Segmentos: `combustivel (#0073BB)`, `lubrificantes (#6B40C4)`, `servicos (#0891b2)`, `conveniencia (#EC7211)`

Centro: "Total" | `fmtBRL(mix.total)` — atualiza com período/location

Legenda: format `(share*100).toFixed(1).replace('.',',') + '%'`

### Tabela: Breakdown por Segmento

Colunas: Segmento | Peso na receita | Receita | CMV | Margem | Margem %

- Segmento: `.seg-cell` com `.seg-dot` colorido
- Peso: `.bar-cell` com `.bar-fill` colorido (bg = seg.color)
- Valores: `fmtBRLFull()`
- Margem %: `<b>{value}%</b>`
- `tr.clickable` → `openDrillDown(seg)`
- Tfoot: TOTAL com totais calculados

### Tabela: Top 10 Produtos

Colunas: `#` | Produto (+ grupo sub) | Categoria (badge-soft) | Peso (bar) | Receita | Margem % | Qtd

- Segment control no card-h: Receita | Margem % → troca metric usada para bar e ordenação
- `#`: `String(i+1).padStart(2,'0')` com `.row-rank`
- Produto: `<b>name</b>` + sub `{group}` em 11px muted-foreground margin-top 1px
- Cor da barra: baseada em categoria (combustível→#0073BB, bebidas/tabacaria/alimentos→#EC7211, serviços→#0891b2, arla→#1D8102, lubrificantes→#6B40C4)
- Qtd: `qtd.toLocaleString('pt-BR')`

### Heatmap: Padrão Semanal

- Cabeçalho: S1, S2, S3, S4 (com padding-left 42px no `.heat-head`)
- Dias: Dom, Seg, Ter, Qua, Qui, Sex, Sáb (em `.heat-days`, padding-top 0!)
- 7 dias × 4 semanas = 28 células
- Célula: `fmtBRL(value)` como texto; bg `hsl(204 100% 37% / alpha)`
- Legenda: `fmtBRL(min)` — barra gradiente — `fmtBRL(max)`

**Critério de aceite:** 5 KPIs visíveis. Chart revenue com 3 datasets (2 visíveis, 1 hidden). Donut 4 segmentos. Tabela segmentos clickable. Top 10 com sort. Heatmap com gradiente de cor correto.

---

## Bloco 14 — Página: Combustível (`/combustivel`)

**Referência:** HTML linhas 870–949, app.js `renderCombustivel()` linhas 200–284

### Estrutura

```
page-head
  h1 "Combustível"
  sub "Volumes, receitas e margens por produto."
  page-actions:
    segment #comb-mode: Volume | Receita
    segment #comb-arla: Sem Arla 32 | Com Arla 32

kpi-grid kpi-5 (5 cards)

row row-3-2
  card "Evolução por produto" (chart-box tall 320px)   ← combLines multi-série
  card "Mix de Combustível" (donut)

row row-2-1
  card "Breakdown por produto" (tabela)
  card "Ranking de Bicos" (EmptyState)
```

### KPIs (5 cards)

| id | Label | Spark color |
|----|-------|-------------|
| `kc-vol` | Volume Total | `#0073BB` |
| `kc-rec` | Receita | `#0073BB` |
| `kc-cmv` | CMV | `#dc2626` |
| `kc-mg` | Margem Bruta | `#16a34a` |
| `kc-mp` | Margem % | `#0073BB` (deltaPP) |

- Volume Total: valor + " L"
- Margem %: `"17,27%"` (2 decimais)
- Delta de margem% usa `deltaPP: true`

### Chart: Evolução por produto

**Recharts LineChart ou AreaChart (multi-série, stacked)**

Equivalente ao `combLines()` (charts.js linhas 205–241):

```tsx
// fill=true → stacked area; fill=false → multi-line
// mode = 'volume' | 'receita'
// datasets: ['Gasolina Comum', 'Diesel S-10', 'Gasolina Aditivada', 'Etanol Hidratado', 'Diesel S-500', (Arla 32?)]
```

Paleta série: `[#0073BB, #EC7211, #6B40C4, #1D8102, #0891b2, #db2777]`

Gradientes por série: `color + '80'` → `color + '10'` (mesmo padrão)

Y-axis: modo volume → `(v/1000).toFixed(1)+'k L'`; modo receita → `fmtBRLk(v)`

Tooltip: modo volume → `value.toLocaleString('pt-BR') + ' L'`; receita → `fmtBRL(v)`

`#comb-evo-desc` (card-desc dinâmico): `"{Volume|Receita} por produto · {period.label.toLowerCase()}"`

### Donut: Mix de Combustível

- Total: modo volume → `"{total} L"`; receita → `fmtBRL(total)`
- Produtos: até 6 (incluindo Arla se toggle ativo)
- Cores: paleta `PROD_COLORS = ['#0073BB','#EC7211','#6B40C4','#1D8102','#0891b2','#db2777']`
- Pct legenda: `(product[metric]/donutTotal*100).toFixed(1) + '%'`

### Tabela: Breakdown por produto

Colunas: Produto | Volume | Part.% | Receita | Margem % | Preço/L | Custo/L | Tendência 14d

- Volume: `Math.round(value).toLocaleString('pt-BR')`
- Part.%: `(volume/totVol*100).toFixed(1) + '%'`
- Preço/L e Custo/L: `.mono` + `value.toFixed(2).replace('.',',')`
- Tendência: `<div class="spark-cell"><canvas id="comb-spark-{i}" /> <span class="trend-*">{arrow} {pct}%</span></div>`
  - Canvas 72×22px renderizado com Recharts `<LineChart>` ou via hook de mini-chart
  - Cor do spark: trend > 0 → `#16a34a`; trend < 0 → `#dc2626`; else `#64748b`

### EmptyState: Ranking de Bicos

```
ícone: clock (watch) 20×20
título: "Disponível em breve"
desc: "Vai destacar bombistas com performance acima e abaixo da média da rede."
```

**Critério de aceite:** dois segment controls na page-head. Chart tall 320px com múltiplas séries. Donut label muda entre L e R$. Tabela com spark canvas em célula.

---

## Bloco 15 — Página: Conveniência & Serviços (`/conveniencia`)

**Referência:** HTML linhas 951–1031, app.js `renderConveniencia()` linhas 287–412

### Estrutura

```
page-head
  h1 "Conveniência & Serviços"
  sub "Loja, lubrificantes e serviços — período selecionado."
  page-actions:
    segment #conv-view: Todos | Conveniência | Serviços | Lubrificantes

kpi-grid kpi-4 (4 cards)

row row-3-2
  card "Receita × Margem Bruta" (chart-box 280px)    ← convArea
  card "Mix da Loja" (donut)

card "Matriz de Categorias" (chart-box tall 320px)   ← scatter com quadrantes

card "Breakdown por categoria" (tabela clickable)
```

### KPIs (4 cards)

| id | Label (muda com view) | Spark color |
|----|----------------------|-------------|
| `kv-rec` | "Receita Conv. + Serv." / "Receita Conveniência" / "Receita Serviços" / "Receita Lubrificantes" | accentColor |
| `kv-mg` | Margem Bruta | `#16a34a` |
| `kv-mp` | Margem % | accentColor (deltaPP) |
| `kv-tk` | Ticket Médio | accentColor |

accentColor por view: `todos→#0073BB`, `loja→#EC7211`, `servicos→#0891b2`, `lub→#6B40C4`

Ticket: `totRec / Math.max(1, totQtd)` → `'R$ ' + value.toFixed(2).replace('.',',')`

### Chart: Receita × Margem Bruta

Equivalente ao `convArea()` (charts.js linhas 245–271):

```tsx
// receita: #EC7211, gradiente EC7211 80→10
// margemBruta: #16a34a, gradiente 16a34a 80→10
// ambos fill origin, sem pontos
// legendas na base
// scaleEvo: todos=1, loja=0.5, servicos=0.3, lub=0.2
```

### Scatter: Matriz de Categorias

Equivalente ao `scatterQuadrants()` (charts.js linhas 273–344):

```tsx
// Recharts ScatterChart com plugin custom para quadrantes
// x-axis: quantidade vendida; y-axis: margem%
// radius das bolhas: Math.max(5, Math.sqrt(rev / 200))
// cores por ponto: p.color + 'cc' (fill), p.color (stroke)
// Quadrante labels (9.5px, 600):
//   top-right: "ESTRELAS"
//   top-left: "QUESTIONÁVEIS"
//   bottom-left: "CAIXA"
//   bottom-right: "VOLUME"
// Linhas medianas: strokeDasharray="3 3", cor: token.tick + '66'
// Tints: top-right rgba(22,163,74,0.04), bottom-left rgba(220,38,38,0.04)
// Sem legend nativa
// Tooltip: nome, qtd, margem%, receita
```

### Tabela: Breakdown por categoria

Colunas: Categoria | Peso | Qtd | Receita | CMV | Margem | Margem %

- Segmento com dot colorido
- Peso: bar-cell com cor do grupo
- Margem %: `<b>{value}%</b>`
- `tr.clickable` → `openConvCatDrillDown(g)`
- Tfoot: TOTAL

**Critério de aceite:** 4-option segment no page-head. Scatter com quadrantes e linhas medianas. Drawer de categoria mostra produtos com barra de progresso. Labels dos quadrantes visíveis.

---

## Bloco 16 — Página: DRE Mensal (`/dre`)

**Referência:** HTML linhas 1033–1074, app.js `renderDRE()` linhas 416–484

### Estrutura

```
page-head
  h1 "DRE Mensal"
  sub "Demonstrativo de resultado por mês — receita, deduções, CMV e margem bruta."
  (sem page-actions)

kpi-grid kpi-4 (4 cards)

row row-1-1
  card "Waterfall do mês" (chart-box tall 320px)
  card "Margem % — últimos 6 meses" (chart-box tall 320px)

card "Detalhamento mês a mês" (tabela com 8 colunas)
```

**Topbar ao entrar em DRE:** period tabs desaparece, DRE toolbar aparece.

### KPIs (4 cards)

| id | Label | Nota |
|----|-------|------|
| `kd-rec` | Receita Bruta | dM = (cur/prev-1)*100 |
| `kd-cmv` | CMV | idem |
| `kd-mg` | Margem Bruta | idem |
| `kd-mp` | Margem % | dM = cur.margemPct - prev.margemPct; deltaPP |

Sparks: série de 6 meses (`series.map(m => m.receita)` etc.)

### Chart: Waterfall do mês

Equivalente ao `waterfall()` (charts.js linhas 347–399):

```tsx
items = [
  { label: 'Receita Bruta', type: 'start',  value: cur.receita },
  { label: '(−) Descontos', type: 'minus',  value: cur.desconto },
  { label: '(−) CMV',       type: 'minus',  value: cur.cmv },
  { label: 'Margem Bruta',  type: 'total',  value: cur.margem },
]

// start: barra azul (#0073BB) desde 0
// minus: barra vermelha (#dc2626) subindo de running-v a running
// total: barra verde (#16a34a) desde 0
// Helper invisible dataset para offset
// borderRadius 4px, maxBarThickness 28px, minBarLength 4px (positivos) 10px (negativos)
```

### Chart: Margem % últimos 6 meses

Equivalente ao `marginEvolution()` (charts.js linhas 402–427):

```tsx
// 4 séries: combustivel, conveniencia, lubrificantes, servicos
// cores: CHART_COLORS mapa
// pointRadius: 3; pointHoverRadius: 5
// fill: false
// y-axis: v + '%'
// legendas na base
```

### Tabela de DRE

**Colunas:** Linha | M-5 | M-4 | M-3 | M-2 | M-1 | Atual | δ | YTD

- Headers dinâmicos: `series[i].label` (ex: "Jan/26")
- Linhas:

| Linha | getter | Classe |
|-------|--------|--------|
| Receita Bruta | `m.receita` | `.dre-row` |
| (−) Descontos | `m.desconto` | `.dre-row` (prefixo "−") |
| Receita Líquida | `m.receitaLiq` | `.dre-row dre-row-total` |
| (−) CMV | `m.cmv` | `.dre-row` (prefixo "−") |
| Margem Bruta | `m.margem` | `.dre-row dre-row-result` |
| Margem % | `m.margemPct` | `.dre-row` (formato: `v.toFixed(1)+'%'`) |

```css
.dre-row td { padding: 12px 14px; }
.dre-row-total td { border-top: 2px solid hsl(var(--border)); font-weight: 600; background: hsl(var(--muted) / 0.4); }
.dre-row-result td {
  border-top: 2px solid hsl(var(--success) / 0.3);
  background: hsl(var(--success-subtle));
  font-weight: 700; color: hsl(var(--success));
}
html.dark .dre-row-result td { color: hsl(140 70% 60%); }
```

- Coluna δ: `deltaTag(delta, isPP)` — delta pct relativo vs mês anterior (ou pp para margem%)
- Coluna YTD: `fmtBRL(series.reduce((s,m) => s + getter(m), 0))` — exceto Margem % que exibe "—"
- Última coluna (Atual): `style="font-weight: 600"` inline

**Critério de aceite:** waterfall com 4 barras (azul, vermelho, vermelho, verde). Tabela com 8 colunas. Linha Margem Bruta em verde/success. Linha Receita Líquida com fundo muted.

---

## Bloco 17 — Página: Sincronização (`/sincronizacao`)

**Referência:** HTML linhas 1076–1110, app.js `renderSync()` linhas 487–508

### Estrutura

```
page-head
  h1 "Sincronização"
  sub "Status dos ERPs conectados e histórico das últimas execuções."
  page-actions: btn-primary [Sincronizar agora] ← btn-sync-2

sync-grid (2 colunas, gap gap-grid)
  card sync-card: Status · Status ERP
  card sync-card: Status · WebPosto ERP

card "Histórico de execuções" (sync-list)
```

**Topbar:** period tabs hidden, DRE toolbar hidden, location select hidden.

### Status cards

```css
.sync-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid); }
.sync-card { padding: var(--pad-card); }
.sync-status-row { display: flex; align-items: center; gap: 10px; margin-top: 12px; }
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
.sync-stat { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
.sync-stat b   { color: hsl(var(--foreground)); font-weight: 600; }
```

**Card Status ERP:**
- `card-title`: "Status · Status ERP"
- `sync-stat`: "Agente RDP — Windows Server · v2.4.1"
- `sync-status-row`: dot.ok + "Conectado" + badge-success "Última sync OK"
- `sync-stat`: "Próxima sync agendada: 03:00 BRT · 4 locations · watermark: 16/05 22:48"

**Card WebPosto:**
- `card-title`: "Status · WebPosto ERP"
- `sync-stat`: "API REST (Quality Automação)"
- `sync-status-row`: dot.warn + "Sem locations" + badge-warning "Aguardando contrato"
- `sync-stat`: "Conector implantado · nenhuma rede com WebPosto ainda."

### Histórico de execuções

```css
.sync-list { display: flex; flex-direction: column; }
.sync-row {
  display: flex; align-items: center; gap: 14px;
  padding: 12px 20px; border-bottom: 1px solid hsl(var(--border));
  font-size: 12px;
}
.sync-row:last-child { border-bottom: 0; }
.sync-time { color: hsl(var(--muted-foreground)); font-family: 'Geist Mono', monospace; font-size: 11px; min-width: 130px; }
.sync-loc  { font-weight: 500; min-width: 130px; }
.sync-recs { margin-left: auto; color: hsl(var(--muted-foreground)); font-variant-numeric: tabular-nums; }
```

Cada row: `dot (8×8px)` + `sync-time` + `sync-loc` + badge (ok→success, warn→warning, err→danger) + nota opcional + `sync-recs "{n} registros"`

Dados do protótipo (na implementação real: `GET /api/v1/sync/status`):
```
16/05 03:00:12 · JAM Centro  · ok   · 1248 registros
16/05 03:00:08 · JAM Rodovia · ok   · 1612 registros
16/05 03:00:05 · JAM Norte   · ok   · 642 registros
16/05 03:00:02 · JAM Sul     · ok   · 411 registros
15/05 03:01:38 · JAM Centro  · warn · 1216 · "retry 1×"
...
```

**Critério de aceite:** dot.ok com pulse animation. sync-grid em 2 colunas. Histórico com mono timestamp. badge correto por status.

---

## Bloco 18 — Página: Configurações (`/configuracoes`)

**Referência:** HTML linhas 1112–1165, app.js `renderConfig()` linhas 511–523

### Estrutura

```
page-head
  h1 "Configurações"
  sub "Tenant, locations, usuários e integrações."

cfg-grid (2 colunas)
  card (padding pad-card): Tenant
  card (padding pad-card): Integração — Status ERP

card: Locations (card-h com border-bottom + cfg-loc-list)

card: Usuários (card-h com border-bottom + cfg-loc-list)
```

**Topbar:** period tabs hidden, DRE toolbar hidden, location select hidden.

### CSS

```css
.cfg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-grid); }
.cfg-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid hsl(var(--border)); }
.cfg-row:last-child { border-bottom: 0; }
.cfg-label { font-size: 12px; color: hsl(var(--muted-foreground)); }
.cfg-value { font-size: 13px; font-weight: 500; color: hsl(var(--foreground)); display: flex; align-items: center; gap: 8px; }
.cfg-loc-list { display: flex; flex-direction: column; }
.cfg-loc-row { display: flex; align-items: center; gap: 12px; padding: 12px 20px; border-bottom: 1px solid hsl(var(--border)); }
.cfg-loc-row:last-child { border-bottom: 0; }
.cfg-loc-avatar { width: 32px; height: 32px; border-radius: 6px; background: hsl(var(--primary-subtle)); color: hsl(var(--primary)); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.cfg-loc-name { font-size: 13px; font-weight: 500; color: hsl(var(--foreground)); }
.cfg-loc-meta { font-size: 11px; color: hsl(var(--muted-foreground)); margin-top: 2px; }
```

### Card Tenant

| Label | Valor |
|-------|-------|
| Nome da rede | "Rede JAM" |
| Plano | badge-primary "Pro" · "até 8 locations" |
| Fuso horário | `.mono` "America/Sao_Paulo" |
| Idioma | "Português (Brasil)" |
| Tenant ID | `.mono` "tnt_2J9X4mWqK7" |

### Card Integração

| Label | Valor |
|-------|-------|
| Host | `.mono` "10.0.42.18:1433" |
| Database | `.mono` "JAM_PROD" |
| Usuário | `.mono` "postoinsight_ro" |
| Watermark | `.mono` "16/05 22:48" |
| Agente | badge-success "v2.4.1" |

### Card Locations

`card-h` com `style="border-bottom: 1px solid hsl(var(--border))"` + title "Locations" + desc "4 unidades configuradas"

Cada location: avatar (2 letras, bg primary-subtle, cor primary) + nome + meta + badge-success "OK"

### Card Usuários

`card-h` com border-bottom + title "Usuários" + desc "3 usuários ativos"

| Avatar | Nome | Meta | Badge |
|--------|------|------|-------|
| Gradiente (#0073BB→#6B40C4), "IK" | Isabela Kraus | isabela@... · acesso a todas | badge-primary "owner" |
| Muted bg, "MR" | Marcelo Ribeiro | marcelo@... · JAM Rodovia | badge "manager" |
| Muted bg, "WM" | Walter Moraes | walter@... · read-only | badge "viewer" |

Avatar owner: `background: linear-gradient(135deg, #0073BB, #6B40C4); color: white`
Avatar demais: `background: hsl(var(--primary-subtle)); color: hsl(var(--primary))`

**Critério de aceite:** cfg-grid em 2 colunas. cfg-row com border-bottom (exceto last). card-h com border-bottom inline nos cards de Locations e Usuários. Avatar owner com gradiente.

---

## Bloco 19 — Página: Login (`/login`)

> Não existe no protótipo HTML (protótipo já começa autenticado). Design a derivar do mesmo design system.

### Estrutura mínima

```
body (display: flex; align-items: center; justify-content: center; background: hsl(var(--background)))
  <div class="card" style="width: 380px; padding: 32px">
    logo PostoInsight (SVG 30×30 + nome)
    h2 "Entrar na sua conta" (18px, font-weight 600)
    form
      label + input[email] (classe .input, width 100%)
      label + input[password] (classe .input, width 100%)
      btn-primary w-full "Entrar"
    link "Esqueci a senha"
```

**Auth flow:**
1. `POST /auth/login` com `{ email, password }`
2. Fastify seta cookie HttpOnly
3. Redirecionar para `/`

**Critério de aceite:** formulário centrado na tela. Mesmo design system (vars, fontes). Sem sidebar ou topbar.

---

## Bloco 20 — Gerenciamento de estado React

**Referência:** app.js linhas 11–23 (`state` global)

### Estado global (React Context ou Zustand)

```ts
interface AppState {
  page: string;              // 'visao-geral' | 'combustivel' | 'conveniencia' | 'dre' | 'sincronizacao' | 'configuracoes'
  period: string;            // 'hoje' | 'semana' | 'mes' | 'mes-ant'
  location: string;          // 'all' | locationId
  topSort: 'receita' | 'margem';
  combMode: 'volume' | 'receita';
  convView: 'todos' | 'loja' | 'servicos' | 'lub';
  includeArla: boolean;
  dre: { year: number; monthIdx: number };  // default: { year: 2026, monthIdx: 4 }
  theme: 'light' | 'dark';
  density: 'comfortable' | 'compact';
  sparklines: boolean;
}
```

### TanStack Query

Todos os fetches de dados reais usam `useQuery` com `staleTime` adequado:

```ts
// Exemplo: KPIs da Visão Geral
const { data } = useQuery({
  queryKey: ['kpis', 'visao-geral', period, location],
  queryFn: () => api.get(`/api/v1/vendas/resumo?period=${period}&locationId=${location}`),
  staleTime: 5 * 60 * 1000,  // 5 minutos
});
```

**Critério de aceite:** mudar período ou location dispara re-fetch. Loading state exibe skeleton ou spinner. Error state exibe mensagem adequada.

---

## Bloco 21 — Formatação de valores

**Referência:** data.js linhas 443–454, app.js uso em todas as tabelas

```ts
// Equivalentes das funções do protótipo
function fmtBRL(v: number): string {
  if (v >= 1e6) return 'R$ ' + (v/1e6).toFixed(2).replace('.', ',') + ' mi';
  if (v >= 1e3) return 'R$ ' + Math.round(v/1e3).toLocaleString('pt-BR') + 'k';
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

function fmtBRLFull(v: number): string {
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR');
}

function fmtInt(v: number): string {
  return Math.round(v).toLocaleString('pt-BR');
}

function fmtPct(v: number, d = 1): string {
  return v.toFixed(d).replace('.', ',') + '%';
}

// Aplicado em toFixed(1).replace('.', ',') — SEMPRE vírgula decimal
```

**Critério de aceite:** nenhum valor usa ponto decimal — sempre vírgula. Valores acima de 1000 usam sufixo "k". Acima de 1.000.000 usam "mi".

---

## Checklist de implementação

### Setup inicial
- [ ] Scaffold Vite + React + TypeScript (`apps/web`)
- [ ] Instalar dependências: Recharts, TanStack Query v5, React Router v6, Lucide React
- [ ] Configurar Tailwind CSS v4 com `@import "tailwindcss"` + `@theme inline`
- [ ] Criar `globals.css` com todos os tokens (Bloco 0)
- [ ] Configurar fonte Geist via Google Fonts

### Componentes base (sem dados)
- [ ] `AppShell` — layout flex body (Bloco 1)
- [ ] `Sidebar` — navegação completa (Bloco 2)
- [ ] `Topbar` — com todos os controles (Bloco 3)
- [ ] `Sparkline` — SVG inline (Bloco 6)
- [ ] `KpiCard` — com sparkline e deltas (Bloco 5)
- [ ] `Drawer` + `DrawerOverlay` (Bloco 10)
- [ ] `Toast` (Bloco 10)
- [ ] `Badge` — todas as variantes (Bloco 10)
- [ ] `EmptyState` (Bloco 10)

### Componentes de chart (Recharts)
- [ ] `LineAreaChart` — revenueDual (Bloco 13)
- [ ] `MultiLineChart` — combLines + marginEvolution (Blocos 14, 16)
- [ ] `DonutChart` — 72% cutout, custom legend (Bloco 9)
- [ ] `WaterfallChart` — DRE (Bloco 16)
- [ ] `ScatterChart` — quadrantes Conveniência (Bloco 15)
- [ ] `TinySparkline` — canvas 72×22 para tabelas (Bloco 8)
- [ ] `Heatmap` — CSS Grid puro (Bloco 10)

### Páginas
- [ ] `PageVisaoGeral` (Bloco 13)
- [ ] `PageCombustivel` (Bloco 14)
- [ ] `PageConveniencia` (Bloco 15)
- [ ] `PageDRE` (Bloco 16)
- [ ] `PageSincronizacao` (Bloco 17)
- [ ] `PageConfiguracoes` (Bloco 18)
- [ ] `PageLogin` (Bloco 19)

### Auth
- [ ] `GET /auth/me` no carregamento
- [ ] `POST /auth/login` no formulário de login
- [ ] Redirect para `/login` se não autenticado
- [ ] Cookie HttpOnly (automático — browser envia)

---

*Documento gerado em 2026-05-18. Atualizar conforme divergências identificadas durante implementação.*

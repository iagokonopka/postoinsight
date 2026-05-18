# PostoInsight — Design Tokens

> Fonte de verdade para todos os valores de design.  
> Todo token tem um nome semântico, um valor light e um valor dark.  
> Nunca use valores hardcoded no código — sempre referencie pelo token.  
> Última atualização: 2026-05-18

---

## Como os tokens funcionam

Os tokens são variáveis CSS definidas em `apps/web/src/styles/globals.css` e registradas como extensão de tema em `tailwind.config.ts`. Toda classe Tailwind derivada deles (`bg-card`, `text-foreground`, `border-border`) usa automaticamente o valor correto para o tema ativo (light/dark).

```css
/* globals.css — padrão de uso */
:root { --primary: 204 100% 37%; }
html.dark { --primary: 204 100% 55%; }

/* No componente */
className="bg-primary text-primary-foreground"
/* Ou diretamente em CSS */
background: hsl(var(--primary));
```

---

## 1. Paleta de Cores — Tokens Semânticos

### Base

| Token CSS | Tailwind class | Light | Dark | Uso |
|-----------|---------------|-------|------|-----|
| `--background` | `bg-background` | `hsl(210 40% 98%)` `#F8FAFC` | `hsl(222 47% 5%)` `#060914` | Fundo da content area |
| `--foreground` | `text-foreground` | `hsl(222 47% 11%)` `#0F172A` | `hsl(210 40% 98%)` `#F8FAFC` | Texto principal |
| `--card` | `bg-card` | `hsl(0 0% 100%)` `#FFFFFF` | `hsl(222 40% 8%)` `#0D1321` | Fundo de cards |
| `--card-foreground` | `text-card-foreground` | `hsl(222 47% 11%)` | `hsl(210 40% 98%)` | Texto dentro de cards |
| `--border` | `border-border` | `hsl(214 32% 91%)` `#E2E8F0` | `hsl(215 25% 16%)` `#1E2D3D` | Bordas e divisórias |
| `--input` | `border-input` | `hsl(214 32% 91%)` | `hsl(215 25% 16%)` | Borda de inputs |
| `--ring` | `ring-ring` | `hsl(204 100% 37%)` | `hsl(204 100% 55%)` | Focus ring |

### Muted (secundário)

| Token CSS | Tailwind class | Light | Dark | Uso |
|-----------|---------------|-------|------|-----|
| `--muted` | `bg-muted` | `hsl(210 40% 96%)` `#F1F5F9` | `hsl(215 25% 14%)` `#182030` | Fundo de linhas alternadas, estados hover suaves |
| `--muted-foreground` | `text-muted-foreground` | `hsl(215 16% 47%)` `#64748B` | `hsl(215 16% 60%)` `#8FA3B8` | Texto secundário, labels, metadados |

### Primary (cor de marca)

| Token CSS | Tailwind class | Light | Dark | Uso |
|-----------|---------------|-------|------|-----|
| `--primary` | `bg-primary` | `hsl(204 100% 37%)` `#0073BB` | `hsl(204 100% 55%)` `#1AA3FF` | Ações primárias, links, destaque |
| `--primary-foreground` | `text-primary-foreground` | `hsl(0 0% 100%)` | `hsl(0 0% 100%)` | Texto sobre fundo primary |
| `--primary-subtle` | `bg-primary-subtle` | `hsl(204 100% 95%)` `#E6F4FF` | `hsl(204 50% 18%)` `#0D2D47` | Fundo de badges, highlights sutis |

### Sidebar

| Token CSS | Uso |
|-----------|-----|
| `--sidebar` `hsl(217 33% 17%)` `#1E2D44` (dark: `hsl(222 50% 6%)` `#090E1A`) | Fundo da sidebar |
| `--sidebar-foreground` `hsl(210 40% 96%)` | Texto na sidebar |
| `--sidebar-muted` `hsl(215 25% 27%)` `#2D3F57` | Separadores e hover na sidebar |
| `--sidebar-active` `hsl(204 100% 55%)` `#1AA3FF` | Cor do item ativo (ícone + indicador) |
| `--sidebar-active-bg` `hsl(222 50% 10%)` `#0D1829` | Fundo do item ativo |

### Semânticos (status)

| Token CSS | Tailwind class | Valor | Dark | Uso |
|-----------|---------------|-------|------|-----|
| `--success` | `text-success` | `hsl(142 71% 45%)` `#22C55E` | mesmo | Delta positivo, status ok, margem boa |
| `--warning` | `text-warning` | `hsl(38 92% 50%)` `#F59E0B` | mesmo | Alertas, sync atrasado |
| `--danger` | `text-danger` | `hsl(0 84% 60%)` `#EF4444` | mesmo | Delta negativo, erro, alerta crítico |
| `--success-subtle` | `bg-success-subtle` | `hsl(138 76% 97%)` `#F0FDF4` | `hsl(142 30% 14%)` | Fundo de badge success |
| `--warning-subtle` | `bg-warning-subtle` | `hsl(48 100% 96%)` `#FFFBEB` | `hsl(38 60% 14%)` | Fundo de badge warning |
| `--danger-subtle` | `bg-danger-subtle` | `hsl(0 86% 97%)` `#FEF2F2` | `hsl(0 50% 16%)` | Fundo de badge danger |

### Popover / Overlay

| Token CSS | Light | Dark |
|-----------|-------|------|
| `--popover` | `hsl(0 0% 100%)` | `hsl(222 40% 8%)` |
| `--popover-foreground` | `hsl(222 47% 11%)` | `hsl(210 40% 98%)` |

---

## 2. Paleta de Segmentos (gráficos)

Cores fixas — não mudam entre light/dark. São as cores de identidade de cada segmento do negócio.

| Token JS | Valor | Segmento |
|----------|-------|---------|
| `CHART_COLORS.combustivel` | `#0073BB` | Combustível (= primary) |
| `CHART_COLORS.conveniencia` | `#EC7211` | Conveniência |
| `CHART_COLORS.lubrificantes` | `#6B40C4` | Lubrificantes |
| `CHART_COLORS.servicos` | `#0891B2` | Serviços |
| `CHART_COLORS.arla` | `#1D8102` | Arla 32 |
| `CHART_COLORS.positive` | `#16A34A` | Valores positivos em waterfall |
| `CHART_COLORS.negative` | `#DC2626` | Valores negativos em waterfall |

Série adicional (quando precisar de mais cores): `#DB2777`, `#D97706`, `#7C3AED`

---

## 3. Tipografia

### Fontes

| Variável | Fonte | Fallback | Uso |
|----------|-------|---------|-----|
| `--font-sans` | `'Geist'` | `system-ui, -apple-system, sans-serif` | Todo texto da interface |
| `--font-mono` | `'Geist Mono'` | `'JetBrains Mono', monospace` | Valores numéricos em tabelas, código |

### Feature settings
```css
body {
  font-feature-settings: 'cv11', 'ss01'; /* Geist: forma alternativa do 1 e letras */
  -webkit-font-smoothing: antialiased;
}
.mono { font-feature-settings: 'tnum' 1; } /* tabular-nums para alinhamento */
```

### Escala

| Classe Tailwind | Tamanho | Line-height | Uso |
|----------------|---------|------------|-----|
| `text-[11px]` | 11px | 1.4 | Labels de KPI, th de tabela, badge, section label sidebar |
| `text-sm` | 13px | 1.5 | Corpo principal, td de tabela, itens sidebar, descrições |
| `text-base` | 14px | 1.5 | Base do `<body>` |
| `text-[15px]` | 15px | 1.4 | Títulos de drawer, subtítulos de seção |
| `text-lg` | 16px | 1.3 | Card title principal, DRE month label |
| `text-xl` | 20px | 1.2 | Page title |
| `text-2xl` | 24px | 1.1 | KPI value (modo default) |
| `text-[20px]` | 20px | 1.1 | KPI value (modo compact) |

### Pesos

| Classe | Peso | Uso |
|--------|------|-----|
| `font-normal` | 400 | Corpo, texto secundário |
| `font-medium` | 500 | Itens de navegação, labels de filtro, texto de badge |
| `font-semibold` | 600 | Page title, card title, KPI value, cabeçalho de tabela quando bold |
| `font-bold` | 700 | DRE result row, totais, valores de destaque máximo |

---

## 4. Espaçamento e Densidade

O sistema usa escala compacta. Os valores abaixo são os tokens de densidade — registrados como CSS variables e usados como classes Tailwind customizadas.

| Token CSS | Valor compacto | Uso |
|-----------|---------------|-----|
| `--pad-card` | `16px` | Padding horizontal interno de cards |
| `--pad-card-y` | `14px` | Padding vertical interno de cards |
| `--gap-grid` | `14px` | Gap entre cards na grid |
| `--gap-row` | `16px` | Gap entre seções verticais da página |
| `--kpi-pad` | `14px` | Padding interno do KPI card |
| `--kpi-val-size` | `22px` | Tamanho da fonte do valor principal do KPI |
| `--row-pad-y` | `10px` | Padding vertical de linhas de tabela |

### Espaçamentos fixos de estrutura

| Elemento | Valor |
|----------|-------|
| Sidebar width | `240px` (`w-60`) |
| Topbar height | `52px` |
| Page header height | `56px` (com filtros) ou `48px` (sem filtros) |
| Content padding | `p-5` (20px) |
| Chart height padrão | `260px` |
| Chart height tall | `300px` |
| Chart height short (sparkline section) | `180px` |
| KPI card min-height | `108px` |
| Drawer width | `420px` |
| Button height | `32px` (`h-8`) |
| Input height | `32px` (`h-8`) |
| Avatar size | `28px` |

---

## 5. Bordas e Raios

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--radius` | `0.5rem` / `8px` | Cards, dropdowns, modais, tooltips |
| `--radius-sm` | `0.3rem` / `5px` | Badges, chips, pequenos elementos |
| `--radius-full` | `999px` | Avatares, dots de status, pills |

```css
/* Tailwind config */
borderRadius: {
  DEFAULT: 'var(--radius)',
  sm: 'var(--radius-sm)',
  full: '999px',
}
```

---

## 6. Sombras

| Token CSS | Valor | Uso |
|-----------|-------|-----|
| `--shadow-sm` | `0 1px 2px 0 hsl(222 47% 11% / 0.05)` | Cards padrão |
| `--shadow` | `0 1px 3px 0 hsl(222 47% 11% / 0.08), 0 1px 2px -1px hsl(222 47% 11% / 0.08)` | Cards com elevação |
| `--shadow-md` | `0 4px 6px -1px hsl(222 47% 11% / 0.08), 0 2px 4px -2px hsl(222 47% 11% / 0.08)` | Drawer, dropdown, modal |

No dark mode, as sombras são substituídas por bordas mais visíveis — sombra preta sobre preto não funciona.

---

## 7. Animações e Transições

| Elemento | Propriedade | Duração | Easing |
|----------|------------|---------|--------|
| Sidebar item hover | `background`, `color` | `120ms` | `ease` |
| Botão hover | `background`, `opacity` | `120ms` | `ease` |
| Drawer abertura | `transform` | `220ms` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Drawer overlay | `opacity` | `180ms` | `ease` |
| Toast entrada | `transform`, `opacity` | `200ms` | `ease` |
| Página (troca de seção) | `opacity` | `150ms` | `ease` |
| Gráfico (Recharts) | entrada padrão | `400ms` | Recharts default |
| Sync dot pulse | `transform`, `opacity` | `2000ms` | `ease` (loop) |

---

## 8. Scrollbar

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 999px; }
::-webkit-scrollbar-thumb:hover { background: hsl(var(--muted-foreground) / 0.5); }
```

---

## 9. tailwind.config.ts — Estrutura de implementação

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        card:        { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        muted:       { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        primary:     { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))', subtle: 'hsl(var(--primary-subtle))' },
        success:     { DEFAULT: 'hsl(var(--success))', subtle: 'hsl(var(--success-subtle))' },
        warning:     { DEFAULT: 'hsl(var(--warning))', subtle: 'hsl(var(--warning-subtle))' },
        danger:      { DEFAULT: 'hsl(var(--danger))',  subtle: 'hsl(var(--danger-subtle))' },
        sidebar:     {
          DEFAULT:   'hsl(var(--sidebar))',
          foreground:'hsl(var(--sidebar-foreground))',
          muted:     'hsl(var(--sidebar-muted))',
          active:    'hsl(var(--sidebar-active))',
          activeBg:  'hsl(var(--sidebar-active-bg))',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm:      'var(--radius-sm)',
        full:    '999px',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
      },
    },
  },
};

export default config;
```

---

*Este documento é a fonte de verdade. Qualquer token não listado aqui não existe no design system.*  
*Para adicionar um token: documentar aqui primeiro, depois implementar em `globals.css` e `tailwind.config.ts`.*

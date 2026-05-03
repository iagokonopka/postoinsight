# Design Tokens — PostoInsight

> Este arquivo é o contrato visual entre produto e frontend.
> O Claude Design deve usar **apenas** os tokens definidos aqui — nunca valores literais de cor, fonte ou espaçamento.
> Quando a identidade visual for definida, basta atualizar os valores neste arquivo.

---

## 1. Status dos Tokens

| Categoria | Status |
|-----------|--------|
| Marca / Branding | ⏳ Pendente — usar placeholders |
| Modo padrão | ✅ Light mode (dark mode opcional) |
| Densidade | ✅ Balanceada |
| Tipografia | ✅ Definida |

---

## 2. Identidade de Marca (Placeholders)

```
APP_NAME        = "PostoInsight"          ← substituir quando marca for definida
APP_TAGLINE     = "Inteligência para sua rede"
LOGO_PATH       = /logo.svg               ← arquivo placeholder até logo final
FAVICON_PATH    = /favicon.ico
```

> Nenhum componente deve hardcodar o nome "PostoInsight" — sempre usar `APP_NAME` via variável de ambiente ou constante centralizada.

---

## 3. Paleta de Cores

### 3.1 Cores Primárias (Placeholders — substituir com marca)

| Token | Placeholder | Uso |
|-------|-------------|-----|
| `--color-primary` | `#2563EB` (azul) | CTAs, links ativos, bordas de foco |
| `--color-primary-hover` | `#1D4ED8` | Hover de botões primários |
| `--color-primary-subtle` | `#EFF6FF` | Backgrounds de destaque suave |

> Estes valores são temporários. A cor primária será definida com a marca.

### 3.2 Cores de Surface (Neutros)

| Token | Light | Dark |
|-------|-------|------|
| `--color-bg` | `#FFFFFF` | `#0F172A` |
| `--color-bg-subtle` | `#F8FAFC` | `#1E293B` |
| `--color-bg-muted` | `#F1F5F9` | `#334155` |
| `--color-border` | `#E2E8F0` | `#334155` |
| `--color-border-subtle` | `#F1F5F9` | `#1E293B` |

### 3.3 Cores de Texto

| Token | Light | Dark |
|-------|-------|------|
| `--color-text` | `#0F172A` | `#F8FAFC` |
| `--color-text-muted` | `#64748B` | `#94A3B8` |
| `--color-text-subtle` | `#94A3B8` | `#475569` |
| `--color-text-inverse` | `#FFFFFF` | `#0F172A` |

### 3.4 Cores Semânticas (Estados)

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-success` | `#16A34A` | Sync OK, valores positivos |
| `--color-success-subtle` | `#F0FDF4` | Background de badge de sucesso |
| `--color-warning` | `#D97706` | Sync com atraso, alertas |
| `--color-warning-subtle` | `#FFFBEB` | Background de badge de alerta |
| `--color-danger` | `#DC2626` | Erros, sync falhou, valores negativos |
| `--color-danger-subtle` | `#FEF2F2` | Background de badge de erro |
| `--color-info` | `#0EA5E9` | Informações neutras |
| `--color-info-subtle` | `#F0F9FF` | Background de badge informativo |

### 3.5 Cores de Segmento (Gráficos)

Cores fixas para cada segmento de negócio — consistentes em todos os gráficos:

| Token | Valor | Segmento |
|-------|-------|---------|
| `--color-segment-combustivel` | `#2563EB` | Combustível |
| `--color-segment-lubrificantes` | `#7C3AED` | Lubrificantes |
| `--color-segment-servicos` | `#0891B2` | Serviços |
| `--color-segment-conveniencia` | `#D97706` | Conveniência |

---

## 4. Tipografia

### 4.1 Famílias

| Token | Valor | Uso |
|-------|-------|-----|
| `--font-sans` | `'Inter', system-ui, sans-serif` | Corpo, labels, UI |
| `--font-heading` | `'Inter', system-ui, sans-serif` | Headings (mesma família, peso diferente) |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', monospace` | Valores numéricos precisos, código |

> `Inter` é open source e disponível via Google Fonts. Substituir quando fonte de marca for definida.

### 4.2 Escala de Tamanhos

| Token | Tamanho | Peso | Uso |
|-------|---------|------|-----|
| `--text-xs` | `11px` | 400 | Labels de eixo em gráficos, badges |
| `--text-sm` | `13px` | 400 | Labels secundários, texto de tabela |
| `--text-base` | `14px` | 400 | Texto padrão de interface |
| `--text-md` | `15px` | 500 | Labels de campo, texto de destaque |
| `--text-lg` | `18px` | 600 | Subtítulos de seção |
| `--text-xl` | `24px` | 700 | KPI cards — valor principal |
| `--text-2xl` | `32px` | 700 | KPI card grande / hero number |
| `--text-heading` | `20px` | 600 | Títulos de página |

---

## 5. Espaçamento — Densidade Balanceada

| Token | Valor | Uso |
|-------|-------|-----|
| `--space-1` | `4px` | Gaps mínimos |
| `--space-2` | `8px` | Gap entre elementos inline |
| `--space-3` | `12px` | Padding interno de badge/chip |
| `--space-4` | `16px` | Gap padrão entre cards |
| `--space-5` | `20px` | Padding interno de card |
| `--space-6` | `24px` | Gap de seções |
| `--space-8` | `32px` | Padding de layout |
| `--space-12` | `48px` | Separação de seções maiores |

### Altura de linha de tabela: `44px`
### Padding de card: `20px`
### Gap entre cards: `16px`

---

## 6. Bordas e Raios

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-sm` | `4px` | Badges, chips, inputs |
| `--radius-md` | `8px` | Cards, botões |
| `--radius-lg` | `12px` | Modais, painéis |
| `--radius-xl` | `16px` | Cards de KPI, hero sections |
| `--border-width` | `1px` | Bordas padrão |

---

## 7. Sombras

| Token | Valor | Uso |
|-------|-------|-----|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Elevação mínima |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.10)` | Cards em repouso |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.07)` | Cards em hover |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.10)` | Dropdowns, modais |

---

## 8. Breakpoints

| Token | Valor | Contexto |
|-------|-------|---------|
| `--bp-sm` | `640px` | Mobile |
| `--bp-md` | `768px` | Tablet |
| `--bp-lg` | `1024px` | Desktop compacto |
| `--bp-xl` | `1280px` | Desktop padrão |
| `--bp-2xl` | `1536px` | Desktop largo |

> Foco de uso: desktop (`lg` e acima). Mobile deve funcionar mas não é prioridade no MVP.

---

## 9. Implementação no Next.js

Os tokens devem ser declarados como CSS custom properties no `globals.css`:

```css
:root {
  --color-primary: #2563EB;
  --color-bg: #FFFFFF;
  /* ... */
}

[data-theme="dark"] {
  --color-bg: #0F172A;
  /* ... */
}
```

O tema dark/light é controlado via `data-theme` no elemento `<html>`. A preferência do usuário é salva em `localStorage` e sincronizada com `prefers-color-scheme`.

---

*Última atualização: 2026-04-30 — tokens de marca são placeholders até definição da identidade visual.*

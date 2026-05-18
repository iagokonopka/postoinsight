# ADR-014 — Identidade Visual do PostoInsight

**Data:** 2026-05-18  
**Status:** Aceito  
**Autor:** Fundador + Claude  

---

## Contexto

O PostoInsight não possui identidade visual definida. O nome atual é provisório, não há logo, e a paleta de cores nunca foi decidida formalmente — apenas herdada de iterações anteriores sem critério.

Esta decisão estabelece a **identidade visual de trabalho** — um sistema coerente e profissional que será usado durante o desenvolvimento e que pode ser substituído por uma identidade de marca definitiva (nome, logo, cores reais) sem reescrita de componentes, apenas trocando os valores dos tokens.

A arquitetura de tokens garante essa troca: toda cor, fonte e espaçamento está em variáveis CSS, não hardcoded.

---

## Decisões

### 1. Layout estrutural: sidebar escura, conteúdo claro

O produto usa o padrão **dark sidebar + light content area** — o mesmo utilizado por Linear, Vercel Dashboard, Railway, e o próprio Shopify Admin.

**Por quê:**
- A sidebar escura cria uma separação visual clara entre navegação e conteúdo analítico
- O conteúdo claro maximiza a legibilidade de tabelas, números e gráficos — que são o núcleo do produto
- O contraste entre as duas zonas orienta o olho do usuário naturalmente: sidebar = onde estou, conteúdo = o que estou vendo
- Modo escuro completo é suportado — ambas as zonas mudam de forma coerente

### 2. Densidade: compacta

O padrão de densidade é **compacto** — mais informação por tela, espaçamentos reduzidos em relação ao padrão Tailwind.

**Por quê:**
- Donos e gestores de rede trabalham com o dashboard aberto ao longo do dia — a compacidade reduz o scroll e mantém mais KPIs visíveis simultaneamente
- O perfil de uso é análise rápida pela manhã ("como estão minhas vendas agora?") — não leitura relaxada
- Compacto não significa apertado: os espaçamentos são reduzidos mas mantêm hierarquia e respiração adequadas

**Valores de densidade compacta (vs padrão Tailwind):**
- Card padding: `16px` (vs 24px padrão)
- Gap entre seções: `16px` (vs 24px)
- Altura de linha de tabela: `40px` (vs 52px)
- Altura de inputs e botões: `32px` (vs 40px)
- KPI card min-height: `108px`

### 3. Cor primária: azul institucional

Cor primária: **`#0073BB`** (HSL `204 100% 37%`)

**Por quê:**
- Azul transmite confiança, precisão e dados — associações corretas para um produto de BI financeiro
- O tom específico (`#0073BB`) tem boa legibilidade como cor de destaque sobre fundos claros e escuros
- Está alinhado com o tom de azul usado em ferramentas de gestão consolidadas (AWS Console, Salesforce, Jira)
- É provisório por design: quando a identidade de marca real for definida, a troca é feita em um único lugar (`tailwind.config.ts`)

### 4. Tipografia: Geist

Fonte principal: **Geist** (sans-serif)  
Fonte mono: **Geist Mono**  
Fonte de fallback: `system-ui, -apple-system, sans-serif`

**Por quê:**
- Geist foi criada pela Vercel especificamente para interfaces de produto — não para texto corrido. É otimizada para tabular-nums, clareza em tamanhos pequenos e legibilidade em dashboards
- Geist Mono é a escolha natural para valores numéricos em tabelas e código — mantém alinhamento tabular perfeito
- O protótipo de referência já usa Geist com excelente resultado visual

**Escala tipográfica:**
| Token | Tamanho | Uso |
|-------|---------|-----|
| `text-xs` | 11px | Labels de KPI, cabeçalhos de tabela, badges |
| `text-sm` | 13px | Corpo principal, linhas de tabela, sidebar |
| `text-base` | 14px | Base do body |
| `text-lg` | 16px | Títulos de card, DRE month label |
| `text-xl` | 20px | Page title |
| `text-2xl` | 24px | KPI value principal |

### 5. Modo escuro

Modo escuro suportado via classe `dark` no `<html>`. Todos os tokens têm variante dark definida. O toggle é persistido em `localStorage`.

O modo escuro não é apenas inversão de cores — tem sua própria paleta calibrada para contraste adequado em ambientes com pouca luz.

### 6. Iconografia: Lucide Icons

Biblioteca de ícones: **Lucide React**

**Por quê:**
- Linha fina, stroke-width uniforme (`1.6`–`1.8`) — visualmente coerente com a leveza do design
- Cobertura completa para todos os casos do produto (navegação, status, ações, categorias)
- Já é dependência padrão do ecossistema Shadcn/ui
- Tree-shakeable — apenas os ícones usados entram no bundle

---

## O que esta decisão NÃO define

- Nome definitivo do produto (PostoInsight é provisório)
- Logo (ainda não existe)
- Cores definitivas de marca (o azul atual é placeholder profissional)
- Identidade de comunicação externa (marketing, landing page)

Quando a identidade de marca real for definida, a atualização requer apenas:
1. Trocar os valores de `--primary` em `tailwind.config.ts`
2. Trocar a fonte se necessário
3. Trocar referências ao nome nas strings da UI

Nenhum componente ou padrão de layout precisará mudar.

---

## Consequências

- `tailwind.config.ts` é a única fonte de verdade para tokens de cor e tipografia
- Geist deve ser carregada via Google Fonts ou self-hosted em `apps/web/public/fonts/`
- Lucide React é instalado como dependência (`pnpm add lucide-react`)
- Modo escuro implementado via `class` strategy no Tailwind (não `media`)
- Todo novo componente deve usar os tokens — nunca cores hardcoded

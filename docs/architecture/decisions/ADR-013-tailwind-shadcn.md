# ADR-013 — Estilização: Tailwind CSS + Shadcn/ui

**Data:** 2026-05-16
**Status:** Aceito

---

## Contexto

O `apps/web` foi scaffoldado com CSS variables próprias (`tokens.css`) e componentes estilizados manualmente. Essa abordagem funcionou para o MVP inicial, mas apresenta limitações de escala:

- Componentes de formulário, modal, select, tooltip, dropdown construídos do zero — sem acessibilidade garantida
- Inconsistência visual conforme o produto cresce e novos componentes são adicionados
- Custo alto de manutenção: cada novo componente exige estilização completa manual
- Sem design system estabelecido — dificulta colaboração e onboarding futuro

O padrão de mercado para SaaS B2B moderno (análogo ao Shopify Admin com Polaris) é um design system baseado em primitivos acessíveis com estilização utilitária.

---

## Decisão

**Tailwind CSS v4 + Shadcn/ui**

- **Tailwind CSS** substitui o CSS manual como sistema de estilização utilitária
- **Shadcn/ui** fornece os componentes de UI (Button, Input, Select, Dialog, Table, etc.) — copiados diretamente para o repositório, não instalados como dependência
- Os tokens de design atuais (`tokens.css`) são migrados para `tailwind.config` como CSS variables customizadas — preservando a identidade visual aprovada

---

## Justificativa

| Critério | CSS manual atual | Tailwind + Shadcn |
|----------|-----------------|-------------------|
| Acessibilidade (a11y) | Manual — propenso a gaps | Radix UI por baixo — keyboard nav, ARIA, focus trap |
| Componentes prontos | Zero | Button, Input, Select, Dialog, Table, Tabs, Toast, etc. |
| Consistência visual | Depende de disciplina | Enforced pelo design system |
| Customização | Total (mas custosa) | Total — é código próprio, não dependência |
| Bundle size | Pequeno | Tailwind purge = zero CSS não usado |
| DX | Troca entre arquivos CSS | Classes inline, co-located com o componente |
| Manutenção | Alta | Baixa — componentes padronizados |

### Por que não Polaris (Shopify)?

Polaris é feito para e-commerce admin — seus padrões de layout e terminologia não encaixam em BI. Além disso, impõe o visual do Shopify, o que conflita com a identidade própria do PostoInsight.

### Por que não MUI / Ant Design?

Impõem design system externo difícil de sobrescrever. Bundle grande. Visual genérico.

### Por que Shadcn e não outra lib Tailwind?

Shadcn não é uma dependência — é código copiado. Isso significa:
- Zero lock-in
- Customização total (o componente é seu)
- Nenhum conflito com atualizações de versão

---

## Alternativas descartadas

| Alternativa | Motivo |
|-------------|--------|
| Manter CSS variables manual | Não escala — sem primitivos acessíveis, custo alto de novos componentes |
| Polaris (Shopify) | Feito para e-commerce, não BI. Visual Shopify indesejado. |
| MUI / Ant Design | Lock-in de design, bundle pesado, difícil de customizar |
| Mantine | Boa opção, mas usa CSS Modules — não aproveita Tailwind. Shadcn tem ecossistema maior. |

---

## Consequências

- `apps/web` passa a usar Tailwind CSS v4
- `tokens.css` é migrado para `tailwind.config.ts` como extensão de tema (cores, tipografia, espaçamentos preservados)
- Componentes existentes em `src/components/` são reescritos com classes Tailwind + Shadcn onde aplicável
- Componentes ECharts (`src/components/charts/`) **não são afetados** — ECharts é independente de CSS (ADR-011 seguro)
- Componentes Shadcn ficam em `src/components/ui/` — convenção padrão do ecossistema
- `global.css` mantido apenas para reset base e import dos tokens como CSS variables

---

## Impacto em outros ADRs

- ADR-010 (Vite + React): sem impacto — Tailwind funciona nativamente com Vite
- ADR-011 (ECharts): sem impacto — ECharts usa canvas, não CSS
- ADR-012 (Auth SPA): sem impacto — autenticação é lógica, não visual

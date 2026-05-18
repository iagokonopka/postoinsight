# ADR-015 — Design System: Fonte de Verdade e Governança

**Data:** 2026-05-18  
**Status:** Aceito  
**Autor:** Fundador + Claude  

---

## Contexto

O projeto acumulou documentação de design fragmentada e inconsistente — tokens definidos em CSS, referências a componentes em prompts de agente, decisões visuais espalhadas em comentários de código. Isso resulta em inconsistência visual entre telas e obriga o agente frontend a "adivinhar" o que não está documentado.

Este ADR define **onde o design system vive, o que ele cobre e como os agentes devem usá-lo**.

---

## Decisão

O design system do PostoInsight é composto por **quatro camadas obrigatórias**, cada uma com um documento próprio:

```
docs/design/
  ADR-011-charts-revisado.md   ← decisão: qual biblioteca de gráficos e por quê
  ADR-014-identidade-visual.md ← decisão: tipografia, cores, densidade, modo escuro
  ADR-015-design-system.md     ← este arquivo: governança e estrutura
  tokens.md                    ← valores: todos os tokens de cor, espaço, tipo
  components.md                ← catálogo: cada componente com uso, variantes e regras
  patterns.md                  ← composição: como montar páginas e seções
```

E um **arquivo de referência visual vivo**:

```
design_example/postoinsight/
  PostoInsight.html            ← protótipo interativo navegável (fonte de verdade visual)
  app.js                       ← lógica de navegação e estado do protótipo
  charts.js                    ← implementação de referência dos gráficos
  data.js                      ← shapes dos dados mock
```

---

## Hierarquia de autoridade

Quando houver conflito entre fontes, a ordem de prioridade é:

1. **ADRs de design** (`ADR-011`, `ADR-014`, `ADR-015`) — decisões tomadas pelo fundador, imutáveis sem novo ADR
2. **`tokens.md`** — valores exatos que implementam as decisões dos ADRs
3. **`components.md`** — especificação de comportamento e composição
4. **`patterns.md`** — orientação de composição de página
5. **`PostoInsight.html`** — referência visual final quando os documentos acima não cobrem um caso

**O agente frontend nunca inventa.** Se um caso não está coberto pelos documentos acima, ele para e pergunta ao fundador.

---

## Regras de uso para o agente frontend

### Antes de implementar qualquer componente ou página:
1. Ler `docs/design/tokens.md` — entender os tokens disponíveis
2. Ler `docs/design/components.md` — verificar se o componente já tem spec
3. Ler `docs/design/patterns.md` — verificar se o padrão de layout já está definido
4. Se o componente existir no protótipo (`PostoInsight.html`) — seguir o comportamento visual dele fielmente

### Regras absolutas:
- **Nunca usar cor hardcoded.** Sempre `hsl(var(--token))` ou classe Tailwind derivada dos tokens
- **Nunca criar um componente visual sem spec em `components.md`.** Se não existe, adicionar antes de implementar
- **Nunca divergir do protótipo de referência** sem decisão explícita do fundador
- **Nunca usar outra biblioteca de gráficos** além de Recharts + SVG inline (ADR-011 rev.2)
- **Nunca usar outra biblioteca de componentes** além de Shadcn/ui (ADR-013)

---

## Como atualizar o design system

O design system é um documento vivo. Novas decisões seguem este fluxo:

**Mudança pequena** (novo componente, nova variante de componente existente):
→ Adicionar entrada em `components.md` + implementar

**Mudança de padrão** (novo layout de página, novo padrão de composição):
→ Adicionar entrada em `patterns.md` + implementar

**Mudança de token** (nova cor, novo espaçamento, nova escala tipográfica):
→ Atualizar `tokens.md` + atualizar `tailwind.config.ts` + verificar impacto em `components.md`

**Mudança de decisão** (trocar biblioteca, mudar paleta, mudar densidade):
→ Criar ou revisar ADR correspondente → atualizar todos os outros documentos afetados

---

## Estrutura de implementação no código

```
apps/web/
  src/
    components/
      ui/              ← Shadcn/ui — componentes base (Button, Input, Card, etc.)
      charts/          ← wrappers Recharts + SVG sparklines
      layout/          ← Sidebar, Topbar, AppShell, PageHeader
      shared/          ← KpiCard, DataTable, FilterBar, StatusBadge, etc.
    lib/
      chart-theme.ts   ← constantes de cor e estilo para todos os gráficos
      cn.ts            ← utility clsx + tailwind-merge
    styles/
      globals.css      ← CSS variables (tokens) + reset base
  tailwind.config.ts   ← fonte de verdade dos tokens — extend do tema Tailwind
```

---

## Consequências

- Qualquer agente que tocar em `apps/web` deve ler `docs/design/` completo antes de começar
- O protótipo `design_example/postoinsight/PostoInsight.html` é preservado indefinidamente como referência visual — nunca deletar
- Atualizações ao design system são documentadas antes de implementadas — não ao contrário
- O `CLAUDE.md` do projeto referencia explicitamente `docs/design/` como leitura obrigatória para o agente frontend

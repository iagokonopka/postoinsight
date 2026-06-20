# ADR-017 — Identidade visual "Executivo" (variant B)

- **Status:** Aceito
- **Data:** 2026-06-20
- **Supersede:** ADR-014 (identidade visual) e ADR-015 (design system)

## Contexto

O design aprovado pelo founder no claude.ai/design (projeto `c2d50f72-…`, arquivo
`Visao Geral copy.dc.html`, variant B "Executivo") define uma nova identidade visual para
o `apps/web`, diferente da estabelecida em ADR-014/015. A decisão de adotá-lo integralmente
foi tomada pelo founder; este ADR registra a mudança para que não seja silenciosa.

## Decisão

Adotar a identidade **"Executivo" (variant B)** como visual canônico do produto:

- **Tipografia:** **Schibsted Grotesk** (sans + display + números), carregada via
  `@fontsource/schibsted-grotesk`. Substitui **Geist/Geist Mono**.
- **Cores (modo claro):** canvas morno `#f3f2ec`, superfícies brancas, tinta `#181712`,
  hairline `#e6e3da`.
- **Sidebar:** escura (`#16181d`) com texto claro e item ativo em teal.
- **Acento canônico:** **Petróleo** `#0e8aa6` (fixo, sem switcher de acento). Substitui o
  azul `#0073BB` do ADR-014.
- **Sucesso/erro:** verde `#12895e`, vermelho/coral `#c8412a`.
- **Cards:** raio 10px, sombra elevada (`--shadow-card`) com anel de 1px; faixa de acento
  (accent strip) à esquerda nos KPI cards.
- **Tema/densidade:** mantidos os toggles **claro/escuro** e **densidade** (2 níveis:
  confortável/compacto). **Descartados** os switchers de variant (A/B), acento e superfície
  do protótipo — eram ferramentas de exploração de design, não opções de produto.

## Implementação

Toda a UI é token-driven (`hsl(var(--token))`). A mudança foi feita principalmente em
`apps/web/src/index.css` (re-mapeamento dos tokens semânticos para a paleta variant B),
`tailwind.config.ts` e `index.html`/`main.tsx` (fonte), com ajustes no shell
(`Sidebar`, `Topbar`, `PageHeader`) e no UI kit (`Card`, `KpiCard`).

## Consequências

- Charts (Recharts) herdam as cores via tokens; revisar paletas de série quando necessário.
- `docs/design/` (tokens.md, components.md, ADR-014/015) ficam **desatualizados** e devem ser
  reescritos ou marcados como legados em uma passada futura.
- Páginas que ainda não foram re-desenhadas herdam automaticamente a nova paleta/tipografia;
  o re-layout fiel ao novo design é feito página a página.

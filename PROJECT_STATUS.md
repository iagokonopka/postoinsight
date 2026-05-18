# PROJECT_STATUS.md — PostoInsight

> Arquivo de contexto vivo. Atualizado ao fim de cada sessão de trabalho.
> Qualquer pessoa (ou IA) que abrir este arquivo deve saber exatamente onde o projeto está e o que fazer a seguir.

---

## Última atualização
**Data:** 2026-05-18
**Sessão:** ADR-011 revisado (Recharts substitui ECharts), ADR-014 e ADR-015 criados, docs/design/ completo (tokens, components, patterns), `apps/web/src/` apagado — reimplementação do frontend do zero

---

## Contexto do Projeto

PostoInsight é um SaaS de BI para redes de negócios multi-unidade — iniciando com postos de combustível, mas projetado para qualquer segmento.
Centraliza dados de ERPs (Status e WebPosto) e expõe dashboards de vendas, análise por categoria e DRE mensal.

**Repositório:** local em `\\wsl.localhost\Ubuntu\home\dev\postoinsight\`
**Documentação base:** `docs/` no repositório

---

## Fases do Projeto

### ✅ Fase 1 — Discovery
Completa. Fontes de dados mapeadas, problema de negócio definido, stack decidida.

### ✅ Fase 2 — Arquitetura
- ✅ `CLAUDE.md` — regras e stack definidas
- ✅ Repositório + estrutura de pastas (monorepo pnpm workspaces)
- ✅ ADRs em `docs/architecture/decisions/` — 15 ADRs escritos
- ✅ ADR-008 — nomenclatura neutra de domínio (postos→locations, platform_users)
- ✅ ADR-010 — Vite + React SPA (Next.js removido)
- ✅ ADR-011 — **Recharts** (rev. 2026-05-18) + SVG inline sparklines + CSS Grid heatmap
- ✅ ADR-012 — Cookie HttpOnly JWE emitido pelo Fastify
- ✅ ADR-013 — Tailwind CSS v4 + Shadcn/ui
- ✅ ADR-014 — Identidade visual (Geist, paleta, densidade, dark sidebar)
- ✅ ADR-015 — Governança do design system
- ❌ `docs/architecture/overview.md` — legado, ignorar

### ✅ Fase 3 — Dados
- ✅ Inventário Status ERP
- ✅ Inventário WebPosto ERP
- ✅ Canonical model completo para MVP

### 🟡 Fase 4 — Implementação (em andamento)

#### ✅ Backend — em produção no Railway

- `packages/db` — Drizzle schema completo, migrations aplicadas até `0005_sync_state_unique_erp`, seed (Rede JAM)
- `packages/shared` — tipos, `deriveSegmento()`
- `apps/api` — Fastify + WebSocket `/agent/v1/connect`, pipeline pg-boss
- `apps/api` — todos os endpoints implementados e auditados contra FRONTEND_SPEC (2026-05-17):
  - `GET /api/v1/vendas/resumo`, `/evolucao` (+ `margem_pct`), `/segmentos`, `/grupos`
  - `GET /api/v1/vendas/top-produtos` (qtd corrigido), `/drill/subgrupos`, `/drill/produtos`
  - `GET /api/v1/combustivel/resumo`, `/evolucao` (+ `?por_produto=true`), `/produtos`, `/subgrupos` (+ precos)
  - `GET /api/v1/conveniencia/resumo` (+ `nf_count`, `ticket_medio`), `/evolucao`, `/categorias`, `/grupos`, `/top-grupos` (+ categorias aninhadas)
  - `GET /api/v1/arla/resumo`, `/evolucao`, `/produtos`
  - `GET /api/v1/lubrificantes/resumo`, `/evolucao`, `/grupos`
  - `GET /api/v1/dre/mensal`, `/meses-disponiveis`
  - `GET /api/v1/locations`, `GET /api/v1/sync/status`
  - `POST /api/v1/sync/trigger` — disparo manual via WebSocket
  - `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- `apps/api/src/lib/auth.ts` — `requireTenantSession` (JWE decode, impersonation)
- `apps/api/src/pipeline/refresh-analytics.ts` — refresh das 4 MVs
- `apps/agent` — extração SQL Server → WebSocket → pipeline, bundlado como `.exe`
- Railway — serviço `api` (`api-production-3a9c.up.railway.app`) + serviço `postoinsight` (worker) + PostgreSQL
- Rede JAM — 4 locations conectadas, pipeline end-to-end validado, dados reais 2026-01 a 2026-05
- `analytics.*` — 4 MVs refreshadas com dados reais

#### ✅ Design system — documentado

- `docs/design/ADR-011-charts-revisado.md` — decisão revisada (Recharts)
- `docs/design/ADR-014-identidade-visual.md` — tipografia Geist, paleta, densidade, dark sidebar
- `docs/design/ADR-015-design-system.md` — governança e regras
- `docs/design/tokens.md` — tokens de cor, espaçamento e tipografia
- `docs/design/components.md` — catálogo de componentes com anatomia e regras
- `docs/design/patterns.md` — padrões de composição de páginas
- `design_example/postoinsight/` — protótipo navegável aprovado (fonte de verdade visual)

#### ❌ Frontend — apagado, reimplementação do zero

- `apps/web/src/` **removido completamente em 2026-05-18**
- **Próximo passo: scaffold do novo `apps/web`**
- Base: `docs/design/` (tokens, components, patterns, ADR-014, ADR-015) + `design_example/postoinsight/`
- Stack: Vite + React + TypeScript, Recharts, Shadcn/ui, Tailwind v4, TanStack Query v5

---

## Canonical Model — Estado atual

| Entidade | Status | Observação |
|----------|--------|------------|
| `fato_venda` | ✅ completo | Status + WebPosto mapeados campo a campo |
| `dim_produto` | ✅ completo | Status + WebPosto, SCD2 definido |
| `dim_tempo` | ✅ completo | Gerada pelo pipeline, sem fonte ERP |
| `fato_venda_pagamento` | ❌ fora do MVP | Removido |
| `dim_forma_pagamento` | ❌ fora do MVP | Removido |

---

## Docs — Status atual

| Documento | Caminho | Status |
|-----------|---------|--------|
| CLAUDE.md | `CLAUDE.md` | ✅ atualizado 2026-05-18 |
| PRD | `docs/product/PRD.md` | ✅ válido |
| Inventário Status | `docs/data/inventory/status-inventory.md` | ✅ válido |
| Inventário WebPosto | `docs/data/inventory/webposto-inventory.md` | ✅ válido |
| Canonical model | `docs/data/canonical-model.md` | ✅ atualizado |
| ADRs | `docs/architecture/decisions/` | ✅ 15 ADRs (inclui ADR-014, ADR-015) |
| Design tokens | `docs/design/tokens.md` | ✅ completo |
| Design components | `docs/design/components.md` | ✅ completo |
| Design patterns | `docs/design/patterns.md` | ✅ completo |
| Frontend spec | `docs/design/FRONTEND_SPEC.md` | ✅ fonte de verdade de UI/UX |
| Architecture overview | `docs/architecture/overview.md` | ❌ legado — ignorar |
| DDL do banco | `docs/db/schema.sql` | ❌ desatualizado — schema real está no Drizzle |
| API design | `docs/api/api.md` | ❌ legado — ignorar |
| Onboarding runbook | `docs/ops/onboarding.md` | ❌ pendente |
| Spec sync-status | `docs/specs/sync-status.md` | ✅ v1.1 |
| Spec dashboard-vendas | `docs/specs/dashboard-vendas.md` | ✅ v1.0 |
| Spec dashboard-combustivel | `docs/specs/dashboard-combustivel.md` | ✅ v1.0 |
| Spec dashboard-conveniencia | `docs/specs/dashboard-conveniencia.md` | ✅ v1.0 |
| Spec dre-mensal | `docs/specs/dre-mensal.md` | ✅ v1.0 |

---

## Próximos passos (ordem de execução)

### 🔴 Agora — Scaffold do novo frontend

1. **Scaffold `apps/web`** — Vite + React + TypeScript, Recharts, Shadcn/ui, Tailwind v4
   - Estrutura de pastas conforme `docs/design/`
   - Design tokens de `docs/design/tokens.md`
   - Componentes de `docs/design/components.md`
2. **Implementar páginas** na ordem:
   - [ ] `/login`
   - [ ] `/dashboard`
   - [ ] `/combustivel`  ← apenas combustíveis, sem Arla
   - [ ] `/arla`         ← novo
   - [ ] `/lubrificantes` ← novo
   - [ ] `/conveniencia` ← apenas loja, sem lubrificantes
   - [ ] `/dre`
   - [ ] `/sync`
   - [ ] `/settings`
3. **Deploy `apps/web`** no Railway (build estático `dist/`)

### 🟡 Pendente secundário

- Backfill 3 locations restantes: JAM Torres (002), JAM Imbé (005), JAM Tramandaí (006)
- Onboarding runbook — `docs/ops/onboarding.md`
- Adaptar pipeline para `raw_ingest_id` e `sync_rejections`
- `POST /auth/change-password` + rejeição de manager sem location
- Heatmap padrão semanal — requer endpoint de dados por dia da semana
- Stacked-area por hora na Conveniência — requer dado horário do ERP (não disponível no MVP)

---

## Fontes de Dados — Referência rápida MVP

### Status ERP
- `TMPBI_VENDA_DETALHADA` — vendas + custo (watermark: `DATA_EMISSAO`)
- `TITEM` + `TGRPI` + `TSGrI` + `TCATI` — cadastro de produtos (full sync)

### WebPosto ERP
- `GET /INTEGRACAO/VENDA_ITEM` — itens de venda
- `GET /INTEGRACAO/ABASTECIMENTO` — combustível (bico, tanque)
- `GET /INTEGRACAO/PRODUTO` + `GRUPO` + `CONSULTAR_SUB_GRUPO_REDE` — cadastro de produtos
- `GET /INTEGRACAO/PRODUTO_EMPRESA` — custo unitário (enrich pipeline)

---

*Atualize este arquivo ao fim de cada sessão. Nunca deixe desatualizado.*

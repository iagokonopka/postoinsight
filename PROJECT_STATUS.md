# PROJECT_STATUS.md — PostoInsight

> Arquivo de contexto vivo. Atualizado ao fim de cada sessão de trabalho.
> Qualquer pessoa (ou IA) que abrir este arquivo deve saber exatamente onde o projeto está e o que fazer a seguir.

---

## Última atualização
**Data:** 2026-05-03
**Sessão:** Scaffold completo `apps/web` (Vite + React SPA) — todas as páginas implementadas, telas funcionando sem dados (aguarda endpoint `/api/v1/locations` e backfill)

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
- ✅ ADRs em `docs/architecture/decisions/` — 8 ADRs escritos
- ✅ ADR-008 — nomenclatura neutra de domínio (postos→locations, platform_users)
- ❌ `docs/architecture/overview.md` — legado, ignorar

### ✅ Fase 3 — Dados
- ✅ Inventário Status ERP
- ✅ Inventário WebPosto ERP
- ✅ Canonical model completo para MVP

### 🟡 Fase 4 — Implementação (em andamento)

**Concluído:**
- ✅ Docker Compose (PostgreSQL 16 local)
- ✅ packages/db — Drizzle schema (app/raw/canonical), migrations, seed
- ✅ packages/shared — tipos, `deriveSegmento()`
- ✅ apps/api — Fastify server, WebSocket `/agent/v1/connect`, pipeline pg-boss
- ✅ apps/api — Worker `pipeline:fato_venda` e `pipeline:dim_produto` (SCD2)
- ✅ apps/agent — Extração SQL Server, WebSocket client, reconexão automática, empacotado como `.exe`
- ✅ Deploy API no Railway (PostgreSQL Railway + URL pública)
- ✅ Seed Rede JAM (4 locations, 4 connectors, tokens gerados)
- ✅ Agente instalado e conectado no RDP da Rede JAM
- ✅ Endpoint `POST /admin/backfill` implementado (`apps/api/src/routes/admin.ts`)
- ✅ Worker rodando no Railway como segundo serviço (`postoinsight`)
- ✅ Primeiro backfill real validado — 771 linhas em `canonical.fato_venda` (JAM Rota 1, 2026-04-27/28)
- ✅ Diagnóstico e fix de conexão SQL Server — porta dinâmica 64051, login SQL `postoinsight` criado
- ✅ **Analytics schema** — 4 MVs criadas (`mv_vendas_diario`, `mv_combustivel_diario`, `mv_conveniencia_diario`, `mv_dre_mensal`)
- ✅ **Migration** `0002_create_analytics_mvs.sql` — DDL das 4 MVs + índices únicos para REFRESH CONCURRENTLY
- ✅ **Migration** `0003_little_zaladane.sql` — 47 alterações: novas tabelas (audit_log, login_history, invitations, connector_events, sync_rejections, usage_events), soft-delete, enums, rastreabilidade raw→canonical
- ✅ **packages/db** — tipos Drizzle das 4 MVs em `schema/analytics.ts`
- ✅ **`refreshAnalyticsMvs()`** — pipeline de refresh com CONCURRENTLY automático (`apps/api/src/pipeline/refresh-analytics.ts`)
- ✅ **Endpoints de dashboard** — todos implementados com `requireTenantSession` (tenant_id nunca aceito de parâmetro):
  - `GET /api/v1/vendas/resumo`, `/evolucao`, `/segmentos`, `/grupos`
  - `GET /api/v1/combustivel/resumo`, `/evolucao`, `/produtos`
  - `GET /api/v1/conveniencia/resumo`, `/evolucao`, `/grupos`
  - `GET /api/v1/dre/mensal`
- ✅ **`apps/api/src/lib/auth.ts`** — middleware `requireTenantSession`: decode de JWE via cookie ou Bearer, suporte a impersonation via `x-tenant-id` para platform users
- ✅ **`apps/api/src/lib/queryParsers.ts`** — parsers tipados para datas, UUIDs, enums
- ✅ **`apps/api/src/routes/auth.ts`** — `POST /auth/login`, `GET /auth/me`, `POST /auth/logout` (cookie HttpOnly JWE via `@auth/core/jwt`)
- ✅ **`packages/db/src/schema/app.ts`** — corrigido para Drizzle v0.30 (sintaxe objeto), campo `password_changed_at` adicionado em `users`
- ✅ **`@fastify/cookie`** + **`bcryptjs`** adicionados como dependências em `apps/api`
- ✅ **ADR-010** — Vite + React SPA (migração de Next.js) — aprovado
- ✅ **ADR-011** — ECharts via echarts-for-react (não Recharts) — aprovado
- ✅ **ADR-012** — Cookie HttpOnly JWE emitido pelo Fastify (Auth.js removido do frontend) — aprovado
- ✅ **`apps/web` — scaffold Vite + React SPA completo** — implementado do zero (2026-05-03)
  - Estrutura: `src/lib/`, `src/hooks/`, `src/components/layout/`, `src/components/ui/`, `src/components/charts/`, `src/pages/`
  - Design tokens copiados de `design_example/postoinsight/PostoInsight.html`
  - Autenticação via cookie HttpOnly (ADR-012): `AuthContext`, `useAuth`, `GET /auth/me` no boot
  - TanStack Query v5 para fetching — stale time 5min, retry desabilitado para 401/403
  - ECharts com tree-shaking via `src/lib/echarts.ts` (ADR-011)
  - Período sincronizado com `searchParams` da URL (`?periodo=mes`)
  - Location filter sincronizado com `searchParams` da URL (`?location=<uuid>`)
  - Tema claro/escuro persistido em `localStorage` com CSS `data-theme`
  - **7 páginas implementadas** (visual fiel ao design de referência):
    - `/login` — LoginPage com validação, erro 401, redirect pós-login
    - `/dashboard` — DashboardPage: KPIs, evolução temporal (ECharts), breakdown por segmento
    - `/combustivel` — CombustivelPage: KPIs, evolução por produto, tabela detalhada com mini-bars
    - `/conveniencia` — ConvenienciaPage: KPIs, evolução, breakdown com drill-down em categorias
    - `/dre` — DrePage: seletor de mês, tabela DRE com comparativo vs mês anterior
    - `/sync` — SyncPage: cards por location com status, botão de sync, histórico de jobs
    - `/settings` — SettingsPage: perfil do usuário, info do tenant, integrações
  - `AppLayout` protege rotas: redireciona `/login` se não autenticado
  - Proxy Vite configurado para `/api` e `/auth` → `http://localhost:3000`
  - **Estado atual: telas renderizando, sem dados** — endpoints retornam 401 sem sessão ativa ou dados ainda não populados

**Pendente:**
- ❌ Adaptar pipeline para gravar `raw_ingest_id` em `fato_venda` e rejeições em `sync_rejections`
- ❌ Preencher `triggered_by`, `period_from`, `period_to` em `sync_jobs` no pipeline
- ❌ Backfill completo das 4 locations (histórico completo)
- ❌ Migration para `password_changed_at` (users) e `next_run_at` (sync_state)
- ❌ Gaps de auth: `POST /auth/change-password`, rejeição de manager sem location
- ❌ `GET /api/v1/sync/status` — endpoint para a página `/sync` (frontend já consome)
- ❌ `GET /api/v1/locations` — endpoint para o seletor de unidades na Topbar (frontend usa graceful degradation sem ele)
- ❌ Deploy `apps/web` no Railway (build estático via `pnpm build`)

---

## Canonical Model — Estado atual

### Entidades no modelo (MVP)

| Entidade | Status | Observação |
|----------|--------|------------|
| `fato_venda` | ✅ completo | Status + WebPosto mapeados campo a campo |
| `dim_produto` | ✅ completo | Status + WebPosto, SCD2 definido |
| `dim_tempo` | ✅ completo | Gerada pelo pipeline, sem fonte ERP |
| `fato_venda_pagamento` | ❌ fora do MVP | Removido — complexidade desnecessária agora |
| `dim_forma_pagamento` | ❌ fora do MVP | Removido junto |

### Decisões tomadas no canonical model

- `is_combustivel` derivado via `categoria_codigo = 'CB'` (Status) / campo `combustivel` (WebPosto) — **não** por `bico IS NOT NULL`
- `source_id` Status: `FormasRecebimento` para combustível, `NR_VENDA_INTERNO || '-' || CODIGO_ITEM` para loja
- `bico_codigo = 0` → NULL no canonical
- `forma_pagamento_tipo` existe em `fato_venda` mas fica NULL no MVP — não há tabela de forma de pagamento
- Hierarquia de produtos: 3 níveis (categoria / grupo / subgrupo). Linha/sublinha descartadas (~100% nulas no Status)
- WebPosto: `grupoCodigo` = categoria (L1), `subGrupo1Codigo` = grupo (L2), `subGrupo2Codigo` = subgrupo (L3)
- SCD2 em `dim_produto`: mudanças criam nova versão, vendas históricas sempre referenciam a versão correta

---

## Docs — Status atual

| Documento | Caminho | Status |
|-----------|---------|--------|
| CLAUDE.md | `CLAUDE.md` | ✅ atualizado |
| PRD | `docs/product/PRD.md` | ✅ atualizado |
| Inventário Status | `docs/data/inventory/status-inventory.md` | ✅ válido |
| Inventário WebPosto | `docs/data/inventory/webposto-inventory.md` | ✅ válido |
| Canonical model | `docs/data/canonical-model.md` | ✅ atualizado |
| Architecture overview | `docs/architecture/overview.md` | ❌ legado — ignorar |
| ADRs | `docs/architecture/decisions/` | ✅ 12 ADRs escritos (ADR-010 Vite, ADR-011 ECharts, ADR-012 Auth cookie) |
| DDL do banco | `docs/db/schema.sql` | ❌ desatualizado — schema real está no Drizzle |
| API design | `docs/api/api.md` | ❌ legado — ignorar |
| Onboarding runbook | `docs/ops/onboarding.md` | ❌ pendente |
| Spec sync-status | `docs/specs/sync-status.md` | ✅ v1.1 completo |
| Spec dashboard-vendas | `docs/specs/dashboard-vendas.md` | ✅ v1.0 completo |
| Spec dashboard-combustivel | `docs/specs/dashboard-combustivel.md` | ✅ v1.0 completo |
| Spec dashboard-conveniencia | `docs/specs/dashboard-conveniencia.md` | ✅ v1.0 completo |
| Spec dre-mensal | `docs/specs/dre-mensal.md` | ✅ v1.0 completo |

---

## Próximos passos (ordem de execução)

### ✅ Specs concluídas

Todas as specs MVP estão escritas. Sync WebPosto pausado (não implementar agora).

### 🔴 Agora — Fazer o frontend mostrar dados reais

1. **`GET /api/v1/locations`** — criar endpoint no backend para o seletor de unidades da Topbar
   - Retorna: `{ locations: [{ id, nome, status }] }` filtrado por `tenant_id` da sessão
2. **`GET /api/v1/sync/status`** — criar endpoint para a página `/sync`
   - Retorna: `{ locations: [...], historico: [...] }` (shape já definido na SyncPage)
3. **Backfill completo** — rodar para as 4 locations e confirmar MVs populadas
4. **Testar login + dados end-to-end** — logar com usuário da Rede JAM, confirmar que os dashboards mostram dados reais
5. **Deploy `apps/web`** no Railway — `pnpm build` → servir `dist/` como static site

### 🟡 Pendente secundário

- Migration para `password_changed_at` (users) e `next_run_at` (sync_state)
- Adaptar pipeline para `raw_ingest_id` e `sync_rejections`
- Onboarding runbook — `docs/ops/onboarding.md`
- Sync automático agendado (hoje só backfill manual)

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
# PostoInsight — Agent Teams Master Reference Guide

> Este documento é a fonte de verdade para todos os agentes do time PostoInsight.
> Todo agente (Lead, Backend, Frontend, QA) deve ler este arquivo ao iniciar.
> Última atualização: 2026-05-02

---

## 1. O Produto

**PostoInsight** é uma plataforma SaaS de Business Intelligence para redes de negócios multi-unidade — iniciando com postos de combustível, mas projetada para qualquer segmento.

**Problema resolvido:** donos de redes não têm visibilidade consolidada da operação. Hoje exportam planilhas manualmente por posto, consolidam à mão, montam KPIs artesanalmente. O PostoInsight elimina isso.

**Pergunta central que o produto responde:**
> *Como estão minhas vendas hoje, nesta semana e neste mês — por posto, por categoria, por produto?*

**Clientes são redes (multi-tenant) — nunca unidades individuais.**

---

## 2. Terminologia Obrigatória

| Termo no sistema | Significado real | Nunca usar |
|-----------------|-----------------|------------|
| `tenant` | Rede de negócios (ex: "Rede JAM") | "cliente", "empresa" |
| `location` | Unidade/posto individual | "filial", "posto" |
| `connector` | Integração com um ERP em uma location | "integração" |
| `platform_user` | Usuário interno PostoInsight (superadmin/support) | — |
| `tenant_user` | Usuário do cliente (owner/manager/viewer) | — |

---

## 3. Stack Tecnológica

| Camada | Tecnologia | Observações |
|--------|-----------|-------------|
| Frontend | **Vite + React SPA** + TypeScript | ADR-010 — Next.js removido. Scaffold pendente. |
| Charts | **ECharts** via echarts-for-react | ADR-011 — não usar Recharts/Tremor |
| Backend | Fastify 4+ TypeScript | Em produção no Railway |
| ORM | Drizzle ORM | Nunca Prisma. Migrations obrigatórias para todo DDL |
| Jobs | pg-boss | Jobs persistidos no PostgreSQL — sem Redis |
| Auth | Cookie HttpOnly JWE emitido pelo Fastify | ADR-012 — Auth.js removido do frontend |
| Banco | PostgreSQL 16+ | |
| Agente ERP | Node.js + TypeScript → `.exe` via `@yao-pkg/pkg` | Em produção |
| Deploy | Railway | MVP — API + worker como 2 serviços separados |
| Local | WSL Ubuntu + Docker Compose | |

**Nunca substituir tecnologia da stack sem ADR aprovado.**

---

## 4. Estrutura do Repositório

```
postoinsight/
  apps/
    web/       ← Next.js frontend (✅ implementado — aguardando deploy)
    api/       ← Fastify backend (✅ produção)
    agent/     ← Agente Status .exe (✅ produção)
  packages/
    db/        ← Drizzle schema + migrations (✅)
    shared/    ← tipos e utilitários compartilhados (✅)
  docs/
    product/PRD.md                    ← ✅ fonte de verdade do produto
    architecture/decisions/           ← ✅ 9 ADRs
    data/canonical-model.md           ← ✅ modelo canônico completo
    data/inventory/status-inventory.md
    data/inventory/webposto-inventory.md
    specs/                            ← ✅ 5 specs (sync-status, dashboard-vendas,
                                           dashboard-combustivel, dashboard-conveniencia,
                                           dre-mensal)
    agents/                           ← prompts e referência dos agentes do time
```

---

## 5. Schemas do Banco — Responsabilidades

```
app        ← operacional: tenants, platform_users, users, tenant_users,
             locations, connectors, sync_state, sync_jobs,
             invitations, audit_log, login_history,
             connector_events, sync_rejections, usage_events
raw        ← bronze: raw_ingest (payload JSONB intocado do ERP) — NUNCA lido pelo frontend/API
canonical  ← silver: fato_venda, dim_produto, dim_tempo — fonte de verdade analítica
analytics  ← gold: materialized views pré-agregadas — serve 90% das queries do frontend
```

**Novas tabelas (migration 0003):**
- `audit_log` — trilha de auditoria de ações de usuários e plataforma
- `login_history` — histórico de logins por usuário e tenant
- `invitations` — convites de acesso enviados por owners
- `connector_events` — eventos de conexão/desconexão dos agentes
- `sync_rejections` — registros rejeitados pelo pipeline com motivo
- `usage_events` — eventos de uso da plataforma para analytics de produto

**Soft-delete:** `tenants`, `locations`, `connectors`, `tenant_users` agora têm coluna `deleted_at`.

**Regra absoluta:** `raw` nunca é acessado pelo frontend nem pela API pública. Apenas pelo pipeline.

---

## 6. Pipeline Medallion

```
ERP
 └─→ raw.raw_ingest          (Bronze — payload intocado, imutável)
      └─→ pipeline (pg-boss)
           └─→ canonical.*   (Silver — modelo canônico validado)
                └─→ REFRESH MATERIALIZED VIEW
                     └─→ analytics.mv_*  (Gold — pré-agregado para o frontend)
```

**O agente/conector nunca transforma dados.** Extrai e envia. Toda transformação é responsabilidade do pipeline no servidor.

---

## 7. Modelo Canônico — Tabelas Principais

### fato_venda
Grão: 1 linha = 1 produto em 1 venda (item de nota fiscal ou abastecimento).

Campos críticos:
- `tenant_id`, `location_id` — sempre presentes, nunca cruzam tenants
- `data_venda`, `hora_venda`, `turno`
- `source_produto_id`, `descricao_produto`
- `categoria_codigo`, `grupo_id`, `subgrupo_id` — hierarquia de 3 níveis
- `is_combustivel` — booleano derivado via `categoria_codigo IN ('CB', 'ARL')`
- `qtd_venda`, `vlr_unitario`, `vlr_total`, `custo_unitario`, `desconto_total`
- `segmento` — `'combustivel'`, `'lubrificantes'`, `'servicos'` ou `'conveniencia'`
- `raw_ingest_id` — FK para `raw.raw_ingest`: rastreabilidade raw→canonical
- `reprocessed_at`, `reprocess_count` — controle de reprocessamento

### dim_produto
Cadastro de produtos com hierarquia completa. Sincronização periódica (full sync ocasional).

### dim_tempo
Tabela de datas para facilitar queries analíticas por período.

### DRE (calculado)
```
Receita Bruta
- Descontos
= Receita Líquida
- CMV (custo_unitario × qtd_venda)
= Margem Bruta
```

---

## 8. Multitenancy — Regra Absoluta

- Todo dado analítico tem `tenant_id`
- **Toda query filtra por `tenant_id` — sem exceção**
- Dados nunca cruzam entre tenants
- A API valida `tenant_id` em todas as rotas autenticadas

### Roles

**Platform (superadmin/support):**
| Role | Escopo |
|------|--------|
| `superadmin` | Acesso total a todos os tenants |
| `support` | Read-only em todos os tenants |

**Tenant (owner/manager/viewer):**
| Role | Escopo |
|------|--------|
| `owner` | Todos os dados do tenant |
| `manager` | Dados da location indicada em `tenant_users.location_id` |
| `viewer` | Acesso configurável — `location_id` pode ser NULL (acesso global ao tenant) ou apontar para uma location específica |

---

## 9. Fontes de Dados

### Status ERP
- Acesso via agente instalado no RDP do cliente
- Extração read-only via SELECT em views SQL Server
- Views MVP:
  - `TMPBI_VENDA_DETALHADA` — vendas com custo (watermark: `DATA_EMISSAO`)
  - `TITEM` + `TGRPI` + `TSGrI` + `TCATI` — hierarquia de produtos (full sync)

### WebPosto ERP
- Acesso via API REST (Quality Automação)
- Base URL: `https://web.qualityautomacao.com.br`
- Paginação via cursor `ultimoCodigo`
- Endpoints MVP:
  - `GET /INTEGRACAO/VENDA_ITEM` — itens de venda
  - `GET /INTEGRACAO/ABASTECIMENTO` — abastecimentos
  - `GET /INTEGRACAO/PRODUTO` — cadastro de produtos

---

## 10. Estado Atual da Implementação

### ✅ Em produção
- `packages/db` — Drizzle schema (app/raw/canonical/analytics), migrations aplicadas até `0003_little_zaladane`, seed (Rede JAM)
- `packages/shared` — tipos, `deriveSegmento()`
- `apps/api` — Fastify + WebSocket, pipeline pg-boss, todos os endpoints de dashboard
  - `/api/v1/vendas`, `/api/v1/combustivel`, `/api/v1/conveniencia`, `/api/v1/dre`
  - `lib/auth.ts` — middleware `requireTenantSession` (JWE decode, impersonation)
- `apps/agent` — extração SQL Server → WebSocket → pipeline
- `analytics.*` — 4 MVs (mv_vendas_diario, mv_combustivel_diario, mv_conveniencia_diario, mv_dre_mensal)
- Railway — API + worker + PostgreSQL
- Rede JAM — 4 locations conectadas, pipeline end-to-end validado

### ✅ Implementado (aguardando migration)
- `apps/api/src/routes/auth.ts` — `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password`
  - ⚠️ Migration pendente para `password_changed_at` e `next_run_at`
- `packages/db/src/schema/app.ts` — corrigido para Drizzle v0.30, campo `password_changed_at` adicionado

### ✅ Implementado — `apps/web` (telas prontas, sem dados reais)
- Scaffold Vite 5 + React 18 + TypeScript + React Router v6 + TanStack Query v5 + ECharts (2026-05-03)
- Autenticação: `AuthContext` + `GET /auth/me` no boot + cookie HttpOnly (ADR-012)
- Tema claro/escuro com `data-theme` + `localStorage`
- Período e location filter em `searchParams` da URL
- 7 páginas implementadas (visual fiel ao design): Login, Dashboard, Combustível, Conveniência, DRE, Sync, Settings
- **Estado: telas renderizando — sem dados** (aguarda endpoints + backfill)

### ❌ Pendente
- `GET /api/v1/locations` — endpoint para seletor de unidades na Topbar
- `GET /api/v1/sync/status` — endpoint para página `/sync`
- Backfill completo das 4 locations
- Migration para schema atualizado (`password_changed_at`, `next_run_at`)
- Deploy `apps/web` no Railway (static build)
- `docs/ops/onboarding.md` — runbook para novos clientes

### Design de referência
**`design_example/postoinsight/`** — fonte de verdade visual. Todo agente Frontend lê antes de implementar.
ADRs relevantes: ADR-010 (Vite SPA), ADR-011 (ECharts), ADR-012 (auth cookie HttpOnly)

---

## 11. Regras de Linguagem

| Contexto | Idioma |
|----------|--------|
| Código (variáveis, funções, classes, comentários inline) | Inglês |
| Documentação (docs/, mensagens de erro para usuário) | Português |
| Commits | Inglês — `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:` |

---

## 12. O Que Nunca Fazer

- Nunca criar código sem SPEC correspondente em `docs/specs/`
- Nunca instalar dependências sem justificar
- Nunca misturar lógica de negócio no frontend
- Nunca acessar schema `raw` do frontend ou API pública
- Nunca hardcodar credenciais, URLs de produção ou API keys
- Nunca alterar schema do banco sem migration Drizzle
- Nunca substituir tecnologia da stack sem ADR aprovado
- Nunca tomar decisões de arquitetura silenciosamente — apresentar opções

---

## 13. Agent Teams — Como Este Time Opera

### Estrutura do time

```
Você (founder)
    ↓
Lead (Orchestrator) — coordena, não implementa
    ↓ spawna e delega via Shared Task List
Backend ←→ Frontend ←→ QA/Review
    (se comunicam diretamente entre si)
```

### Responsabilidades por agente

| Agente | Escopo |
|--------|--------|
| **Lead** | Recebe objetivo, quebra em tasks, delega, sintetiza, apresenta resultado ao founder |
| **Backend** | `apps/api` + `packages/db` — Fastify endpoints, Drizzle schema, migrations, queries, pg-boss jobs |
| **Frontend** | `apps/web` — Next.js App Router, componentes, páginas, Auth.js, design system |
| **QA/Review** | Lê o que foi implementado, verifica contra specs, aponta problemas de segurança, consistência e cobertura |

### Regras de coordenação
- Backend avisa Frontend quando uma API está pronta para consumo
- QA pode pedir ajuste diretamente ao Backend ou Frontend sem passar pelo Lead
- Lead só intervém quando há conflito ou decisão de arquitetura
- Tasks com dependências só são claimadas quando a dependência está concluída

### Tamanho de task ideal
- Unidade auto-contida que produz um deliverable claro (uma rota, um componente, um arquivo de teste)
- 5-6 tasks por teammate é o ponto ideal
- Tasks pequenas demais: overhead de coordenação maior que o benefício
- Tasks grandes demais: risco de esforço desperdiçado sem check-in

---

## 14. Documentos de Referência por Área

| Área | Documento |
|------|-----------|
| Produto | `docs/product/PRD.md` |
| Dados canônicos | `docs/data/canonical-model.md` |
| Status ERP | `docs/data/inventory/status-inventory.md` |
| WebPosto ERP | `docs/data/inventory/webposto-inventory.md` |
| Specs de features | `docs/specs/` |
| Decisões arquiteturais | `docs/architecture/decisions/` |
| Agentes | `docs/agents/` |
| Auth.js v5 | https://authjs.dev/getting-started |
| Fastify | https://fastify.dev/docs/latest/ |
| Drizzle ORM | https://orm.drizzle.team/docs/overview |
| Next.js App Router | https://nextjs.org/docs/app |
| pg-boss | https://github.com/timgit/pg-boss |
| Agent Teams (Claude) | https://code.claude.com/docs/en/agent-teams |

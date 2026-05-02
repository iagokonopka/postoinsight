# CLAUDE.md — PostoInsight

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Ele define as regras, contexto e estrutura do projeto.
> **Nunca ignore este arquivo. Nunca tome decisões que conflitem com ele.**

---

## 1. O Projeto

**PostoInsight** é uma plataforma SaaS de Business Intelligence para redes de negócios multi-unidade — iniciando com postos de combustível, mas projetada para qualquer segmento.

- Centraliza dados de ERPs (Status e WebPosto) em um modelo canônico
- Expõe dashboards de vendas, análise por categoria e DRE mensal
- Clientes são redes (multi-tenant) — nunca unidades individuais
- Nomenclatura neutra de domínio: `locations` (unidades), `tenants` (redes) — ver ADR-008
- Documento completo: `docs/product/PRD.md`

---

## 2. Regras de Comportamento — OBRIGATÓRIAS

### 2.1 Antes de qualquer ação

- **Sempre leia os documentos relevantes antes de implementar.** Se a tarefa envolve dados → leia `docs/data/`. Se envolve API → leia `docs/api/`. Se envolve frontend → leia `docs/architecture/`.
- **Sempre pergunte antes de criar um arquivo novo.** Apresente o que pretende criar, onde e por quê. Aguarde confirmação.
- **Nunca tome decisões de arquitetura silenciosamente.** Se encontrar um problema que exige uma decisão, pare e apresente as opções antes de escolher.
- **Nunca altere o schema do banco sem uma migration.** Todo DDL passa pelo Drizzle. Nenhuma alteração manual.

### 2.0 Economia de tokens — regras de operação

O founder opera solo. Para economizar tokens e contexto:

- **Nunca rode scripts automaticamente.** Mostre o comando e peça para o founder rodar.
- **Nunca faça commit automaticamente.** Mostre a mensagem de commit sugerida e peça confirmação. O founder commita.
- **Nunca rode `pnpm install`, `pnpm build` ou qualquer script de build** sem o founder pedir explicitamente.
- **Pergunte antes de ler arquivos longos.** Se precisar de contexto de um arquivo grande, descreva o que precisa e pergunte se deve ler.
- **Respostas curtas por padrão.** Sem relatórios longos — bullet points concisos. O founder tem pouco tempo.

### 2.2 Quando houver dúvida

- Se a spec não cobre um caso → **pergunte**, não invente.
- Se houver uma prática melhor do que a especificada → **aponte a alternativa** antes de implementar.
- Se um documento estiver desatualizado em relação ao código → **sinalize**, não corrija silenciosamente.

### 2.3 O que nunca fazer

- Nunca criar código sem que exista uma SPEC correspondente em `docs/specs/`
- Nunca instalar dependências sem justificar e perguntar
- Nunca misturar lógica de negócio no frontend
- Nunca acessar o schema `raw` a partir do frontend ou da API pública
- Nunca hardcodar credenciais, URLs de produção ou API keys

---

## 3. Idioma

- **Código:** inglês (variáveis, funções, classes, comentários inline, commits)
- **Documentação:** português (docs/, comentários de bloco explicativos, mensagens de erro para o usuário)
- **Commits:** inglês, semânticos — padrão: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`

---

## 4. Stack Tecnológica

| Camada | Tecnologia | Versão alvo |
|--------|-----------|-------------|
| Frontend | Next.js + TypeScript | 14+ (App Router) |
| Backend | Fastify + TypeScript | 4+ |
| ORM / Queries | Drizzle ORM | latest |
| Jobs / Pipeline | pg-boss | latest |
| Autenticação | Auth.js | v5 |
| Banco de dados | PostgreSQL | 16+ |
| Agente (Status) | Node.js + TypeScript → `.exe` via `@yao-pkg/pkg` | Node 20 |
| Ambiente local | WSL Ubuntu + Docker Compose | — |
| Produção MVP | Railway | — |

**Nunca substitua uma tecnologia da stack sem um ADR aprovado em `docs/architecture/decisions/`.**

---

## 5. Estrutura do Repositório

```
postoinsight/
  apps/
    web/                  ← Next.js frontend (❌ não implementado ainda)
    api/                  ← Fastify backend (✅ em produção no Railway)
    agent/                ← Agente Status (Node.js → .exe via @yao-pkg/pkg) (✅ em produção)
  packages/
    db/                   ← Drizzle schema + migrations (✅ implementado)
    shared/               ← tipos e utilitários compartilhados (✅ implementado)
  docs/
    product/
      PRD.md              ← ✅ existe
    architecture/
      overview.md         ← ❌ legado, ignorar
      decisions/          ← ✅ 9 ADRs escritos (ADR-008 nomenclatura neutra, ADR-009 auditoria/BI)
    data/
      canonical-model.md  ← ✅ completo para MVP
      inventory/
        status-inventory.md    ← ✅ existe
        webposto-inventory.md  ← ✅ existe
    api/
      api.md              ← ❌ legado, ignorar
    specs/                ← ✅ 5 specs completas (sync-status, dashboard-vendas, dashboard-combustivel, dashboard-conveniencia, dre-mensal)
    db/
      schema.sql          ← ❌ desatualizado — schema real está no Drizzle
  agent-envs/             ← .env files dos clientes (não comitar)
  docker-compose.yml      ← ✅ existe (PostgreSQL local)
  CLAUDE.md               ← este arquivo
```

> O projeto está na Fase 4 — implementação em andamento. Pipeline de ingestão operacional em produção (Rede JAM, 4 locations conectadas).

---

## 6. Banco de Dados — Schemas e Responsabilidades

```
app        ← operacional: tenants, platform_users, users, tenant_users, locations, connectors,
             sync_state, sync_jobs, invitations, audit_log, login_history,
             connector_events, sync_rejections, usage_events
raw        ← bronze: raw_ingest (payload JSONB intocado do ERP)
canonical  ← silver: fato_venda, dim_produto, dim_tempo
analytics  ← gold: materialized views pré-agregadas para o frontend
```

**Regras:**
- `raw` → nunca lido pelo frontend ou pela API pública. Apenas pelo pipeline.
- `canonical` → fonte de verdade analítica. Lido pela API para queries sob demanda.
- `analytics` → materialized views. Serve 90% das queries do frontend.
- `app` → gerenciado pelo Drizzle com migrations versionadas.

---

## 7. Arquitetura Medallion — Pipeline

```
ERP
 └─→ raw.raw_ingest          (Bronze — payload intocado, nunca modificado)
      └─→ pipeline
           └─→ canonical.*   (Silver — modelo canônico validado)
                └─→ REFRESH MATERIALIZED VIEW
                     └─→ analytics.mv_*  (Gold — pré-agregado)
```

O agente/conector **nunca transforma dados** — apenas extrai e envia.
Toda transformação acontece no pipeline, no nosso servidor.

---

## 8. Multitenancy e Roles

- Cada rede de negócios é um `tenant` isolado
- Todo dado analítico tem `tenant_id`
- Dados **nunca cruzam entre tenants**
- Toda query deve filtrar por `tenant_id` — sem exceção

### Roles do sistema (platform_users)
| Role | Quem é | Escopo |
|------|--------|--------|
| `superadmin` | Equipe PostoInsight — acesso total | Todos os tenants |
| `support` | Suporte técnico — acesso de leitura | Todos os tenants (read-only) |

### Roles de tenant (tenant_users)
| Role | Quem é | Escopo |
|------|--------|--------|
| `owner` | Dono da rede | Todos os dados do tenant |
| `manager` | Gerente de unidade | Dados da location apontada por `tenant_users.location_id` |
| `viewer` | Consultor externo | Acesso configurável — `location_id` NULL = tenant inteiro, ou restrito a 1 location |

---

## 9. Fontes de Dados

### 9.1 Status ERP
- Acesso via agente instalado no servidor RDP do cliente
- Extração read-only via SELECT em views de BI do SQL Server
- Inventário completo: `docs/data/inventory/status-inventory.md`
- Views relevantes para o MVP:
  - `TMPBI_VENDA_DETALHADA` — vendas com custo embutido (watermark: `DATA_EMISSAO`)
  - `TITEM` + `TGRPI` + `TSGrI` + `TCATI` — cadastro de produtos com hierarquia completa (full sync ocasional)

### 9.2 WebPosto ERP
- Acesso via API REST (Quality Automação)
- Base URL: `https://web.qualityautomacao.com.br`
- Paginação via cursor `ultimoCodigo`
- Inventário completo: `docs/data/inventory/webposto-inventory.md`
- Endpoints relevantes para o MVP:
  - `GET /INTEGRACAO/VENDA_ITEM` — itens de venda
  - `GET /INTEGRACAO/ABASTECIMENTO` — abastecimentos (combustível)
  - `GET /INTEGRACAO/PRODUTO` — cadastro de produtos

---

## 10. Modelo Canônico — Visão Geral

> Detalhamento campo a campo em `docs/data/canonical-model.md` ✅

### Hierarquia de produtos (3 níveis)
| Nível | Canônico | Status | WebPosto |
|-------|----------|--------|----------|
| 1 | `categoria` | `CODIGO_CATEGORIA_ITEM` | `grupoCodigo` |
| 2 | `grupo` | `CODIGO_GRUPO_ITEM` | `subGrupo1Codigo` |
| 3 | `subgrupo` | `CODIGO_SUBGRUPO_ITEM` | `subGrupo2Codigo` |

### Identificação de combustível
- `segmento = 'combustivel'` → derivado via `categoria_codigo IN ('CB', 'ARL')`
- `is_combustivel = true` → mesmo critério, campo booleano em `fato_venda` e `dim_produto`
- `bico_codigo` não é critério de classificação — apenas metadado do abastecimento

### DRE
```
Receita Bruta
- Descontos
= Receita Líquida
- CMV (custo_unitario × qtd_venda)
= Margem Bruta
```

---

## 11. Documentações de Referência

Antes de implementar qualquer camada, leia a documentação oficial correspondente:

### Auth
- Auth.js (v5): https://authjs.dev/getting-started
- Auth.js com banco de dados: https://authjs.dev/getting-started/database

### Backend
- Fastify: https://fastify.dev/docs/latest/
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Drizzle com PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql
- pg-boss: https://github.com/timgit/pg-boss

### Frontend
- Next.js App Router: https://nextjs.org/docs/app
- Next.js com Auth.js: https://authjs.dev/getting-started/installation?framework=next.js

### Infra
- Railway deploy: https://docs.railway.app/getting-started

---

## 12. Decisões Técnicas (ADRs)

> Detalhamento completo em `docs/architecture/decisions/` (⏳ pendente)

Decisões já tomadas que devem ser respeitadas:

| Decisão | Escolha | Alternativa descartada | Razão |
|---------|---------|----------------------|-------|
| ORM | Drizzle | Prisma | Prisma é fraco para queries analíticas complexas |
| Jobs | pg-boss | BullMQ + Redis | Sem infra extra — jobs persistidos no PostgreSQL |
| Auth | Auth.js | Clerk | Self-hosted, sem custo, sem vendor lock-in |
| Deploy MVP | Railway | Hetzner VPS | Zero ops no MVP — migrar com tração |
| Watermark vs CDC | Watermark | CDC | Status expõe views, CDC não funciona em views |
| Agente | WebSocket persistente | Polling HTTP | Sem exposição de porta, sem problema de firewall |

---

## 13. Onboarding de Clientes

### O que coletar do cliente (Status ERP)

**Da rede (1x):**
- Nome da rede ex: "Rede JAM"

**De cada location:**
- Nome da location ex: "JAM Centro"
- Endereço (opcional no MVP)
- `CD_ESTAB` — obtido via SELECT em `TMPBI_VENDA_DETALHADA` com o acesso abaixo

**Acesso ao banco (1x por instalação do agente):**
- Host interno da rede (ex: IP local `192.168.x.x`) — **não o IP externo**
- Porta dinâmica do SQL Server (verificar via registry: `HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\MSSQL16.{instância}\MSSQLServer\SuperSocketNetLib\Tcp\IPAll` → `TcpDynamicPorts`)
- Nome do database
- Login SQL com `db_datareader` — **não Windows Authentication** (criar via SSMS se necessário)

### O que montar internamente

Com as informações acima, o seed script cria:
1. `app.tenants` — 1 registro da rede
2. `app.locations` — 1 por `CD_ESTAB` encontrado (campo: `source_location_id`)
3. `app.connectors` — 1 por location, `credentials: { host, port, database, user, password }`, gera token UUID
4. `app.sync_state` — watermark inicial NULL (busca histórico completo)
5. `app.users` + `app.tenant_users` — usuário admin do cliente com role `owner`

O agente recebe os tokens como variável de ambiente `LOCATIONS=cdEstab:token,...` (uma entrada por location).

Depois: instalar o agente `.exe` no RDP com o arquivo `.env` configurado.

> Runbook completo: `docs/ops/onboarding.md`

---

## 14. Estado Atual da Implementação

### ✅ Implementado e em produção (API + pipeline)
- `packages/db` — Drizzle schema completo (app/raw/canonical/analytics), migrations aplicadas até `0003_little_zaladane` (47 alterações), seed (Rede JAM)
- `packages/shared` — tipos, `deriveSegmento()`
- `apps/api` — Fastify + WebSocket `/agent/v1/connect`, pipeline pg-boss (`pipeline:fato_venda`, `pipeline:dim_produto`), `POST /admin/backfill`
- `apps/api` — 4 grupos de endpoints de dashboard: `/api/v1/vendas`, `/api/v1/combustivel`, `/api/v1/conveniencia`, `/api/v1/dre`
- `apps/api/src/lib/auth.ts` — middleware `requireTenantSession` (Auth.js v5 JWE decode, impersonation para platform users)
- `apps/api/src/pipeline/refresh-analytics.ts` — refresh das 4 MVs com CONCURRENTLY automático
- `apps/agent` — Extração SQL Server, WebSocket client com reconexão, bundlado como `.exe`
- Railway — API + worker (2 serviços) + PostgreSQL em produção
- Rede JAM — 4 locations conectadas, pipeline end-to-end validado

### ✅ Implementado (frontend — aguardando deploy)
- `apps/web` — Next.js 14 App Router completo:
  - Auth.js v5 com Credentials provider + DrizzleAdapter
  - Middleware de proteção de rotas
  - Dashboard layout com Sidebar
  - Páginas: `/dashboard`, `/combustivel`, `/conveniencia`, `/dre`, `/sync`, `/settings`, `/login`
  - Componentes: `KpiCard`, `SegmentoBreakdown`, `PeriodoSelector`, `DataTable`, `Sidebar`, `PlaceholderPage`

### ❌ Pendente
- Deploy `apps/web` no Railway (configurar env vars e serviço)
- Backfill completo das 4 locations (histórico completo)
- Gráficos de evolução temporal (lib de charts não escolhida ainda)
- Páginas `/sync` e `/settings` com conteúdo real
- `docs/ops/onboarding.md` — runbook para novos clientes

---

*Última atualização: 2026-05-02 — documento vivo, atualizado conforme o projeto evolui.*

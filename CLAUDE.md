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
| Frontend | **Vite + React + TypeScript (SPA)** | React 18 / Vite 5 |
| Backend | Fastify + TypeScript | 4+ |
| ORM / Queries | Drizzle ORM | latest |
| Jobs / Pipeline | pg-boss | latest |
| Autenticação | **Cookie HttpOnly JWE — emitido pelo Fastify** | — |
| Charts | **ECharts via echarts-for-react** | ECharts 5 |
| Banco de dados | PostgreSQL | 16+ |
| Agente (Status) | Node.js + TypeScript → `.exe` via `@yao-pkg/pkg` | Node 20 |
| Ambiente local | WSL Ubuntu + Docker Compose | — |
| Produção MVP | Railway | — |

**Nunca substitua uma tecnologia da stack sem um ADR aprovado em `docs/architecture/decisions/`.**

> ADRs relevantes: ADR-010 (Vite vs Next.js), ADR-011 (ECharts), ADR-012 (autenticação SPA)

---

## 5. Estrutura do Repositório

```
postoinsight/
  apps/
    web/                  ← Vite + React SPA (❌ scaffold pendente — Next.js foi removido)
    api/                  ← Fastify backend (✅ em produção no Railway)
    agent/                ← Agente Status (Node.js → .exe via @yao-pkg/pkg) (✅ em produção)
  packages/
    db/                   ← Drizzle schema + migrations (✅ implementado)
    shared/               ← tipos e utilitários compartilhados (✅ implementado)
  design_example/
    postoinsight/         ← ✅ FONTE DE VERDADE VISUAL — design aprovado final
                             Contém: PostoInsight.html (tokens CSS), layout.jsx,
                             page-vendas.jsx, page-combustivel.jsx, page-conveniencia.jsx,
                             page-dre.jsx, page-sync.jsx, page-settings.jsx, page-login.jsx,
                             data.js (shapes dos dados mock)
  docs/
    product/
      PRD.md              ← ✅ existe
    architecture/
      overview.md         ← ❌ legado, ignorar
      decisions/          ← ✅ 12 ADRs escritos
    data/
      canonical-model.md  ← ✅ completo para MVP
      inventory/
        status-inventory.md    ← ✅ existe
        webposto-inventory.md  ← ✅ existe
    api/
      api.md              ← ❌ legado, ignorar
    specs/                ← ✅ 5 specs (sync-status, dashboard-vendas, dashboard-combustivel,
                               dashboard-conveniencia, dre-mensal) — Seção 6 (Frontend) de
                               cada spec está desatualizada, será corrigida durante implementação
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

### Schema `app` — campos importantes para BI e auditoria

- `users.password_changed_at` — quando a senha foi trocada pela última vez
- `users.failed_login_attempts` + `users.locked_until` — controle de força bruta
- `users.last_login_at` — último acesso bem-sucedido
- `login_history` — histórico completo de logins com IP e user agent
- `audit_log` — trilha de auditoria com `payload_before`/`payload_after` para qualquer mudança sensível
- `sync_jobs` — histórico de sincronizações com duração, registros e erros
- `usage_events` — tracking de uso de features por usuário

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

## 8. Autenticação — Como funciona (pós ADR-012)

O frontend SPA autentica via **cookie HttpOnly** gerenciado pelo Fastify.

### Fluxo
1. `POST /auth/login` → valida credenciais, emite JWE via `@auth/core/jwt`, seta cookie `HttpOnly; SameSite=Lax`
2. Browser envia o cookie automaticamente em toda requisição — SPA nunca vê o token
3. `GET /auth/me` → SPA chama no carregamento para restaurar sessão após reload
4. `POST /auth/logout` → Fastify apaga o cookie
5. `POST /auth/change-password` → troca senha, registra em `audit_log`

### Cookie
- Nome: `authjs.session-token` (dev) / `__Secure-authjs.session-token` (prod)
- O middleware `requireTenantSession` em `apps/api/src/lib/auth.ts` decodifica o JWE
- `AUTH_SECRET` é a única variável de ambiente de auth — compartilhada entre `encode` e `decode`
- Bearer token (`Authorization: Bearer`) também suportado (para uso futuro de API pública)

### Claims do token
```typescript
{
  id: string           // user.id
  email: string
  name: string | null
  // tenant user:
  tenantId?: string
  role?: 'owner' | 'manager' | 'viewer'
  locationId?: string  // preenchido para managers (acesso restrito a 1 location)
  // platform user:
  platformRole?: 'superadmin' | 'support'
}
```

### Proteção contra força bruta
- 5 falhas consecutivas → `locked_until = NOW() + 15min`
- Login bem-sucedido → zera `failed_login_attempts`, atualiza `last_login_at`

---

## 9. Multitenancy e Roles

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
| Role | Quem é | Escopo | `location_id` |
|------|--------|--------|---------------|
| `owner` | Dono da rede | Todos os dados do tenant | NULL |
| `manager` | Gerente de unidade | Dados de UMA location | **obrigatório** — FK para `locations` |
| `viewer` | Consultor externo | Configurável | NULL = tenant inteiro, ou 1 location |

> **Regra crítica:** `manager` sem `location_id` é um estado inválido. O backend deve rejeitar
> criação de `tenant_users` com `role = 'manager'` e `location_id = NULL`.

---

## 10. Fontes de Dados

### 10.1 Status ERP
- Acesso via agente instalado no servidor RDP do cliente
- Extração read-only via SELECT em views de BI do SQL Server
- Inventário completo: `docs/data/inventory/status-inventory.md`
- Views relevantes para o MVP:
  - `TMPBI_VENDA_DETALHADA` — vendas com custo embutido (watermark: `DATA_EMISSAO`)
  - `TITEM` + `TGRPI` + `TSGrI` + `TCATI` — cadastro de produtos com hierarquia completa (full sync ocasional)

### 10.2 WebPosto ERP
- Acesso via API REST (Quality Automação)
- Base URL: `https://web.qualityautomacao.com.br`
- Paginação via cursor `ultimoCodigo`
- Inventário completo: `docs/data/inventory/webposto-inventory.md`
- Endpoints relevantes para o MVP:
  - `GET /INTEGRACAO/VENDA_ITEM` — itens de venda
  - `GET /INTEGRACAO/ABASTECIMENTO` — abastecimentos (combustível)
  - `GET /INTEGRACAO/PRODUTO` — cadastro de produtos

---

## 11. Modelo Canônico — Visão Geral

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

## 12. Design de Referência — Frontend

**A fonte de verdade visual é `design_example/postoinsight/`.**

Todo agente Frontend deve ler esses arquivos antes de implementar qualquer componente:
- `PostoInsight.html` — tokens CSS completos (cores, espaçamentos, tipografia)
- `layout.jsx` — Topbar, Sidebar, KpiCard, SectionCard, LineChart, StatusBadge, ChartLegend
- `page-vendas.jsx`, `page-combustivel.jsx`, `page-conveniencia.jsx`, `page-dre.jsx`
- `page-sync.jsx`, `page-settings.jsx`, `page-login.jsx`
- `data.js` — shapes dos dados mock (referência dos contratos com a API)

O design usa **CSS variables** definidas no HTML — não usa Tailwind nem CSS framework.
Os charts no design são SVG customizados — na implementação real, usar **ECharts** (ADR-011).

---

## 13. Documentações de Referência

Antes de implementar qualquer camada, leia a documentação oficial correspondente:

### Backend
- Fastify: https://fastify.dev/docs/latest/
- Drizzle ORM: https://orm.drizzle.team/docs/overview
- Drizzle com PostgreSQL: https://orm.drizzle.team/docs/get-started-postgresql
- pg-boss: https://github.com/timgit/pg-boss
- @fastify/cookie: https://github.com/fastify/fastify-cookie

### Frontend
- Vite: https://vitejs.dev/guide/
- React Router v6: https://reactrouter.com/en/main
- TanStack Query v5: https://tanstack.com/query/latest
- ECharts for React: https://github.com/hustcc/echarts-for-react

### Infra
- Railway deploy: https://docs.railway.app/getting-started

---

## 14. Decisões Técnicas (ADRs)

Decisões já tomadas que devem ser respeitadas:

| ADR | Decisão | Escolha |
|-----|---------|---------|
| ADR-001 | ORM | Drizzle (não Prisma) |
| ADR-002 | Jobs | pg-boss (não BullMQ + Redis) |
| ADR-003 | Auth (backend) | @auth/core/jwt JWE |
| ADR-004 | Sync | Watermark (não CDC) |
| ADR-005 | Agente | WebSocket persistente (não polling HTTP) |
| ADR-006 | Deploy | Railway (não Hetzner VPS) |
| ADR-007 | API/Worker | Serviços separados no Railway |
| ADR-008 | Nomenclatura | Domain-neutral (locations, tenants) |
| ADR-009 | Schema | Auditoria e BI no schema `app` |
| ADR-010 | Frontend | **Vite + React SPA** (não Next.js) |
| ADR-011 | Charts | **ECharts** (não Recharts/Tremor) |
| ADR-012 | Auth SPA | **Cookie HttpOnly** emitido pelo Fastify |

---

## 15. Onboarding de Clientes

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
5. `app.users` + `app.tenant_users` — usuário admin do cliente com role `owner`, `location_id = NULL`

O agente recebe os tokens como variável de ambiente `LOCATIONS=cdEstab:token,...` (uma entrada por location).

Depois: instalar o agente `.exe` no RDP com o arquivo `.env` configurado.

> Runbook completo: `docs/ops/onboarding.md`

---

## 16. Estado Atual da Implementação

### ✅ Em produção (API + pipeline)
- `packages/db` — Drizzle schema completo (app/raw/canonical/analytics), migrations aplicadas até `0003_little_zaladane`, seed (Rede JAM)
- `packages/shared` — tipos, `deriveSegmento()`
- `apps/api` — Fastify + WebSocket `/agent/v1/connect`, pipeline pg-boss, `POST /admin/backfill`
- `apps/api` — 4 grupos de endpoints de dashboard: `/api/v1/vendas`, `/api/v1/combustivel`, `/api/v1/conveniencia`, `/api/v1/dre`
- `apps/api/src/lib/auth.ts` — middleware `requireTenantSession` (JWE decode, impersonation)
- `apps/api/src/pipeline/refresh-analytics.ts` — refresh das 4 MVs com CONCURRENTLY
- `apps/agent` — Extração SQL Server, WebSocket client, bundlado como `.exe`
- Railway — API + worker (2 serviços) + PostgreSQL
- Rede JAM — 4 locations conectadas, pipeline end-to-end validado

### ✅ Implementado (aguardando migration + testes)
- `apps/api/src/routes/auth.ts` — `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`, `POST /auth/change-password`
  - ⚠️ Pendente: migration para `password_changed_at` e `next_run_at`
- `packages/db/src/schema/app.ts` — schema corrigido (sintaxe Drizzle v0.30), campo `password_changed_at` adicionado

### ✅ Implementado — `apps/web` (frontend, telas prontas sem dados)
- Scaffold completo Vite 5 + React 18 + TypeScript (2026-05-03)
- Autenticação: `AuthContext` + `GET /auth/me` no boot + cookie HttpOnly (ADR-012)
- Design tokens de `design_example/postoinsight/PostoInsight.html` em `src/styles/tokens.css`
- Tema claro/escuro: `data-theme` no HTML, persistido em `localStorage`
- Período ativo e location filter sincronizados com `searchParams` da URL
- Componentes: `Topbar`, `Sidebar`, `AppLayout`, `KpiCard`, `SectionCard`, `StatusBadge`, `HorizBar`, `ChartLegend`, `LineAreaChart` (ECharts), `BarChart` (ECharts)
- Páginas implementadas (visual fiel ao design):
  - `/login` — LoginPage
  - `/dashboard` — Visão Geral (KPIs + evolução + breakdown por segmento)
  - `/combustivel` — Combustível (KPIs + evolução por produto + tabela detalhada)
  - `/conveniencia` — Conveniência & Serviços (KPIs + evolução + drill-down categorias)
  - `/dre` — DRE Mensal (seletor de mês + tabela comparativa)
  - `/sync` — Sincronização (cards por location + histórico de jobs)
  - `/settings` — Configurações (perfil + tenant info)
- `VITE_API_URL=http://localhost:3000`, proxy Vite para `/api` e `/auth`
- **Estado atual: telas renderizando corretamente — sem dados** (falta `GET /api/v1/locations`, `GET /api/v1/sync/status` e backfill completo)

### ❌ Pendente
- `GET /api/v1/locations` — endpoint para seletor de unidades na Topbar
- `GET /api/v1/sync/status` — endpoint para página `/sync`
- Backfill completo das 4 locations (histórico completo das MVs)
- Migration para colunas novas do schema (`password_changed_at`, `next_run_at` em sync_state)
- Deploy `apps/web` no Railway (build estático `dist/`)
- `docs/ops/onboarding.md` — runbook para novos clientes

---

*Última atualização: 2026-05-03 — documento vivo, atualizado conforme o projeto evolui.*

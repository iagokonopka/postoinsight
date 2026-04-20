# CLAUDE.md — PostoInsight

> Este arquivo é lido automaticamente pelo Claude Code a cada sessão.
> Ele define as regras, contexto e estrutura do projeto.
> **Nunca ignore este arquivo. Nunca tome decisões que conflitem com ele.**

---

## 1. O Projeto

**PostoInsight** é uma plataforma SaaS de Business Intelligence para redes de postos de combustível.

- Centraliza dados de ERPs (Status e WebPosto) em um modelo canônico
- Expõe dashboards de vendas, análise por categoria e DRE mensal
- Clientes são redes de postos (multi-tenant) — nunca postos individuais
- Documento completo: `docs/product/PRD.md`

---

## 2. Regras de Comportamento — OBRIGATÓRIAS

### 2.1 Antes de qualquer ação

- **Sempre leia os documentos relevantes antes de implementar.** Se a tarefa envolve dados → leia `docs/data/`. Se envolve API → leia `docs/api/`. Se envolve frontend → leia `docs/architecture/`.
- **Sempre pergunte antes de criar um arquivo novo.** Apresente o que pretende criar, onde e por quê. Aguarde confirmação.
- **Nunca tome decisões de arquitetura silenciosamente.** Se encontrar um problema que exige uma decisão, pare e apresente as opções antes de escolher.
- **Nunca altere o schema do banco sem uma migration.** Todo DDL passa pelo Drizzle. Nenhuma alteração manual.

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
| Agente (Status) | Node.js + TypeScript → `.exe` via `pkg` | Node 20 |
| Ambiente local | WSL Ubuntu + Docker Compose | — |
| Produção MVP | Railway | — |

**Nunca substitua uma tecnologia da stack sem um ADR aprovado em `docs/architecture/decisions/`.**

---

## 5. Estrutura do Repositório

```
postoinsight/
  apps/
    web/                  ← Next.js frontend
    api/                  ← Fastify backend
    agent/                ← Agente Status (Node.js → .exe)
  packages/
    db/                   ← Drizzle schema + migrations
    shared/               ← tipos e utilitários compartilhados
  docs/
    product/
      PRD.md              ← ✅ existe
    architecture/
      overview.md         ← ❌ legado, ignorar
      decisions/          ← ✅ 7 ADRs escritos
    data/
      canonical-model.md  ← ✅ completo para MVP
      inventory/
        status-inventory.md    ← ✅ existe
        webposto-inventory.md  ← ✅ existe
    api/
      api.md              ← ❌ legado, ignorar
    specs/                ← ✅ 5 specs completas (sync-status, dashboard-vendas, dashboard-combustivel, dashboard-conveniencia, dre-mensal)
    db/
      schema.sql          ← ✅ DDL completo com 4 MVs
  docker-compose.yml      ← ⏳ a criar
  CLAUDE.md               ← este arquivo
```

> A fase de documentação está concluída. O projeto está na fase de implementação.

---

## 6. Banco de Dados — Schemas e Responsabilidades

```
app        ← operacional: tenants, users, postos, connectors, sync_jobs
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

## 8. Multitenancy

- Cada rede de postos é um `tenant` isolado
- Todo dado analítico tem `tenant_id`
- Dados **nunca cruzam entre tenants**
- Toda query deve filtrar por `tenant_id` — sem exceção

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

**De cada posto:**
- Nome do posto ex: "JAM Centro"
- Endereço (opcional no MVP)
- `CD_ESTAB` — obtido via SELECT em `TMPBI_VENDA_DETALHADA` com o acesso abaixo

**Acesso ao banco (1x por instalação do agente):**
- Host + porta do SQL Server
- Nome do database
- Usuário read-only + senha

### O que montar internamente

Com as informações acima, o seed script cria:
1. `app.tenants` — 1 registro da rede
2. `app.postos` — 1 por `CD_ESTAB` encontrado
3. `app.connectors` — `credentials: { host, port, database, user, password }`
4. `app.sync_state` — watermark inicial NULL (busca histórico completo)
5. `app.users` + `app.tenant_users` — usuário admin do cliente com role `owner`

Depois: instalar o agente `.exe` no RDP com o token gerado para o conector.

> Runbook completo: `docs/ops/onboarding.md`

---

## 14. O que Ainda Não Existe

Os seguintes documentos são **pré-requisitos para implementação** e ainda estão sendo produzidos:

| Documento | Caminho | Status |
|-----------|---------|--------|
| Onboarding runbook | `docs/ops/onboarding.md` | ❌ pendente |
| Design da API | `docs/api/api.md` | ❌ pendente (antigo é legado) |
| Specs de feature | `docs/specs/` | ❌ pendente |

**Não implemente nada que dependa destes documentos até que eles existam.**

---

*Última atualização: 2026-04-05 — documento vivo, atualizado conforme o projeto evolui.*

# PostoInsight — Decisões de Arquitetura

> Documento vivo. Atualizado conforme decisões são tomadas.
> Status: 🔄 em definição

---

## Checklist

| # | Etapa | Status |
|---|---|---|
| 1 | Entendimento do domínio | ✅ |
| 2 | Fronteiras do sistema | ✅ |
| 3 | Princípios arquiteturais | ✅ |
| 4 | Capacidades do sistema | ✅ |
| 5 | Contrato de dados (canonical model) | ✅ |
| 6 | Modelagem do banco PostgreSQL | ✅ |
| 7 | Design da API | ✅ |
| 8 | Estrutura do frontend / BI | ❌ |
| 9 | Infra e deployment | ✅ |
| 10 | Decisões críticas e tradeoffs | ❌ |

---

## 1. Domínio

**Produto:** SaaS de BI para redes de postos de combustível.
O cliente é o dono ou gestor da rede — não o posto individualmente.

**Usuários:**
- Dono da rede — vê todos os postos
- Gestor de posto — vê só o seu
- Consultor externo — acesso configurável

**Fontes de dados:**
- **Status ERP** — SQL Server dentro de servidor RDP do cliente
- **WebPosto ERP** — API REST (Quality Automação)

---

## 2. Fronteiras do sistema

**Princípio fundamental:** somos third-party. Zero impacto no servidor do cliente.

| Responsabilidade | Onde |
|---|---|
| Extrair dados do ERP | Agente/conector |
| Processar, transformar, armazenar | PostoInsight (nosso servidor) |
| Exibir dashboards | Frontend do cliente |

**Agente do Status (RDP):**
- Instalado no servidor do cliente
- Faz `SELECT` read-only incremental (por watermark)
- `POST` via HTTPS para o nosso endpoint de ingestão
- Zero processamento, zero armazenamento local
- Footprint mínimo: ~25-35MB RAM idle, ~0% CPU, ~1KB/min de rede

**Conector do WebPosto:**
- Roda no nosso servidor
- Consome a API REST do WebPosto
- Mesma interface de saída do agente do Status

### Arquitetura do agente (Status)

O agente mantém uma **conexão WebSocket persistente de saída** (sem expor porta, sem problema de firewall). O servidor empurra comandos por essa conexão — padrão usado por GitHub Actions self-hosted runners, Datadog Agent, Cloudflare Tunnel.

**Estrutura no RDP:**
```
postoinsight-agent/
  config.json     ← API key, credenciais SQL Server, URL do endpoint
  agent.js        ← script principal
  package.json
```

Executado via **Windows Task Scheduler** (nativo, zero dependência).

**Fluxo de comunicação:**
```
Agente → abre WebSocket para wss://api.postoinsight.com/agent
       → autentica com API key
       → mantém conexão viva (heartbeat a cada 30s)
       → aguarda eventos do servidor

Servidor → recebe trigger (cron ou manual)
         → cria job no pg-boss (persistido no banco)
         → empurra evento via WebSocket se agente conectado
         → se agente offline: job fica pendente, executa ao reconectar
```

**Ciclo de sync:**
```
1. Agente recebe evento (ou reconecta e puxa jobs pendentes)
2. GET /api/sync/watermark → pega o watermark do nosso servidor
3. SELECT nas views do SQL Server WHERE data >= watermark
4. POST /api/ingest em batches
5. PATCH /api/sync/jobs/:id { status: "success" }
```

> O watermark fica no **nosso servidor**, não no cliente. Reinstalar o agente não perde progresso.

### Entidades sincronizadas (MVP — Status)

| Entidade | View/Tabela Status | Watermark |
|---|---|---|
| Vendas | `TMPBI_VENDA_DETALHADA` + `TMPBI_VENDA_DETALHADA_CUSTOS` | `DATA_EMISSAO` |
| Produtos | `TITEM` | full sync ocasional |
| Formas de pagamento | `TMODP` | full sync ocasional |

### Trigger: cron vs on-demand

| Tipo | Quando | Como |
|---|---|---|
| `scheduled` | Diário, noturno | Task Scheduler → agente inicia o ciclo |
| `manual` | Cliente clica "Sincronizar agora" | POST /api/sync/trigger → job no pg-boss → WebSocket push |

**Fluxo on-demand:**
```
Cliente clica "Sincronizar agora"
→ POST /api/sync/trigger          cria sync_job { trigger: "manual", status: "pending" }
→ servidor empurra via WebSocket  se agente conectado: executa em segundos
→ se agente offline               job persiste no pg-boss, executa ao reconectar
→ agente executa e envia dados    POST /api/ingest
→ agente conclui                  PATCH /api/sync/jobs/:id { status: "success" }
→ frontend atualiza               via SSE ou WebSocket
```

---

## 3. Princípios arquiteturais

- **Canonical model:** conectores traduzem o schema do ERP para o modelo canônico. A aplicação nunca conhece o schema do ERP.
- **Incremental por watermark:** `data >= ultimo_sync`. Carga histórica completa só na primeira vez.
- **Multitenancy:** cada rede é um tenant isolado. Dados nunca cruzam entre tenants.
- **Reprocessabilidade:** raw data sempre preservado. Qualquer transformação pode ser refeita.
- **Agente burro:** lógica centralizada no nosso servidor. Agente só extrai e envia.

---

## 4. Capacidades do sistema

| Capacidade | Descrição |
|---|---|
| Conectores | Status (agente RDP) e WebPosto (API REST) |
| Ingestão | Agendada (cron diário) e on-demand (botão no cliente) |
| Auth | Login, papéis por tenant, controle de acesso por posto |
| Pipeline | Ingestão → validação → transformação → canonical |
| BI Webapp | Dashboards, filtros por posto e período, drill-down |
| AI (futuro) | Perguntas em linguagem natural sobre os dados |

---

## 5. Contrato de dados (canonical model)

> Detalhamento completo, campo a campo, com mapeamento Status e WebPosto em `docs/data-contract.md`.


### Análises que o sistema precisa suportar
- Vendas totais (por posto, por período)
- Vendas combustível vs conveniência
- Vendas por grupo e subgrupo
- Análise de custo e margem bruta
- Breakdown por forma de pagamento

### Hierarquia de produtos (canônica)

| Nível | Canônico | Status | WebPosto |
|---|---|---|---|
| 1 | `categoria` | `CODIGO_CATEGORIA_ITEM` (CB, BEB, TAB...) | `grupoCodigo` |
| 2 | `grupo` | `CODIGO_GRUPO_ITEM` | `subGrupo1Codigo` |
| 3 | `subgrupo` | `CODIGO_SUBGRUPO_ITEM` | `subGrupo2Codigo` |

### Mapeamento fato_venda

| Campo canônico | Status | WebPosto |
|---|---|---|
| `posto_id` | `Cd_Estab` | `empresaCodigo` |
| `data_venda` | `Dt_Emissao` | `dataMovimento` |
| `produto_id` | `Cd_Produto` | `produtoCodigo` |
| `categoria_codigo` | `CODIGO_CATEGORIA_ITEM` | `grupoCodigo` |
| `grupo_id` | `CODIGO_GRUPO_ITEM` | `subGrupo1Codigo` |
| `subgrupo_id` | `CODIGO_SUBGRUPO_ITEM` | `subGrupo2Codigo` |
| `qtd_venda` | `Qtd_Venda` | `quantidade` |
| `vlr_unitario` | `Vlr_Unitario` | `precoVenda` |
| `vlr_total` | `Vlr_Total` | `totalVenda` |
| `custo_unitario` | via `VENDA_DETALHADA_CUSTOS` | `precoCusto` |
| `desconto_total` | `Vlr_Desconto` | `totalDesconto` |
| `bico_codigo` | `Cd_Bico` | `bicoCodigo` |
| `forma_pagamento` | tabela separada | `/VENDA_FORMA_PAGAMENTO` |

> `bico_codigo IS NOT NULL` → item de combustível. Loja convencional = null.
> WebPosto: `/ABASTECIMENTO` mapeado para `fato_venda` com `bico_codigo` preenchido.

### Tabelas — visão geral

| Schema | Tabela | Tipo | Descrição |
|---|---|---|---|
| `app` | `tenants` | Operacional | Redes de postos |
| `app` | `users` | Operacional | Usuários |
| `app` | `tenant_users` | Operacional | Vínculo usuário↔tenant com role |
| `app` | `postos` | Operacional (SCD2) | Postos da rede |
| `app` | `connectors` | Operacional | Config de conexão ERP |
| `app` | `sync_jobs` | Operacional | Histórico de execuções (trigger: scheduled/manual, status: pending/running/success/error) |
| `raw` | `raw_ingest` | Bronze | Payload bruto do ERP (JSONB) |
| `canonical` | `fato_venda` | Silver — Fato | Item de venda |
| `canonical` | `fato_venda_pagamento` | Silver — Fato | Formas de pagamento por venda |
| `canonical` | `dim_produto` | Silver — Dim (SCD2) | Cadastro de produtos |
| `canonical` | `dim_forma_pagamento` | Silver — Dim | Lookup de formas de pagamento |
| `canonical` | `dim_tempo` | Silver — Dim | Calendário |
| `analytics` | `mv_vendas_diarias` | Gold — View | Vendas agregadas por dia |
| `analytics` | `mv_vendas_por_categoria` | Gold — View | Breakdown combustível/conveniência |
| `analytics` | `mv_margem_produto` | Gold — View | Custo e margem por produto |
| `analytics` | `mv_vendas_forma_pagamento` | Gold — View | Breakdown por forma de pagamento |

### Arquitetura medallion

```
ERP → raw.raw_ingest (Bronze — payload intocado)
    → pipeline transforma e valida
    → canonical.fato_venda (Silver — modelo canônico)
    → REFRESH MATERIALIZED VIEW
    → analytics.mv_* (Gold — pré-agregado para o frontend)
```

**Schemas e responsabilidades:**
- `raw` — nunca lido pelo frontend. Só pelo pipeline.
- `canonical` — fonte de verdade analítica. Lido pela API para queries sob demanda.
- `analytics` — materialized views. Serve 90% das queries do frontend.
- `app` — operacional. Gerenciado pelo Drizzle (migrations).

### SCD2 — dimensões com histórico

`dim_produto` e `postos` implementam SCD2:
- `valid_from`, `valid_to` (NULL = atual), `is_current`
- Garante que vendas históricas sempre referenciam a versão correta do produto/posto

---

## 9. Stack e infra

| Camada | Decisão | Alternativas consideradas |
|---|---|---|
| Frontend | Next.js + TypeScript | Vite+React, Remix |
| Backend | Fastify + TypeScript | Express, NestJS |
| ORM / queries | Drizzle | Prisma, Prisma+raw pg |
| Jobs / pipeline | pg-boss | BullMQ+Redis, node-cron |
| Auth | Auth.js | Clerk, JWT manual |
| Banco | PostgreSQL | — |
| Local dev | Docker Compose | — |
| Prod MVP | Railway | Hetzner VPS, Render |

### Racional das decisões

- **Drizzle** sobre Prisma: cobre CRUD operacional e queries analíticas complexas com type safety. Prisma é fraco para analytics.
- **pg-boss** sobre BullMQ: sem infra extra (Redis). Jobs persistidos no próprio PostgreSQL. Suficiente para o volume do MVP.
- **Auth.js** sobre Clerk: self-hosted, sem custo, sem vendor lock-in. Integra nativamente com Next.js.
- **Railway** para MVP: zero ops. Foco no produto. Migra para Hetzner/AWS quando houver tração.

### Ambiente local

```yaml
# docker-compose.yml
services:
  postgres:    # PostgreSQL local (4 schemas: app, raw, canonical, analytics)
  backend:     # Fastify API (pg-boss roda aqui, sem serviço extra)
  frontend:    # Next.js
```

---

## 6. Modelagem do banco PostgreSQL

DDL completo em `docs/db/schema.sql`.

### Agente do Status — stack profissional

O agente é um **Windows Service**, não um script agendado.

| Aspecto | Decisão |
|---|---|
| Linguagem | Node.js + TypeScript |
| Empacotamento | `pkg` → `.exe` único |
| Instalação | NSSM → Windows Service (inicia com o Windows, auto-restart) |
| Comunicação | WebSocket persistente (comandos) + HTTPS (dados) |
| Config | `config.json` ao lado do `.exe` (API key, credenciais SQL) |
| Logs | Windows Event Log + arquivo local |
| Acesso SQL | Usuário read-only dedicado + `NOLOCK` hints + horário off-peak |

Referência: mesmo modelo do Fivetran Hybrid Deployment, Airbyte Agent, Datadog Agent.

### Por que watermark em vez de CDC

CDC é o padrão profissional para capturar mudanças em SQL Server. Porém o Status expõe **views** (`TMPBI_VENDA_DETALHADA`) — CDC não funciona em views. Watermark nas views BI é a abordagem correta dado o contexto.

---

## 7. Design da API

Detalhamento completo em `docs/api.md`.

### Decisões

- **REST** sobre GraphQL: dashboards têm queries fixas, cache HTTP nativo, menor complexidade
- **Versionado** `/api/v1` desde o início
- **JWT em cookie httpOnly** — nunca exposto ao JavaScript
- **Dois contextos separados**: `/api/v1` (frontend) e `/agent/v1` (agente), autenticações distintas
- **Ingest recebe payload bruto** — transformação acontece no pipeline, não na ingestão

### Resumo das rotas (24 total)

| Grupo | Rotas | Contexto |
|---|---|---|
| Auth | login, logout, refresh, me | Frontend |
| Postos | list, detail | Frontend |
| Connectors | list, create, update, delete | Frontend |
| Sync | trigger, jobs list, job detail | Frontend |
| Analytics | resumo, evolução, por-categoria, por-posto, margem, pagamentos | Frontend |
| Agente | watermark, pending jobs, ingest, update job, WebSocket | Agente |

---

## Pendente

- [ ] 8. Estrutura do frontend / BI (páginas, componentes, charts)
- [ ] 10. Decisões críticas e tradeoffs documentados
# PROJECT_STATUS.md — PostoInsight

> Arquivo de contexto vivo. Atualizado ao fim de cada sessão de trabalho.
> Qualquer pessoa (ou IA) que abrir este arquivo deve saber exatamente onde o projeto está e o que fazer a seguir.

---

## Última atualização
**Data:** 2026-04-06
**Sessão:** Todas as specs MVP concluídas — dashboard-vendas, dashboard-combustivel, dashboard-conveniencia, dre-mensal

---

## Contexto do Projeto

PostoInsight é um SaaS de BI para redes de postos de combustível.
Centraliza dados de ERPs (Status e WebPosto) e expõe dashboards de vendas, análise por categoria e DRE mensal.

**Repositório:** local em `\\wsl.localhost\Ubuntu\home\dev\postoinsight\`
**Documentação base:** `docs/` no repositório

---

## Fases do Projeto

### ✅ Fase 1 — Discovery
Completa. Fontes de dados mapeadas, problema de negócio definido, stack decidida.

### ✅ Fase 2 — Arquitetura (parcial)
- ✅ `CLAUDE.md` — regras e stack definidas
- ✅ Repositório + estrutura de pastas
- ✅ ADRs em `docs/architecture/decisions/` — 7 ADRs escritos (incl. ADR-007 api/worker separation)
- ❌ Diagrama `.excalidraw` — pendente
- ❌ `docs/architecture/overview.md` — o arquivo existe mas é **legado** (versão antiga, ignorar)

### ✅ Fase 3 — Dados
- ✅ Inventário Status ERP (`docs/data/inventory/status-inventory.md`)
- ✅ Inventário WebPosto ERP (`docs/data/inventory/webposto-inventory.md`)
- ✅ Canonical model (`docs/data/canonical-model.md`) — **completo para o MVP**

### ❌ Fase 4 — Implementação (bloqueada: faltam ADRs e specs)

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
| CLAUDE.md | `CLAUDE.md` | ✅ válido e atualizado |
| PRD | `docs/product/PRD.md` | ✅ válido |
| Inventário Status | `docs/data/inventory/status-inventory.md` | ✅ válido |
| Inventário WebPosto | `docs/data/inventory/webposto-inventory.md` | ✅ válido |
| Canonical model | `docs/data/canonical-model.md` | ✅ completo para MVP |
| Architecture overview | `docs/architecture/overview.md` | ❌ legado — ignorar |
| ADRs | `docs/architecture/decisions/` | ✅ 7 ADRs escritos |
| DDL do banco | `docs/db/schema.sql` | ✅ completo (4 MVs incluídas) |
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

### 🔴 Agora — Implementação

Ordem de execução:

1. **Setup do ambiente local** — Docker Compose, monorepo (apps/web, apps/api, apps/agent, packages/db, packages/shared)
2. **packages/db** — Drizzle schema + migrations (baseado em `docs/db/schema.sql`)
3. **apps/agent** — Agente Status (Windows Service via `pkg` + NSSM, WebSocket, spec `sync-status.md`)
4. **apps/api** — Fastify: endpoints `/agent/v1/connect` + `/agent/v1/ingest` + pipeline pg-boss
5. **apps/api** — Endpoints de dashboard (`/api/v1/vendas`, `/api/v1/combustivel`, `/api/v1/conveniencia`, `/api/v1/dre`)
6. **apps/web** — Next.js: autenticação (Auth.js v5) + dashboards

### 🟡 Antes de implementar

- Onboarding runbook — `docs/ops/onboarding.md` (coletar dados do primeiro cliente piloto)
- Diagrama `.excalidraw` da arquitetura

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
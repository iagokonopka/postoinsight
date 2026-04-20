# ADR-007 — Separação de processos: API vs Worker

**Data:** 2026-04-05
**Status:** Aceito

---

## Contexto

PostoInsight tem duas categorias de trabalho com características opostas:

- **API (latência-sensitiva):** responde requisições HTTP do frontend e conexões WebSocket dos agentes. Precisa de baixa latência e alta disponibilidade. Um request lento afeta diretamente a experiência do usuário.

- **Pipeline (throughput-sensitivo):** processa jobs de sync e backfill. Pode ser lento, consome memória e CPU proporcionalmente ao volume de dados. Um backfill inicial de um posto com anos de histórico pode levar horas.

A questão é: esses dois tipos de trabalho devem rodar no mesmo processo ou em processos separados?

---

## Decisão

**Dois processos separados, deployados como dois services independentes no Railway:**

| Service | Responsabilidade |
|---------|-----------------|
| `api` | Fastify HTTP/WS — serve o frontend, recebe dados dos agentes, enfileira jobs |
| `worker` | pg-boss workers — processa filas de pipeline, backfill e sync |

Mesmo codebase (monorepo), mesmo banco PostgreSQL, processos completamente separados.

---

## Justificativa

### 1. Isolamento de recursos

Um backfill de posto com milhões de registros consome CPU e memória por horas. Rodando no mesmo processo da API, degradaria o tempo de resposta do frontend durante toda a carga inicial — inaceitável para o usuário.

Com processos separados, o worker pode estar sob carga máxima sem afetar um único request da API.

### 2. Escala independente

No Railway, cada service tem seu próprio container com CPU e memória configuráveis. É possível dar mais recursos ao worker durante onboarding de um cliente grande, sem impactar (e sem pagar mais por) o service da API.

### 3. Crash isolation

Se o worker travar ou ser reiniciado (OOM, bug no pipeline), a API continua servindo o frontend normalmente. Os jobs ficam na fila do pg-boss e são retomados quando o worker voltar.

### 4. Controle de concorrência por fila

Dentro do worker, pg-boss permite configurar concorrência por fila:

```typescript
// Backfill: serializado, 1 job de cada vez
pgBoss.work('backfill:*', { teamSize: 1, teamConcurrency: 1 }, handler)

// Sync incremental: paralelo entre postos
pgBoss.work('sync:*', { teamSize: 4, teamConcurrency: 2 }, handler)
```

Backfill nunca bloqueia syncs incrementais de outros tenants.

---

## Arquitetura resultante

```
[Railway: api]                    [Railway: worker]
  Fastify HTTP :3000                pg-boss consumers
  Fastify WS   :3000                  backfill:fato_venda  (concurrency: 1)
                                      backfill:dim_produto (concurrency: 1)
  recebe payload do agente →          sync:fato_venda      (concurrency: 4)
  INSERT raw.raw_ingest               sync:dim_produto     (concurrency: 2)
  pgBoss.send('sync:...')
                  │                         │
                  └──────── PostgreSQL ──────┘
                              pg-boss tables
                              raw.*
                              canonical.*
                              app.*
```

### Fluxo de dados

1. Agente conecta no `api` via WebSocket
2. `api` recebe payload → grava em `raw.raw_ingest` → enfileira job no pg-boss
3. `worker` pega o job da fila → transforma → persiste em `canonical.*`
4. `worker` dispara `REFRESH MATERIALIZED VIEW` após cada sync bem-sucedida

---

## Estratégia de backfill

Backfill é o caso mais crítico — posto novo com anos de histórico.

**Divisão por janelas mensais:**

O servidor enfileira um job por mês de histórico, em ordem cronológica:

```
backfill:fato_venda { posto_id, from: '2023-01-01', to: '2023-01-31' }
backfill:fato_venda { posto_id, from: '2023-02-01', to: '2023-02-28' }
... (um job por mês)
backfill:fato_venda { posto_id, from: '2026-03-01', to: '2026-03-31' }
```

Cada janela processa ~30 dias. Progress salvo a cada janela concluída. Falha → retoma do mês que parou, não do início.

**Parâmetros reduzidos durante backfill:**

```json
{ "batch_size": 200, "delay_ms": 200 }
```

Lotes menores e delay intencional entre lotes para não sobrecarregar o SQL Server do cliente nem o banco PostoInsight.

**Campo de controle em `app.sync_state`:**

```sql
backfill_completed_at timestamptz  -- NULL = backfill ainda em andamento
```

O worker só agenda syncs incrementais após `backfill_completed_at IS NOT NULL`. Não faz sentido rodar sync incremental enquanto o backfill ainda está chegando em 2024.

---

## Alternativas descartadas

| Alternativa | Motivo da rejeição |
|------------|-------------------|
| API e worker no mesmo processo | Backfill degrada API. Crash do pipeline derruba o frontend |
| Worker em infra separada (VPS dedicado) | Complexity ops desnecessária para MVP |
| Serverless functions para o pipeline | Limite de timeout (15min no Railway) incompatível com backfills longos |
| Thread pool dedicado no mesmo processo | Node.js é single-threaded; worker_threads adicionam complexidade sem resolver o isolamento de memória |

---

## Consequências

- Dois services para deploy e monitorar no Railway
- Variáveis de ambiente compartilhadas (DATABASE_URL, etc.) — configuradas em ambos os services
- `packages/worker/` como entry point separado do `packages/api/` no monorepo
- `app.sync_state` precisa do campo `backfill_completed_at` — DDL a atualizar

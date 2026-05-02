# SPEC — Sync Status ERP

**Versão:** 1.1
**Data:** 2026-04-06
**Status:** Pronto para implementação

---

## 1. Visão Geral

Esta spec cobre o fluxo completo de sincronização de dados do Status ERP para o PostoInsight:

1. **Agente** — Windows Service no RDP do cliente. Extrai dados do SQL Server e envia para o servidor PostoInsight via WebSocket.
2. **Pipeline** — recebe o payload raw, valida, transforma e persiste no modelo canônico.

O agente é burro: extrai e envia. Toda lógica de negócio fica no pipeline.

---

## 2. Escopo do MVP

### Entidades sincronizadas

| Entidade | Estratégia | Fonte Status | Frequência |
|----------|-----------|-------------|------------|
| `fato_venda` | Incremental (watermark) | `TMPBI_VENDA_DETALHADA` | Diário + on-demand |
| `dim_produto` | Full sync | `TITEM` + `TGRPI` + `TSGrI` + `TCATI` | On-demand / semanal |

### Fora do escopo desta spec
- WebPosto ERP (spec separada)
- Materialized views de analytics (definidas nas specs de dashboard)

---

## 3. Arquitetura do Fluxo

API e worker rodam como **dois processos separados** (ver ADR-007). O API nunca processa jobs — apenas recebe dados e enfileira. O worker nunca serve HTTP — apenas consome filas.

```
[SQL Server do cliente]
    │
    │  SELECT WHERE DATA_EMISSAO >= :watermark  (sync)
    │  SELECT WHERE DATA_EMISSAO BETWEEN :from AND :to  (backfill)
    │
[Agente — Windows Service]
    │
    │  WebSocket WSS :443
    │
[Railway: api — Fastify]
    │
    │  INSERT raw.raw_ingest (payload JSONB intocado)
    │  pgBoss.send('sync:fato_venda' | 'backfill:fato_venda', ...)
    │
    └──────────────── PostgreSQL ──────────────────┐
                                                   │
[Railway: worker — pg-boss consumers]              │
    │                                              │
    ├─ sync:fato_venda      (concurrency: 4) ──────┤
    ├─ sync:dim_produto     (concurrency: 2) ──────┤
    ├─ backfill:fato_venda  (concurrency: 1) ──────┤
    └─ backfill:dim_produto (concurrency: 1) ──────┘
         │
         ├─ Valida + transforma
         ├─ Upsert canonical.*
         ├─ Atualiza app.sync_state
         └─ Atualiza app.sync_jobs
```

---

## 4. Agente Status

### 4.1 Tecnologia

- Node.js + TypeScript
- Compilado para `.exe` via `pkg`
- Instalado como Windows Service via NSSM
- Sem dependências no servidor do cliente além do driver ODBC para SQL Server

### 4.2 Configuração

O agente é configurado com um arquivo `.env` gerado no onboarding:

```env
POSTOINSIGHT_API_URL=wss://api.postoinsight.com.br
AGENT_TOKEN=<token gerado por conector no onboarding>
DB_CONNECTION_STRING=<string ODBC do SQL Server do cliente>
```

O `AGENT_TOKEN` identifica unicamente o conector (tenant + posto) no servidor.

### 4.3 Conexão WebSocket

- O agente inicia a conexão de saída — nunca recebe conexão de entrada
- Protocolo: WebSocket sobre TLS (WSS porta 443)
- Autenticação: header `Authorization: Bearer <AGENT_TOKEN>` no handshake
- Reconexão automática com backoff exponencial (1s → 2s → 4s → ... → 60s máx)
- Heartbeat: ping a cada 30s para manter a conexão viva

### 4.4 Fluxo de comandos

O servidor empurra comandos via WebSocket. O agente executa e responde na mesma conexão.

**Comando de sync:**
```json
{
  "command": "sync",
  "job_id": "uuid-do-sync-job",
  "entity": "fato_venda",
  "watermark": "2026-04-04T00:00:00.000Z"
}
```

**Resposta do agente (em lotes):**
```json
{
  "job_id": "uuid-do-sync-job",
  "entity": "fato_venda",
  "batch": 1,
  "total_rows": 847,
  "rows": [ ...payload dos registros... ]
}
```

**Sinalização de fim:**
```json
{
  "job_id": "uuid-do-sync-job",
  "entity": "fato_venda",
  "done": true,
  "total_rows": 847
}
```

### 4.5 Extração — fato_venda

Query executada no SQL Server do cliente:

```sql
SELECT
    CD_ESTAB,
    DATA_EMISSAO,
    HORA_COMPLETA_EMISSAO,
    TURNO,
    NR_NOTA,
    NR_VENDA_INTERNO,
    CODIGO_ITEM,
    DESCRICAO_ITEM,
    CODIGO_CATEGORIA_ITEM,
    DESCRICAO_CATEGORIA_ITEM,
    CODIGO_GRUPO_ITEM,
    DESCRICAO_GRUPO_ITEM,
    CODIGO_SUBGRUPO_ITEM,
    DESCRICAO_SUBGRUPO_ITEM,
    QTD_VENDA,
    QTD_ABASTECIDAS,
    VLR_UNIT,
    TOT_VLRITEM,
    CUSTO_UNIT,
    TOT_DESCONTO_UNIT,
    TOT_ACRESCIMO_UNIT,
    BICO,
    BICO_COMBUSTIVEL,
    TANQUE,
    CODIGO_CLIENTE,
    CODIGO_VENDEDOR,
    FormasRecebimento
FROM TMPBI_VENDA_DETALHADA
WHERE DATA_EMISSAO >= :watermark
ORDER BY DATA_EMISSAO ASC
```

- `:watermark` vem do comando recebido via WebSocket
- Resultados enviados em lotes de **500 registros** para evitar payloads grandes
- O agente não faz nenhum processamento — envia os valores exatamente como vêm do banco

### 4.6 Extração — dim_produto

Full sync: lê todas as tabelas e envia o conjunto completo.

```sql
-- TITEM (produto)
SELECT
    Cd_Item, Descricao, DescrRes, Cd_CatItem,
    Cd_GrpItem, Cd_SGrItem, Cd_TipItem, Unidade, DtCadastro
FROM TITEM

-- TCATI (categorias)
SELECT Cd_CatItem, Descricao FROM TCATI

-- TGRPI (grupos)
SELECT Cd_GrpItem, Descricao FROM TGRPI

-- TSGrI (subgrupos)
SELECT Cd_SGrItem, Descricao FROM TSGrI
```

O agente envia as 4 tabelas como payloads separados com `entity = 'dim_produto_titem'`, `'dim_produto_tcati'`, `'dim_produto_tgrpi'`, `'dim_produto_tsgri'`. O pipeline faz os joins.

---

## 5. Pipeline — fato_venda

### 5.1 Responsabilidades

O pipeline recebe o payload raw de `raw.raw_ingest` e executa, nesta ordem:

1. Resolver `source_location_id` → `location_id` (lookup em `app.locations`)
2. Transformar campos (tipos, nulls, derivações)
3. Validar registros
4. Upsert em `canonical.fato_venda`
5. Atualizar watermark em `app.sync_state`
6. Atualizar status em `app.sync_jobs`

### 5.2 Transformações campo a campo

| Campo canônico | Origem | Regra |
|----------------|--------|-------|
| `location_id` | `CD_ESTAB` | Lookup: `SELECT id FROM app.locations WHERE source_location_id = :CD_ESTAB AND tenant_id = :tenant_id` |
| `source_location_id` | `CD_ESTAB` | Direto |
| `data_venda` | `DATA_EMISSAO` | `datetime.date()` — apenas a parte date |
| `hora_venda` | `HORA_COMPLETA_EMISSAO` | Cast para `time`. Se nulo → NULL |
| `turno` | `TURNO` | Direto. Se nulo ou vazio → NULL |
| `nr_nota` | `NR_NOTA` | `int → text`. Se 0 → NULL |
| `source_produto_id` | `CODIGO_ITEM` | Trim, uppercase |
| `descricao_produto` | `DESCRICAO_ITEM` | Trim |
| `categoria_codigo` | `CODIGO_CATEGORIA_ITEM` | Trim, uppercase |
| `categoria_descricao` | `DESCRICAO_CATEGORIA_ITEM` | Trim |
| `grupo_id` | `CODIGO_GRUPO_ITEM` | smallint |
| `grupo_descricao` | `DESCRICAO_GRUPO_ITEM` | Trim |
| `subgrupo_id` | `CODIGO_SUBGRUPO_ITEM` | smallint. Se 0 → NULL |
| `subgrupo_descricao` | `DESCRICAO_SUBGRUPO_ITEM` | Trim. Se vazio → NULL |
| `is_combustivel` | `CODIGO_CATEGORIA_ITEM` | `=== 'CB'` → true, demais → false |
| `segmento` | `CODIGO_CATEGORIA_ITEM` | `deriveSegmento(categoria_codigo)` — ver tabela em `dashboard-vendas.md §3.2`. NULL = categoria interna |
| `qtd_venda` | `QTD_VENDA` | numeric(15,4) |
| `vlr_unitario` | `VLR_UNIT` | numeric(15,4) |
| `vlr_total` | `TOT_VLRITEM` | numeric(15,4) |
| `custo_unitario` | `CUSTO_UNIT` | numeric(15,4). Se 0 → NULL |
| `desconto_total` | `TOT_DESCONTO_UNIT` | numeric(15,4). Se 0 → NULL |
| `acrescimo_total` | `TOT_ACRESCIMO_UNIT` | numeric(15,4). Se 0 → NULL |
| `bico_codigo` | `BICO` | int. Se 0 → NULL |
| `bico_descricao` | `BICO_COMBUSTIVEL` | Trim. Se vazio ou BICO = 0 → NULL |
| `tanque_codigo` | `TANQUE` | Extrair parte antes do " - " ex: `"03 - GASOLINA"` → `"03"`. Se vazio → NULL |
| `tanque_descricao` | `TANQUE` | String completa. Se vazio → NULL |
| `source_cliente_id` | `CODIGO_CLIENTE` | `int → text`. Se = 1 → NULL (venda a vista) |
| `source_funcionario_id` | `CODIGO_VENDEDOR` | `int → text`. Se = 0 → NULL |
| `forma_pagamento_tipo` | — | NULL (fora do escopo MVP) |
| `source` | — | Literal `"status"` |
| `source_id` | `FormasRecebimento` / composição | Se `FormasRecebimento > 0` → `FormasRecebimento::text`; senão → `NR_VENDA_INTERNO::text + '-' + CODIGO_ITEM` |

### 5.3 Validações

Registros que falham em qualquer regra abaixo são **rejeitados** — não inseridos em canonical, logados em `app.sync_jobs.error_message` com contagem.

| Campo | Regra | Ação |
|-------|-------|------|
| `source_location_id` | Deve resolver para um `location_id` no tenant | Rejeitar + logar |
| `data_venda` | Não nula, não futura (> hoje + 1 dia) | Rejeitar + logar |
| `vlr_total` | >= 0 (devoluções não suportadas no MVP) | Rejeitar + logar |
| `qtd_venda` | > 0 | Rejeitar + logar |
| `vlr_unitario` | Não nulo | Rejeitar + logar |
| `source_produto_id` | Não vazio | Rejeitar + logar |
| Duplicata | `(tenant_id, location_id, source, source_id)` já existe | Ignorar silenciosamente |

### 5.4 Upsert

```sql
INSERT INTO canonical.fato_venda (...)
VALUES (...)
ON CONFLICT (tenant_id, location_id, source, source_id)
DO NOTHING
```

`DO NOTHING` — idempotência. Re-envios não sobrescrevem dados existentes.

### 5.5 Atualização do watermark

Após processar todos os lotes com sucesso:

```sql
INSERT INTO app.sync_state (tenant_id, location_id, erp_source, entity, last_synced_at)
VALUES (:tenant_id, :location_id, 'status', 'fato_venda', :max_data_emissao)
ON CONFLICT (location_id, entity)
DO UPDATE SET last_synced_at = EXCLUDED.last_synced_at, updated_at = now()
```

`:max_data_emissao` = maior `DATA_EMISSAO` do lote processado com sucesso.

---

## 6. Pipeline — dim_produto

### 6.1 Responsabilidades

Full sync: recebe as 4 tabelas (`TITEM`, `TCATI`, `TGRPI`, `TSGrI`), faz os joins internamente e aplica SCD2.

### 6.2 Lógica SCD2

Para cada produto recebido:

1. Buscar versão atual em `canonical.dim_produto WHERE tenant_id = :t AND source = 'status' AND source_produto_id = :id AND is_current = true`
2. **Se não existe** → inserir com `valid_from = today`, `valid_to = NULL`, `is_current = true`
3. **Se existe e nenhum campo mudou** → ignorar
4. **Se existe e algum campo mudou:**
   - `UPDATE SET valid_to = today - 1, is_current = false` na versão atual
   - `INSERT` nova versão com `valid_from = today`, `valid_to = NULL`, `is_current = true`

Campos que disparam nova versão SCD2: `nome`, `categoria_codigo`, `grupo_id`, `subgrupo_id`, `is_combustivel`, `ativo`.

### 6.3 Transformações

| Campo canônico | Origem | Regra |
|----------------|--------|-------|
| `source_produto_id` | `TITEM.Cd_Item` | Trim, uppercase |
| `nome` | `TITEM.Descricao` | Trim |
| `nome_resumido` | `TITEM.DescrRes` | Trim. Se vazio → NULL |
| `categoria_codigo` | `TITEM.Cd_CatItem` | Trim, uppercase |
| `categoria_descricao` | `TCATI.Descricao` | Join por `Cd_CatItem`. Trim |
| `grupo_id` | `TITEM.Cd_GrpItem` | smallint |
| `grupo_descricao` | `TGRPI.Descricao` | Join por `Cd_GrpItem`. Trim |
| `subgrupo_id` | `TITEM.Cd_SGrItem` | smallint. Se 0 → NULL |
| `subgrupo_descricao` | `TSGrI.Descricao` | Join por `Cd_SGrItem`. Se NULL → NULL |
| `tipo_produto` | `TITEM.Cd_TipItem` | `smallint → text` |
| `unidade_venda` | `TITEM.Unidade` | Trim. Se vazio → NULL |
| `is_combustivel` | `TITEM.Cd_CatItem` | `=== 'CB'` → true |
| `segmento` | `TITEM.Cd_CatItem` | `deriveSegmento(categoria_codigo)` — ver tabela em `dashboard-vendas.md §3.2`. NULL = categoria interna |
| `ativo` | `TITEM.Cd_CatItem` + `TITEM.Descricao` | `Cd_CatItem !== 'INA' AND !Descricao.includes('INATIVO')` → true |
| `valid_from` | `TITEM.DtCadastro` | datetime → date. Se nulo → data do sync |

---

## 7. Jobs pg-boss

### 7.1 Filas

| Nome da fila | Disparado por | Handler |
|-------------|---------------|---------|
| `agent:command` | Servidor (on schedule ou on-demand) | Envia comando `sync` para o agente via WebSocket |
| `pipeline:fato_venda` | API `/agent/v1/ingest` ao receber batch | Processa 1 lote de fato_venda |
| `pipeline:dim_produto` | API `/agent/v1/ingest` ao receber batch | Processa full sync de dim_produto |

### 7.1.1 Campos de `app.sync_jobs` relevantes para o pipeline

Campos adicionados na migration 0003 que o pipeline deve preencher:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `triggered_by` | enum | `'scheduler'` (cron automático), `'user'` (disparado via UI/API), `'backfill'` |
| `triggered_by_user_id` | uuid | UUID do usuário que disparou o job, quando `triggered_by = 'user'` |
| `period_from` | date | Data inicial do período processado neste job |
| `period_to` | date | Data final do período processado neste job |
| `retry_count` | integer | Número de tentativas realizadas (default 0) |
| `metadata` | jsonb | Dados adicionais de contexto do job |

Registros rejeitados pelo pipeline devem ser gravados em `app.sync_rejections` com `rejection_reason` e `raw_payload`.

### 7.2 Configuração dos jobs

```typescript
// Retry: 3 tentativas com backoff
{ retryLimit: 3, retryDelay: 60, retryBackoff: true }

// Timeout por job de pipeline
{ expireInSeconds: 300 }  // 5 minutos por lote
```

### 7.3 Agendamento

```typescript
// Sync diário automático — 3h da manhã (horário de Brasília)
pgBoss.schedule('agent:command', '0 6 * * *', {
  command: 'sync',
  entity: 'fato_venda'
})

// dim_produto — toda segunda-feira às 4h
pgBoss.schedule('agent:command', '0 7 * * 1', {
  command: 'sync',
  entity: 'dim_produto'
})
```

---

## 8. API — Endpoints do agente

### `GET /agent/v1/connect` (WebSocket upgrade)

Handshake de conexão do agente. Autentica via `Authorization: Bearer <token>` e mantém conexão aberta.

**Validações:**
- Token válido e ativo em `app.connectors`
- Conector ativo (`active = true`)

### `POST /agent/v1/ingest`

Recebe um lote de dados do agente (também pode ser chamado via WebSocket message).

**Body:**
```json
{
  "job_id": "uuid",
  "entity": "fato_venda",
  "batch": 1,
  "rows": [ ...registros raw... ]
}
```

**Ação:**
1. `INSERT INTO raw.raw_ingest` — payload intocado
2. `pgBoss.send('pipeline:fato_venda', { raw_ingest_id })`
3. Retorna `{ received: true }`

---

## 9. Backfill — Carga histórica inicial

### 9.1 Quando ocorre

Backfill roda uma única vez por posto, no onboarding. É disparado manualmente pela equipe PostoInsight após criar o conector. Somente após `app.sync_state.backfill_completed_at IS NOT NULL` o worker começa a agendar syncs incrementais para aquele posto.

### 9.2 Divisão em janelas mensais

O servidor calcula as janelas de data desde o início do histórico disponível até hoje e enfileira um job por mês:

```typescript
// Exemplo: posto com histórico desde jan/2023
pgBoss.send('backfill:fato_venda', { location_id, from: '2023-01-01', to: '2023-01-31' })
pgBoss.send('backfill:fato_venda', { location_id, from: '2023-02-01', to: '2023-02-28' })
// ... até o mês corrente
```

Jobs enfileirados em ordem cronológica. O worker processa 1 por vez (concurrency: 1) — sem competir com syncs incrementais de outros postos.

### 9.3 Comando enviado ao agente

```json
{
  "command": "backfill",
  "job_id": "uuid",
  "entity": "fato_venda",
  "from": "2023-01-01T00:00:00.000Z",
  "to":   "2023-01-31T23:59:59.999Z",
  "batch_size": 200,
  "delay_ms": 200
}
```

- `batch_size: 200` — lotes menores que o sync normal (500) para não pressionar o SQL Server do cliente
- `delay_ms: 200` — delay intencional entre lotes (backpressure)

### 9.4 Query do agente durante backfill

```sql
SELECT ... FROM TMPBI_VENDA_DETALHADA
WHERE DATA_EMISSAO >= :from AND DATA_EMISSAO <= :to
ORDER BY DATA_EMISSAO ASC
```

### 9.5 Progresso e retomada

- Cada janela mensal concluída com sucesso atualiza `app.sync_state.last_synced_at`
- Falha em uma janela → job vai para retry (máx 3x)
- Após esgotar retries → `sync_jobs.status = 'error'`, janela fica pendente para reprocessamento manual
- Na retomada, o worker identifica a última janela concluída e continua a partir dela

### 9.6 Conclusão do backfill

Após processar a última janela (mês corrente):

```sql
UPDATE app.sync_state
SET backfill_completed_at = now()
WHERE location_id = :location_id AND entity = 'fato_venda'
```

A partir deste momento o agendador começa a incluir este posto nas syncs diárias incrementais.

---

## 10. Tratamento de erros

| Cenário | Comportamento |
|---------|--------------|
| Agente perde conexão WebSocket | Reconecta com backoff. Job fica `pending` no pg-boss até agente reconectar |
| Pipeline falha num lote | Job vai para retry (máx 3x). `app.sync_jobs.status = 'error'` após esgotar retries |
| Registro inválido num lote | Registro rejeitado, restante do lote processado. Contagem de rejeições logada em `sync_jobs` |
| `source_location_id` não encontrado | Lote inteiro rejeitado + alerta — indica problema de configuração no onboarding |
| Watermark não avança (0 registros) | Normal. `sync_jobs.rows_ingested = 0`, status `success` |

---

## 11. Critérios de aceite

- [ ] API e worker rodam como processos separados — crash do worker não afeta a API
- [ ] Agente conecta via WebSocket e mantém conexão estável
- [ ] Agente extrai `TMPBI_VENDA_DETALHADA` com watermark correto e envia em lotes de 500
- [ ] Pipeline persiste em `raw.raw_ingest` antes de qualquer processamento
- [ ] Pipeline transforma e insere corretamente em `canonical.fato_venda`
- [ ] Re-execução do mesmo sync não duplica registros (idempotência)
- [ ] Watermark é atualizado somente após sucesso do pipeline
- [ ] `app.sync_jobs` reflete status correto (pending → running → success/error)
- [ ] dim_produto SCD2: mudança de categoria gera nova versão, versão anterior tem `valid_to` preenchido
- [ ] Sync on-demand dispara imediatamente quando comando chega via WebSocket
- [ ] Falha de 1 registro não bloqueia o restante do lote
- [ ] Backfill processa janelas mensais em série, sem bloquear syncs incrementais de outros postos
- [ ] Falha em janela de backfill → retoma da mesma janela, não do início
- [ ] Sync incremental só é agendado após `backfill_completed_at IS NOT NULL`
- [ ] Lotes de backfill respeitam `batch_size: 200` e `delay_ms: 200`
# Spec — Despesas (ingestão e DRE)

**Versão:** 0.1
**Data:** 2026-06-07
**Status:** Rascunho

---

## 1. Objetivo

Trazer as **despesas** da rede para a plataforma, a partir da view `TMPBI_DOCUMENTOS_BAIXADOS`
do Status ERP (liberada em 2026-05), e alimentar o **DRE** com elas — permitindo evoluir o
relatório de **Margem Bruta** para **Resultado Operacional**.

Responde à pergunta de gestão:

> *No mês passado, quanto a rede gastou de despesa operacional, em quê, e qual foi o resultado depois da margem?*

Esta spec cobre o **Plano 1 — ingestão e exibição informativa**. O cálculo do Resultado
Operacional depende da **classificação contábil por grupo financeiro**, especificada em
`docs/specs/admin-mapping.md` (Plano 2).

---

## 2. Escopo

Cobre (Plano 1):

- Nova entidade de sync `despesa` (agente → raw → canonical).
- Tabela `canonical.fato_despesa`.
- Materialized views `analytics.mv_despesa_mensal` e `analytics.mv_despesa_grupo_mensal`.
- Endpoint de DRE estendido com bloco **informativo** de despesas por grupo financeiro.
- Frontend: painel "Despesas por grupo financeiro (bruto)" na tela de DRE.

Não cobre (vai para o Plano 2 — `admin-mapping.md`):

- Classificação contábil de cada grupo financeiro (`despesa_operacional` / `cmv` / `imposto` /
  `investimento` / `ignorar`).
- Cálculo de `Resultado Operacional = Margem Bruta − Σ(despesa_operacional)`.
- Renomeio/agrupamento custom dos grupos financeiros pelo cliente.

> **Nota:** enquanto o Plano 2 não estiver pronto, o DRE **não subtrai** despesas da margem —
> apenas exibe o bruto por grupo, rotulado como "não classificado". Isso é proposital: a análise
> do dado real (ver `docs/data/inventory/status-inventory.md` → TMPBI_DOCUMENTOS_BAIXADOS) provou
> que somar despesa sem classificar contaria o custo da mercadoria (CMV) em dobro.

---

## 3. Fonte de dados

**View:** `TMPBI_DOCUMENTOS_BAIXADOS` (Status ERP / SQL Server).
**Grão de origem:** 1 linha = 1 baixa de movimento financeiro.
**Watermark de sync:** `DATA_MOV`.
**Inventário completo de campos:** `docs/data/inventory/status-inventory.md`.

### 3.1 Recorte de ingestão

A ingestão traz **todas** as linhas, **exceto**:

1. **Lixo de rateio / template** — excluir o padrão:
   `CD_TIPTIT = 'RB'` **E** `DESCR_MODPAG = 'DESCONTO ADIANT.CLIENTES'`
   (bloco do fornecedor COOPERBONJE; `DESCR_GF` contém nomes de baldes de DRE, não despesas reais).
   > Critério a confirmar com a Status; aplicar no `extract` (filtro SQL) e reforçar no transform.
2. **Estabelecimentos sem location conectada** — só ingerir `CD_ESTAB` que casa com uma
   `app.locations.source_location_id` do tenant. `CD_ESTAB` sem match (ex: `080 - Centro de
   Distribuição`) é registrado em `app.sync_rejections` com motivo `location_nao_encontrada`
   (não é erro — é fora de escopo).

Nenhum outro filtro por grupo financeiro é aplicado no Plano 1 — a separação operacional × CMV ×
imposto × investimento é responsabilidade da classificação (Plano 2).

### 3.2 Mapeamento de campos (origem → canônico)

| Canônico (`fato_despesa`) | Origem | Observação |
|---------------------------|--------|------------|
| `source_location_id` | `CD_ESTAB` | resolve para `location_id` via lookup |
| `data_despesa` | `DATA_MOV` | watermark; `date` |
| `descricao` | `DESCR_LOP` / `TIPO_MOVTO` | descrição livre da baixa |
| `grupo_financeiro_codigo` | `CD_GRPFOPER` | código do grupo financeiro |
| `grupo_financeiro_descricao` | `DESCR_GF` | **chave de classificação** (Plano 2) |
| `centro_custo_codigo` | `CD_CENTRO` | |
| `centro_custo_descricao` | `DESCR_CENTRO` | |
| `operacao` | `OPERACAO` | À VISTA / À PRAZO |
| `tipo_lancamento` | `TIPO_LANCAMENTO` | MANUAL / NOTA |
| `fornecedor_nome` | `NOME` | |
| `fornecedor_doc` | `CGC` | |
| `valor` | `VALOR_MOV` | normalizado para **positivo**; `numeric(15,2)` |
| `source` | — | constante `'status'` |
| `source_id` | `ID_DOCUM`-`SQ_DOCUM`-`SQ_BAIXA_MOV` | chave de idempotência |

### 3.3 Validações (transform)

- `valor > 0` e `data_despesa` não-nula → senão `sync_rejections` (motivo `dado_invalido`).
- `source_location_id` deve resolver para uma location → senão `sync_rejections`
  (motivo `location_nao_encontrada`).
- Upsert idempotente: `ON CONFLICT (tenant_id, location_id, source, source_id) DO NOTHING`.

---

## 4. Modelo de dados

### 4.1 `canonical.fato_despesa`

Grão: **1 linha = 1 baixa de despesa** (espelha o padrão de `canonical.fato_venda`).

```
id                          uuid pk
tenant_id                   uuid not null
location_id                 uuid not null
source_location_id          text not null
data_despesa                date not null            -- DATA_MOV (watermark)
descricao                   text
grupo_financeiro_codigo     text
grupo_financeiro_descricao  text                     -- DESCR_GF
centro_custo_codigo         text
centro_custo_descricao      text
operacao                    text
tipo_lancamento             text
fornecedor_nome             text
fornecedor_doc              text
valor                       numeric(15,2) not null   -- VALOR_MOV (positivo)
source                      text not null            -- 'status'
source_id                   text not null            -- ID_DOCUM-SQ_DOCUM-SQ_BAIXA_MOV
raw_ingest_id               uuid
synced_at                   timestamptz not null default now()

UNIQUE (tenant_id, location_id, source, source_id)
INDEX  (tenant_id, data_despesa)
```

### 4.2 `analytics.mv_despesa_mensal`

Grão: **1 linha = 1 mês × 1 location** (sem segmento — despesas não são segmentadas).

```
tenant_id, location_id, ano, mes, ano_mes, total_despesas (SUM valor)
```

### 4.3 `analytics.mv_despesa_grupo_mensal`

Grão: **1 linha = 1 mês × 1 location × 1 grupo financeiro** (para o breakdown na tela de DRE).

```
tenant_id, location_id, ano, mes, ano_mes,
grupo_financeiro_codigo, grupo_financeiro_descricao,
total_despesas (SUM valor), qtd_lancamentos (COUNT)
```

> Ambas com índice único para suportar `REFRESH MATERIALIZED VIEW CONCURRENTLY`. Incluídas na
> sequência de `apps/api/src/pipeline/refresh-analytics.ts`. A `mv_dre_mensal` **não é alterada**.

---

## 5. Pipeline

```
Status TMPBI_DOCUMENTOS_BAIXADOS
 └─ agente (extract.ts: query + watermark DATA_MOV, filtro de rateio)
     └─ WebSocket batch (entity: 'despesa')
         └─ raw.raw_ingest
             └─ worker pipeline:despesa (transform-despesa.ts)
                 ├─ valida + resolve location + normaliza valor
                 ├─ upsert canonical.fato_despesa
                 ├─ atualiza sync_state.last_synced_at = MAX(data_despesa)
                 └─ enfileira refresh analytics
                     └─ mv_despesa_mensal + mv_despesa_grupo_mensal
```

- Nova entidade `'despesa'` em `AgentEntity` / `AgentCommand` (`packages/shared`).
- `sync_state` semeado com `(location, 'status', 'despesa')` na criação do connector.
- Suporta `sync` (incremental por watermark) e `backfill` (range de datas).

---

## 6. API

### `GET /api/v1/dre/mensal` (estendido)

Adiciona ao response um bloco **informativo** (sem cálculo de resultado):

```jsonc
{
  // ... linhas por segmento (inalterado) ...
  "despesas": {
    "2026-05": {
      "total_bruto": 123456.78,
      "porGrupo": [
        { "grupo_financeiro": "Salários", "valor": 45000.00 },
        { "grupo_financeiro": "Energia Elétrica", "valor": 10974.97 }
        // ...
      ]
    }
  }
}
```

- `resultado_operacional` **não** é retornado no Plano 1.
- Toda query filtra `tenant_id` (regra de multitenancy).

---

## 7. Frontend

`apps/web/src/pages/DrePage.tsx` ganha um painel **"Despesas por grupo financeiro (bruto)"**
abaixo da Margem Bruta:

- Tabela/lista por grupo financeiro com valor mensal.
- Banner/aviso explícito: *"Valores brutos não classificados — incluem compras de mercadoria e
  impostos. O Resultado Operacional será calculado após a classificação (em breve)."*
- **Sem** linha de Resultado Operacional e **sem** KPI de margem operacional ainda
  (entram no Plano 2).

---

## 8. Verificação

- Backfill numa location JAM → conferir `raw.raw_ingest` (entity `despesa`) →
  `canonical.fato_despesa` → `analytics.mv_despesa_mensal`.
- Conferir que o bloco COOPERBONJE (`RB` + `DESCONTO ADIANT.CLIENTES`) **não** foi ingerido.
- Conferir que `CD_ESTAB=080` foi rejeitado (`sync_rejections`, motivo `location_nao_encontrada`).
- `GET /api/v1/dre/mensal` retorna `despesas.porGrupo` coerente; `DrePage` exibe o painel com aviso.
- Toda query de despesa filtra `tenant_id`.

---

## 9. Próximo passo (Plano 2)

`docs/specs/admin-mapping.md` — classificação contábil por grupo financeiro, que habilita o
cálculo de Resultado Operacional e o agrupamento/renomeio custom pelo cliente.

# PostoInsight — Modelo Canônico de Dados

> **Documento normativo.** Define o contrato de dados entre conectores e o pipeline.
> O pipeline, a API e o frontend operam exclusivamente sobre este modelo.
> Todo conhecimento de ERP fica isolado no conector. A aplicação nunca conhece o schema de nenhum ERP.
>
> Status: ✅ completo para MVP
> Última atualização: 2026-04-22

---

## Princípios

1. **O modelo define o contrato.** Se um campo não está disponível em determinado conector hoje, ele fica NULL — mas o campo existe e será preenchido quando o endpoint correspondente for implementado.
2. **Conectores são burros.** Extraem e enviam. Toda transformação, join, enriquecimento e cálculo é responsabilidade do pipeline.
3. **source_id garante idempotência.** O pipeline usa `(tenant_id, location_id, source, source_id)` para detectar duplicatas. Cada conector define a composição do source_id da sua entidade.
4. **Nenhum campo é inventado.** Tudo mapeado para um campo real da fonte. Se o campo não existe ainda na fonte mapeada, está marcado como ⚠️ pendente com o caminho para obtê-lo.

---

## Índice

- [fato_venda](#fato_venda)
- [dim_produto](#dim_produto)
- [dim_tempo](#dim_tempo)

---

## fato_venda

**Grão:** 1 linha = 1 produto em 1 venda (item de nota fiscal ou abastecimento).

### Schema canônico

| Campo | Tipo PostgreSQL | Obrig | Descrição |
|-------|----------------|-------|-----------|
| `id` | uuid | ✅ gerado | Surrogate key gerado pelo pipeline |
| `tenant_id` | uuid | ✅ | Tenant do cliente |
| `location_id` | uuid | ✅ | FK para `app.locations` — resolvido pelo pipeline via `source_location_id` |
| `source_location_id` | text | ✅ | ID da location na fonte original (`CD_ESTAB` no Status) |
| `data_venda` | date | ✅ | Data da venda (sem hora) |
| `hora_venda` | time | nullable | Hora da venda |
| `turno` | text | nullable | Código ou número do turno |
| `nr_nota` | text | nullable | Número da nota/cupom fiscal na fonte |
| `source_produto_id` | text | ✅ | ID do produto na fonte original |
| `descricao_produto` | text | ✅ | Nome do produto |
| `categoria_codigo` | text | ✅ | Código da categoria — nível 1 da hierarquia |
| `categoria_descricao` | text | nullable | Descrição da categoria |
| `grupo_id` | integer | ✅ | Código do grupo — nível 2 da hierarquia |
| `grupo_descricao` | text | nullable | Descrição do grupo |
| `subgrupo_id` | integer | nullable | Código do subgrupo — nível 3 da hierarquia |
| `subgrupo_descricao` | text | nullable | Descrição do subgrupo |
| `is_combustivel` | boolean | ✅ | Derivado pelo pipeline via classificação do produto |
| `qtd_venda` | numeric(15,4) | ✅ | Quantidade vendida |
| `vlr_unitario` | numeric(15,4) | ✅ | Preço unitário de venda |
| `vlr_total` | numeric(15,4) | ✅ | Valor total do item |
| `custo_unitario` | numeric(15,4) | nullable | Custo unitário do produto |
| `desconto_total` | numeric(15,4) | nullable | Desconto aplicado no item |
| `acrescimo_total` | numeric(15,4) | nullable | Acréscimo aplicado no item |
| `bico_codigo` | integer | nullable | Número do bocal usado no abastecimento |
| `bico_descricao` | text | nullable | Descrição do bico ex: "06 - GASOLINA COMUM" |
| `tanque_codigo` | text | nullable | Código do tanque ex: "03" |
| `tanque_descricao` | text | nullable | Descrição do tanque ex: "03 - GASOLINA COMUM" |
| `source_cliente_id` | text | nullable | ID do cliente na fonte. NULL se venda a consumidor genérico |
| `source_funcionario_id` | text | nullable | ID do frentista ou vendedor na fonte |
| `forma_pagamento_tipo` | text | nullable | Classificação canônica do meio de pagamento — fora do escopo MVP |
| `source` | text | ✅ | Identificador do conector: `"status"` ou `"webposto"` |
| `source_id` | text | ✅ | ID único do item na fonte — garante idempotência |
| `synced_at` | timestamptz | ✅ gerado | Timestamp da ingestão no pipeline |

---

### Mapeamento — Status ERP

**Fonte:** `TMPBI_VENDA_DETALHADA`

**Watermark:** `DATA_EMISSAO >= :watermark`

| Campo canônico | Campo Status | Transformação / Observação |
|----------------|-------------|---------------------------|
| `source_location_id` | `CD_ESTAB` | varchar(3) |
| `data_venda` | `DATA_EMISSAO` | datetime → extrair parte date |
| `hora_venda` | `HORA_COMPLETA_EMISSAO` | varchar(8) ex: "06:10:10" → cast time |
| `turno` | `TURNO` | varchar(1) ex: "1", "2", "3" |
| `nr_nota` | `NR_NOTA` | int → cast text |
| `source_produto_id` | `CODIGO_ITEM` | varchar(15) |
| `descricao_produto` | `DESCRICAO_ITEM` | varchar(120) |
| `categoria_codigo` | `CODIGO_CATEGORIA_ITEM` | varchar(3) ex: "CB", "TAB", "BEB" |
| `categoria_descricao` | `DESCRICAO_CATEGORIA_ITEM` | varchar(20) |
| `grupo_id` | `CODIGO_GRUPO_ITEM` | smallint |
| `grupo_descricao` | `DESCRICAO_GRUPO_ITEM` | varchar(30) |
| `subgrupo_id` | `CODIGO_SUBGRUPO_ITEM` | smallint — nullable |
| `subgrupo_descricao` | `DESCRICAO_SUBGRUPO_ITEM` | varchar(30) — nullable |
| `is_combustivel` | `CODIGO_CATEGORIA_ITEM` | pipeline: `= 'CB'` → true, demais → false |
| `qtd_venda` | `QTD_VENDA` | money |
| `vlr_unitario` | `VLR_UNIT` | money |
| `vlr_total` | `TOT_VLRITEM` | money |
| `custo_unitario` | `CUSTO_UNIT` | money — já embutido na view |
| `desconto_total` | `TOT_DESCONTO_UNIT` | money |
| `acrescimo_total` | `TOT_ACRESCIMO_UNIT` | money |
| `bico_codigo` | `BICO` | int: `0` → NULL, `> 0` → valor (número do bocal) |
| `bico_descricao` | `BICO_COMBUSTIVEL` | varchar ex: "06 - GASOLINA COMUM" — NULL quando BICO = 0 |
| `tanque_codigo` | `TANQUE` | extrair código numérico: "03 - GASOLINA COMUM" → "03" |
| `tanque_descricao` | `TANQUE` | string completa ex: "03 - GASOLINA COMUM" |
| `source_cliente_id` | `CODIGO_CLIENTE` | int → text. Pipeline: se = 1 ("VENDA A VISTA") → NULL |
| `source_funcionario_id` | `CODIGO_VENDEDOR` | int → text. Se = 0 → NULL |
| `forma_pagamento_tipo` | — | NULL — fora do escopo MVP |
| `source` | — | literal `"status"` |
| `source_id` | `FormasRecebimento` / composição | Ver nota abaixo |

**Nota — source_id Status:**
- Se `FormasRecebimento > 0` (combustível): usar `FormasRecebimento::text` — é o ID único do abastecimento
- Se `FormasRecebimento = 0` (loja): usar `NR_VENDA_INTERNO::text || '-' || CODIGO_ITEM` — combinação estável por item de loja
- Limitação conhecida: se o mesmo produto aparecer duas vezes na mesma venda de loja, haverá colisão de source_id e o pipeline manterá apenas 1 registro. Risco baixo para MVP.

---

### Mapeamento — WebPosto ERP

**Fonte atual (MVP):** `GET /INTEGRACAO/VENDA_ITEM`

**Watermark:** parâmetro `dataMovimento` na query string

| Campo canônico | Campo WebPosto | Status hoje | Transformação / Observação |
|----------------|---------------|------------|---------------------------|
| `source_location_id` | `empresaCodigo` | ✅ | integer → text |
| `data_venda` | `dataMovimento` | ✅ | string($date) → date |
| `hora_venda` | `dataHoraMovimento` | ✅ | string($date-time) → extrair parte time |
| `turno` | — | ⚠️ pendente | Não em VENDA_ITEM. Fonte: `GET /INTEGRACAO/VENDA` campo `turno`, join por `vendaCodigo` |
| `nr_nota` | `vendaCodigo` | ✅ | integer → text |
| `source_produto_id` | `produtoCodigo` | ✅ | integer → text |
| `descricao_produto` | — | ⚠️ pipeline | Enrich via `dim_produto.nome` |
| `categoria_codigo` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `categoria_descricao` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `grupo_id` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `grupo_descricao` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `subgrupo_id` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `subgrupo_descricao` | — | ⚠️ pipeline | Enrich via `dim_produto` |
| `is_combustivel` | — | ⚠️ pipeline | Enrich via `dim_produto.combustivel` |
| `qtd_venda` | `quantidade` | ✅ | number($double) |
| `vlr_unitario` | `valorUnitario` | ✅ | number($double) |
| `vlr_total` | `valorTotal` | ✅ | number($double) |
| `custo_unitario` | — | ⚠️ pipeline | Enrich via `GET /INTEGRACAO/PRODUTO_EMPRESA` campo `precoCusto` |
| `desconto_total` | `desconto` | ✅ | number($double) |
| `acrescimo_total` | `acrescimo` | ✅ | number($double) |
| `bico_codigo` | — | ⚠️ pendente | Não em VENDA_ITEM. Fonte: `GET /INTEGRACAO/ABASTECIMENTO` campo `codigoBico`, match por `vendaItemCodigo` |
| `bico_descricao` | — | ⚠️ pendente | Derivado via lookup quando bico_codigo for implementado |
| `tanque_codigo` | — | ⚠️ pendente | Não identificado na API WebPosto — verificar documentação |
| `tanque_descricao` | — | ⚠️ pendente | Idem |
| `source_cliente_id` | `clienteCodigo` | ✅ | integer → text |
| `source_funcionario_id` | `funcionarioCodigo` | ✅ | integer → text |
| `forma_pagamento_tipo` | — | — | NULL — fora do escopo MVP |
| `source` | — | ✅ | literal `"webposto"` |
| `source_id` | `vendaItemCodigo` | ✅ | integer → text — PK natural do item na fonte |

---

### Regras de validação — fato_venda

| Regra | Consequência |
|-------|-------------|
| `source_location_id` não resolve para location no tenant | Registro rejeitado com alerta |
| `data_venda` nula ou fora do range válido (> hoje + 1 dia) | Registro rejeitado |
| `vlr_total < 0` | Registro rejeitado — devoluções não suportadas no MVP |
| `qtd_venda <= 0` | Registro rejeitado |
| `vlr_unitario` ou `vlr_total` nulos | Registro rejeitado |
| `source_produto_id` ausente | Registro rejeitado |
| Duplicata `(tenant_id, location_id, source, source_id)` | Ignorado silenciosamente — idempotência |

---

## dim_produto

**Grão:** 1 linha = 1 versão de 1 produto em 1 location (SCD2). Mudanças no cadastro criam nova versão — vendas históricas sempre referenciam a versão correta do produto.

**Chave natural:** `(tenant_id, source, source_location_id, source_produto_id)`

**Importante:** produtos são por location — cada unidade pode ter catálogos diferentes. O campo `source_location_id` está no `dim_produto` para refletir isso.

**Sync:** full sync ocasional (cadastro de produto muda raramente). Não incremental.

---

### Schema canônico

| Campo | Tipo PostgreSQL | Obrig | Descrição |
|-------|----------------|-------|-----------|
| `id` | uuid | ✅ gerado | Surrogate key |
| `tenant_id` | uuid | ✅ | Tenant |
| `source` | text | ✅ | `"status"` ou `"webposto"` |
| `source_location_id` | text | ✅ | ID da location na fonte — produtos são por unidade |
| `source_produto_id` | text | ✅ | ID do produto na fonte |
| `nome` | text | ✅ | Nome completo do produto |
| `nome_resumido` | text | nullable | Nome resumido para exibição |
| `categoria_codigo` | text | ✅ | Código da categoria — nível 1 |
| `categoria_descricao` | text | nullable | Descrição da categoria |
| `grupo_id` | integer | ✅ | Código do grupo — nível 2 |
| `grupo_descricao` | text | nullable | Descrição do grupo |
| `subgrupo_id` | integer | nullable | Código do subgrupo — nível 3 |
| `subgrupo_descricao` | text | nullable | Descrição do subgrupo |
| `tipo_produto` | text | nullable | Código interno de tipo na fonte |
| `unidade_venda` | text | nullable | Unidade de venda ex: "UN", "LT" |
| `is_combustivel` | boolean | ✅ | Derivado pelo pipeline via categoria |
| `ativo` | boolean | ✅ | Se o produto está ativo |
| `valid_from` | date | ✅ | Início de vigência desta versão |
| `valid_to` | date | nullable | Fim de vigência. NULL = versão atual |
| `is_current` | boolean | ✅ | true se versão atual |
| `synced_at` | timestamptz | ✅ gerado | Timestamp da ingestão |

---

### Mapeamento — Status ERP

**Fontes:**
- `TITEM` — cadastro de produtos (fonte principal)
- `TGRPI` — nomes dos grupos (join por `Cd_GrpItem`)
- `TSGrI` — nomes dos subgrupos (join por `Cd_SGrItem`)
- `TCATI` — nomes das categorias (join por `Cd_CatItem`)

| Campo canônico | Campo Status | Transformação / Observação |
|----------------|-------------|---------------------------|
| `source_produto_id` | `Cd_Item` | varchar(15) — posição 14 no CSV |
| `nome` | `Descricao` | varchar(120) |
| `nome_resumido` | `DescrRes` | varchar(30) |
| `categoria_codigo` | `Cd_CatItem` | varchar(3) ex: "CB", "TAB", "BEB", "INA" |
| `categoria_descricao` | `TCATI.Descricao` | pipeline: join TCATI em `Cd_CatItem` |
| `grupo_id` | `Cd_GrpItem` | smallint |
| `grupo_descricao` | `TGRPI.Descricao` | pipeline: join TGRPI em `Cd_GrpItem` |
| `subgrupo_id` | `Cd_SGrItem` | smallint — nullable (0 = sem subgrupo → NULL) |
| `subgrupo_descricao` | `TSGrI.Descricao` | pipeline: join TSGrI em `Cd_SGrItem` |
| `tipo_produto` | `Cd_TipItem` | smallint → cast text |
| `unidade_venda` | `Unidade` | varchar(3) |
| `is_combustivel` | `Cd_CatItem` | pipeline: `= 'CB'` → true |
| `ativo` | derivado | pipeline: `Cd_CatItem != 'INA' AND Descricao NOT LIKE '%INATIVO%'` → true |
| `valid_from` | `DtCadastro` | datetime → date. Se nulo: usar data do sync |
| `valid_to` | — | NULL na carga inicial. Pipeline atualiza quando detecta mudança |
| `is_current` | — | true na carga inicial |

---

### Mapeamento — WebPosto ERP

**Fontes:**
- `GET /INTEGRACAO/PRODUTO` — cadastro de produtos (fonte principal)
- `GET /INTEGRACAO/GRUPO` — nomes dos grupos / categorias nível 1
- `GET /INTEGRACAO/CONSULTAR_SUB_GRUPO_REDE` — hierarquia subgrupo1 e subgrupo2

**Nota de hierarquia:** no WebPosto, `grupoCodigo` equivale ao nível 1 (categoria), `subGrupo1Codigo` ao nível 2 (grupo) e `subGrupo2Codigo` ao nível 3 (subgrupo) do modelo canônico.

| Campo canônico | Campo WebPosto | Status hoje | Transformação / Observação |
|----------------|---------------|------------|---------------------------|
| `source_produto_id` | `produtoCodigo` | ✅ | integer → text |
| `nome` | `nome` | ✅ | string |
| `nome_resumido` | — | ⚠️ pendente | WebPosto não expõe nome resumido — verificar |
| `categoria_codigo` | `grupoCodigo` | ✅ | integer → text — nível 1 |
| `categoria_descricao` | — | ⚠️ pipeline | Enrich via `GET /INTEGRACAO/GRUPO` campo `nome` |
| `grupo_id` | `subGrupo1Codigo` | ✅ | integer — nível 2 |
| `grupo_descricao` | — | ⚠️ pipeline | Enrich via `GET /INTEGRACAO/CONSULTAR_SUB_GRUPO_REDE` (ProdutoSubGrupo1.descricao) |
| `subgrupo_id` | `subGrupo2Codigo` | ✅ | integer — nível 3. nullable |
| `subgrupo_descricao` | — | ⚠️ pipeline | Enrich via `CONSULTAR_SUB_GRUPO_REDE` (ProdutoSubGrupo2.descricao) |
| `tipo_produto` | `tipoProduto` | ✅ | string: C/P/U/I/O/S/K/8 |
| `unidade_venda` | `unidadeVenda` | ✅ | string |
| `is_combustivel` | `combustivel` | ✅ | boolean — campo explícito na fonte |
| `ativo` | — | ⚠️ pipeline | Endpoint retorna só produtos ativos por default. Verificar se há flag `ativo` |
| `valid_from` | — | ⚠️ pipeline | Usar data do sync |
| `valid_to` | — | ⚠️ pipeline | NULL na carga inicial |
| `is_current` | — | ✅ pipeline | true na carga inicial |

---

## dim_tempo

**Grão:** 1 linha = 1 dia do calendário.

**Geração:** estática, produzida pelo pipeline. Nenhuma fonte ERP envolvida. Gerada uma vez (ex: 2015–2035) e raramente atualizada.

**Uso:** join em todas as tabelas fato por `data_venda = dim_tempo.data` — habilita filtros por semana, mês, trimestre, ano e dia da semana nas queries analíticas sem cálculo em tempo de execução.

---

### Schema canônico

| Campo | Tipo PostgreSQL | Descrição |
|-------|----------------|-----------|
| `data` | date | PK — a data em si |
| `ano` | integer | Ex: 2026 |
| `trimestre` | integer | 1–4 |
| `mes` | integer | 1–12 |
| `mes_nome` | text | Ex: "Janeiro" |
| `semana_ano` | integer | Semana ISO do ano (1–53) |
| `dia_mes` | integer | 1–31 |
| `dia_semana` | integer | 1=Segunda … 7=Domingo (ISO) |
| `dia_semana_nome` | text | Ex: "Segunda-feira" |
| `is_fim_de_semana` | boolean | Sábado ou Domingo |
| `is_feriado_nacional` | boolean | Feriados nacionais brasileiros |
| `ano_mes` | text | Ex: "2026-03" — útil para agrupamentos mensais |
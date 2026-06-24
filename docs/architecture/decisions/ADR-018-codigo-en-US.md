# ADR-018 — Idioma de Código en-US no Backend e Contrato de Dados

**Data:** 2026-06-23
**Status:** Aceito
**Contexto:** Padronização do backend para inglês (camada que controlamos)

---

## Contexto

O `CLAUDE.md §3` já estabelece "Código: inglês / Documentação: português", mas a regra
nunca foi formalizada em ADR e não foi aplicada de forma consistente. A camada analítica
que **nós controlamos** (`canonical.*`, `analytics.mv_*`, respostas JSON da API, pipeline de
transform, `packages/shared`) cresceu com identificadores em português (`fato_venda`,
`qtd_venda`, `receita_bruta`, `margem_pct`...), refletindo a origem dos ERPs brasileiros.

A infraestrutura do schema `app` já está correta em inglês (`tenants`, `locations`, `users`,
`sync_state`, `connectors`) — herança da ADR-008. O problema está restrito à camada analítica.

Inglês (en-US) é o padrão universal de código de aplicação. Misturar idiomas no backend cria
fricção de manutenção, onboarding e integração. A UI continua multilíngue (português para o
usuário final) — isso é camada de apresentação, não de código.

---

## Decisão

Todo **código** e todo **contrato de dados que nós controlamos** usa en-US:

- Tabelas e colunas dos schemas `canonical` e `analytics`
- Materialized views (`analytics.mv_*`) e suas colunas
- Interfaces/tipos/funções/variáveis em `apps/api`, `packages/shared`, `apps/agent`
- Chaves dos JSON de resposta da API e paths de URL

### Exceções (não mudam)

1. **Nomes de origem ERP** (já em ADR-008): `CD_ESTAB`, `DATA_EMISSAO`, views `TMPBI_*`,
   colunas do SQL Server / API WebPosto. São da fonte externa.
2. **Valores string persistidos / de protocolo**: `segmento`/`segment` (`'combustivel'`,
   `'conveniencia'`...), accounting types (`'despesa_operacional'`...) e os **valores `entity`
   do wire protocol do agente** (`'fato_venda'`, `'dim_produto'`, `'despesa'` em `AgentEntity`/
   `AgentCommand`). Renomear o **identificador/coluna/tipo** sim, mas o **valor** permanece —
   para evitar data-migration de linhas e não quebrar agentes `.exe` já implantados nos clientes.
3. **Textos visíveis ao usuário** (rótulos de UI, mensagens de erro): permanecem em português.
4. **Termos contábeis/produto consagrados**: rota `/dre` (Demonstração de Resultado) e `/arla`
   permanecem como identificadores de domínio.

---

## Glossário Normativo de Tradução

### Tabelas (schema `canonical`)
| Antes | Depois |
|-------|--------|
| `fato_venda` | `fact_sale` |
| `fato_despesa` | `fact_expense` |
| `dim_produto` | `dim_product` |
| `dim_tempo` | `dim_date` |

### Materialized views (schema `analytics`)
| Antes | Depois |
|-------|--------|
| `mv_vendas_diario` | `mv_sales_daily` |
| `mv_combustivel_diario` | `mv_fuel_daily` |
| `mv_conveniencia_diario` | `mv_convenience_daily` |
| `mv_dre_mensal` | `mv_income_statement_monthly` |
| `mv_despesa_mensal` | `mv_expense_monthly` |
| `mv_despesa_grupo_mensal` | `mv_expense_group_monthly` |

### Tabela (schema `app`)
| Antes | Depois |
|-------|--------|
| `despesa_classificacao` | `expense_classification` |

### Colunas (aplicável a tabelas, MVs e chaves JSON)
| Antes | Depois |
|-------|--------|
| `receita_bruta` | `gross_revenue` |
| `receita_liquida` | `net_revenue` |
| `margem_bruta` | `gross_margin` |
| `margem_pct` | `margin_pct` |
| `qtd_venda` | `quantity` |
| `qtd_total` | `total_quantity` |
| `qtd_itens` | `item_count` |
| `qtd_abastecimentos` | `refuel_count` |
| `qtd_lancamentos` | `entry_count` |
| `vlr_unitario` | `unit_value` |
| `vlr_total` | `total_value` |
| `custo_unitario` | `unit_cost` |
| `cmv` | `cogs` |
| `desconto_total` | `discount_total` |
| `descontos` | `discounts` |
| `acrescimo_total` | `surcharge_total` |
| `volume_litros` | `volume_liters` |
| `preco_medio_litro` | `avg_price_liter` |
| `custo_medio_litro` | `avg_cost_liter` |
| `participacao_pct` | `share_pct` |
| `participacao_volume_pct` | `volume_share_pct` |
| `participacao_receita_pct` | `revenue_share_pct` |
| `data_venda` | `sale_date` |
| `hora_venda` | `sale_time` |
| `turno` | `shift` |
| `nr_nota` | `invoice_number` |
| `descricao_produto` | `product_name` |
| `nome` | `name` |
| `nome_resumido` | `short_name` |
| `categoria_codigo` | `category_code` |
| `categoria_descricao` | `category_name` |
| `grupo_id` | `group_id` |
| `grupo_descricao` | `group_name` |
| `subgrupo_id` | `subgroup_id` |
| `subgrupo_descricao` | `subgroup_name` |
| `tipo_produto` | `product_type` |
| `unidade_venda` | `sale_unit` |
| `segmento` (coluna) | `segment` |
| `is_combustivel` | `is_fuel` |
| `bico_codigo` / `bico_descricao` | `nozzle_code` / `nozzle_name` |
| `tanque_codigo` / `tanque_descricao` | `tank_code` / `tank_name` |
| `forma_pagamento_tipo` | `payment_method_type` |
| `data_despesa` | `expense_date` |
| `descricao` | `description` |
| `fornecedor_nome` / `fornecedor_doc` | `supplier_name` / `supplier_doc` |
| `valor` | `amount` |
| `operacao` | `operation` |
| `tipo_lancamento` | `entry_type` |
| `grupo_financeiro_codigo` / `grupo_financeiro_descricao` | `financial_group_code` / `financial_group_name` |
| `centro_custo_codigo` / `centro_custo_descricao` | `cost_center_code` / `cost_center_name` |
| `total_despesas` | `total_expenses` |
| `ano` / `mes` / `dia` | `year` / `month` / `day` |
| `ano_mes` | `year_month` |
| `trimestre` / `semana_ano` | `quarter` / `week_of_year` |
| `dia_semana` / `nome_dia_semana` | `day_of_week` / `day_of_week_name` |
| `nome_mes` | `month_name` |
| `is_fim_de_semana` | `is_weekend` |
| `is_feriado` | `is_holiday` |

### Paths de URL da API
| Antes | Depois |
|-------|--------|
| `/api/v1/vendas` | `/api/v1/sales` |
| `/api/v1/combustivel` | `/api/v1/fuel` |
| `/api/v1/conveniencia` | `/api/v1/convenience` |
| `/api/v1/lubrificantes` | `/api/v1/lubricants` |
| `/admin/despesa-grupos` | `/admin/expense-groups` |
| `/admin/despesa-classificacao` | `/admin/expense-classification` |
| `/api/v1/dre`, `/api/v1/arla` | mantidos (termos de domínio) |

### Tipos e funções compartilhados
| Antes | Depois |
|-------|--------|
| `Segmento` (tipo) | `Segment` |
| `deriveSegmento()` | `deriveSegment()` |
| `FatoVendaInsert` | `FactSaleInsert` |
| `DimProdutoInsert` | `DimProductInsert` |
| `FatoDespesaInsert` | `FactExpenseInsert` |

> Sufixos de query no parâmetro (`?por_produto=true` → `?by_product=true`,
> `granularidade` → `granularity`) seguem o mesmo princípio.

---

## Consequências

**Positivo:**
- Backend 100% en-US na camada que controlamos — padrão de mercado.
- Onboarding de devs e integrações externas mais simples.
- Contrato de API consistente.

**Negativo:**
- Refactor transversal: schema → migration → pipeline → MV → API → frontend.
- Deploy precisa coordenar API + web (o contrato JSON muda).
- Reprocessar canonical/MVs a partir do `raw` (seguro — `raw` é intocado).

**Estratégia de migração:** rebuild a partir do `raw.raw_ingest` (intacto), recriando
`canonical` + MVs com nomes em inglês. Sem `ALTER RENAME`. Aplicável em banco limpo;
em produção reprocessa a Rede JAM (único tenant com dados).

---

## Alternativas Descartadas

- **Traduzir também os valores enum** (`'combustivel'` → `'fuel'`): exigiria data-migration
  das linhas já gravadas em `expense_classification` e na coluna `segment`. Adiado.
- **Camada de adaptação (português no banco, inglês só na API)**: mantém o problema na raiz
  e adiciona mapeamento permanente. Descartado.
- **Manter como está**: viola CLAUDE.md §3 e o padrão de mercado.

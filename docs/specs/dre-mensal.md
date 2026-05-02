# Spec — DRE Mensal

**Versão:** 1.0
**Data:** 2026-04-06
**Status:** Rascunho

---

## 1. Objetivo

O DRE Mensal (Demonstrativo de Resultado do Exercício) responde à pergunta de gestão financeira:

> *No mês passado, quanto eu faturei, quanto gastei em produto e qual foi minha margem bruta — por segmento e no consolidado?*

É o relatório que o dono apresenta em reunião de diretoria ou envia para o contador.
Foco em **resultado financeiro mensal** — não é operacional nem diário.

---

## 2. Escopo

Cobre:

- Materialized view `analytics.mv_dre_mensal`
- 2 endpoints de API
- Frontend: tabela de DRE com linhas fixas, comparativo entre meses, breakdown por segmento

Não cobre (MVP):

- Despesas operacionais (aluguel, folha, energia) — fora do modelo de dados atual
- EBITDA, EBIT, resultado líquido — dependem de dados fora do ERP de vendas
- DRE por posto individual (disponível via filtro, mas não como layout alternativo)
- Exportação PDF/Excel (pós-MVP)

> **Nota:** O DRE do PostoInsight é um **DRE de Margem Bruta**. Vai até `Margem Bruta = Receita Líquida - CMV`. Despesas operacionais não estão no escopo porque não chegam via ERP de vendas — são registradas em sistemas contábeis externos. Esta limitação é explícita na UI.

---

## 3. Estrutura do DRE

### 3.1 Linhas do DRE

```
RECEITA BRUTA
  (-) Descontos
  (=) RECEITA LÍQUIDA
  (-) CMV  (custo_unitario × qtd_venda)
  (=) MARGEM BRUTA
       Margem Bruta %  (Margem Bruta / Receita Líquida)
```

Cada linha existe para **cada segmento** e para o **consolidado** (soma de todos os segmentos).

### 3.2 Colunas do DRE

O relatório exibe, lado a lado, os meses selecionados (padrão: mês atual + 2 meses anteriores):

```
Linha                  | Abr/2026    | Mar/2026    | Fev/2026    | Var Mar→Abr
-----------------------|-------------|-------------|-------------|------------
RECEITA BRUTA          | R$ 1.085.620| R$ 998.430  | R$ 1.020.100|  +8,7%
  Combustível          | R$   980.300| R$ 901.200  | R$   920.000|  +8,8%
  Lubrificantes        | R$    42.000| R$  38.000  | R$    41.000| +10,5%
  Serviços             | R$    18.000| R$  17.500  | R$    18.500|  +2,9%
  Conveniência         | R$    45.320| R$  41.730  | R$    40.600|  +8,6%
(-) Descontos          | R$     1.230| R$   1.100  | R$     1.200| +11,8%
(=) RECEITA LÍQUIDA    | R$ 1.084.390| R$ 997.330  | R$ 1.018.900|  +8,7%
(-) CMV                | R$   825.620| R$ 760.100  | R$   778.000|  +8,6%
  Combustível          | R$   810.200| R$ 746.000  | R$   763.000|  +8,6%
  Lubrificantes        | R$     8.500| R$   7.800  | R$     8.200|  +9,0%
  Serviços             | R$     2.100| R$   2.050  | R$     2.200|  +2,4%
  Conveniência         | R$     4.820| R$   4.250  | R$     4.600| +13,4%
(=) MARGEM BRUTA       | R$   258.770| R$ 237.230  | R$   240.900|  +9,1%
  Combustível          | R$   170.100| R$ 155.200  | R$   157.000|  +9,6%
  Lubrificantes        | R$    33.500| R$  30.200  | R$    32.800| +10,9%
  Serviços             | R$    15.900| R$  15.450  | R$    16.300|  +2,9%
  Conveniência         | R$    39.270| R$  37.380  | R$    36.100|  +5,1%
Margem Bruta %         |      23,86% |      23,79% |      23,64% |   +0,07pp
```

---

## 4. Modelo de Dados

### 4.1 Grão da MV

**`analytics.mv_dre_mensal`**

Grão: 1 linha = 1 mês × 1 posto × 1 segmento.

```sql
CREATE MATERIALIZED VIEW analytics.mv_dre_mensal AS
SELECT
    fv.tenant_id,
    fv.location_id,
    dt.ano,
    dt.mes,
    dt.ano_mes,                                    -- ex: '2026-04' — chave de período
    fv.segmento,

    COUNT(*)                                        AS qtd_itens,
    SUM(fv.qtd_venda)                               AS qtd_total,
    SUM(fv.vlr_total)                               AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))             AS descontos,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))       AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0)
        * fv.qtd_venda)                             AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0)
              * fv.qtd_venda)                       AS margem_bruta

FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL
GROUP BY
    fv.tenant_id, fv.location_id,
    dt.ano, dt.mes, dt.ano_mes,
    fv.segmento
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_dre_mensal_pk
    ON analytics.mv_dre_mensal(tenant_id, location_id, ano_mes, segmento);

CREATE INDEX idx_mv_dre_mensal_tenant_periodo
    ON analytics.mv_dre_mensal(tenant_id, ano_mes DESC);

CREATE INDEX idx_mv_dre_mensal_posto_periodo
    ON analytics.mv_dre_mensal(tenant_id, location_id, ano_mes DESC);
```

**Refresh:** junto com as demais MVs, após cada sync.

### 4.2 Linha consolidada

O consolidado (soma de todos os segmentos) **não é armazenado na MV** — calculado na API via `SUM` sobre as 4 linhas de segmento. Isso evita manter linha de total sincronizada.

---

## 5. API

Base path: `/api/v1/dre`

---

### 5.1 `GET /api/v1/dre/mensal`

Retorna os dados do DRE para os meses solicitados, organizados por `ano_mes` e `segmento`.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `meses` | string[] | ✅ | Array de períodos no formato `YYYY-MM`. Mínimo 1, máximo 12 |
| `location_id` | uuid[] | — | Omitir = todos os postos |

**Resposta:**

```json
{
  "meses": ["2026-04", "2026-03", "2026-02"],
  "postos": "all",
  "linhas": [
    {
      "segmento": "combustivel",
      "periodos": {
        "2026-04": {
          "receita_bruta": 980300.00,
          "descontos": 800.00,
          "receita_liquida": 979500.00,
          "cmv": 810200.00,
          "margem_bruta": 169300.00,
          "margem_pct": 17.28
        },
        "2026-03": {
          "receita_bruta": 901200.00,
          "descontos": 720.00,
          "receita_liquida": 900480.00,
          "cmv": 746000.00,
          "margem_bruta": 154480.00,
          "margem_pct": 17.16
        }
      }
    },
    {
      "segmento": "lubrificantes",
      "periodos": { "2026-04": { ... }, "2026-03": { ... } }
    },
    {
      "segmento": "servicos",
      "periodos": { "2026-04": { ... }, "2026-03": { ... } }
    },
    {
      "segmento": "conveniencia",
      "periodos": { "2026-04": { ... }, "2026-03": { ... } }
    },
    {
      "segmento": "_total",
      "periodos": {
        "2026-04": {
          "receita_bruta": 1085620.00,
          "descontos": 1230.00,
          "receita_liquida": 1084390.00,
          "cmv": 825620.00,
          "margem_bruta": 258770.00,
          "margem_pct": 23.86
        }
      }
    }
  ]
}
```

> `_total` é calculado pela API — soma dos 4 segmentos. O frontend não soma por conta própria.

**SQL (Drizzle):**

```typescript
db.select({
  segmento:       mv.segmento,
  ano_mes:        mv.ano_mes,
  receita_bruta:  sum(mv.receita_bruta),
  descontos:      sum(mv.descontos),
  receita_liquida: sum(mv.receita_liquida),
  cmv:            sum(mv.cmv),
  margem_bruta:   sum(mv.margem_bruta),
})
.from(analytics.mv_dre_mensal)
.where(and(
  eq(mv.tenant_id, tenantId),
  inArray(mv.ano_mes, meses),
  locationIds ? inArray(mv.location_id, locationIds) : undefined,
))
.groupBy(mv.segmento, mv.ano_mes)
```

---

### 5.2 `GET /api/v1/dre/meses-disponiveis`

Lista os meses com dados disponíveis para o tenant. Usado para popular o seletor de período.

**Query params:** `location_id[]` opcional.

**Resposta:**

```json
{
  "meses": ["2026-04", "2026-03", "2026-02", "2026-01", "2025-12", "2025-11"]
}
```

**SQL:**

```typescript
db.selectDistinct({ ano_mes: mv.ano_mes })
  .from(analytics.mv_dre_mensal)
  .where(eq(mv.tenant_id, tenantId))
  .orderBy(desc(mv.ano_mes))
  .limit(24)  // 2 anos de histórico no seletor
```

---

## 6. Frontend

### 6.1 Página `/dashboard/dre`

Rota Next.js: `app/(dashboard)/dashboard/dre/page.tsx`

**Layout:**

```
┌────────────────────────────────────────────────────────────────────┐
│  [Seletor de meses — multi-select, até 6]  [Filtro de posto(s)]   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  DRE — Resultado por Segmento                                      │
│                                                                    │
│  Linha                  Abr/26       Mar/26       Fev/26   Var▲▼  │
│  ─────────────────────────────────────────────────────────────── │
│  RECEITA BRUTA       1.085.620     998.430    1.020.100   +8,7%   │
│    Combustível         980.300     901.200      920.000   +8,8%   │
│    Lubrificantes        42.000      38.000       41.000  +10,5%   │
│    Serviços             18.000      17.500       18.500   +2,9%   │
│    Conveniência         45.320      41.730       40.600   +8,6%   │
│  (-) Descontos           1.230       1.100        1.200  +11,8%   │
│  (=) RECEITA LÍQUIDA 1.084.390     997.330    1.018.900   +8,7%   │
│  (-) CMV               825.620     760.100      778.000   +8,6%   │
│    Combustível         810.200     746.000      763.000   +8,6%   │
│    Lubrificantes         8.500       7.800        8.200   +9,0%   │
│    Serviços              2.100       2.050        2.200   +2,4%   │
│    Conveniência          4.820       4.250        4.600  +13,4%   │
│  (=) MARGEM BRUTA      258.770     237.230      240.900   +9,1%   │
│    Combustível         170.100     155.200      157.000   +9,6%   │
│    Lubrificantes        33.500      30.200       32.800  +10,9%   │
│    Serviços             15.900      15.450       16.300   +2,9%   │
│    Conveniência         39.270      37.380       36.100   +5,1%   │
│  ─────────────────────────────────────────────────────────────── │
│  Margem Bruta %          23,86%      23,79%      23,64%  +0,07pp  │
│                                                                    │
│  ⚠ Este DRE vai até Margem Bruta. Despesas operacionais           │
│    (aluguel, folha, energia) não estão incluídas.                 │
└────────────────────────────────────────────────────────────────────┘
```

### 6.2 Componentes

| Componente | Props | Fonte |
|-----------|-------|-------|
| `DreMensalTabela` | `linhas[]`, `meses[]` | `/mensal` |
| `MesSelectorMulti` | `mesesDisponiveis[]`, `value`, `onChange` | `/meses-disponiveis` |
| `PostoSelector` | — | layout pai |

### 6.3 Comportamento da tabela

- Linhas de subtotal (RECEITA BRUTA, RECEITA LÍQUIDA, MARGEM BRUTA) em negrito
- Linhas de segmento indentadas sob o subtotal de receita e CMV correspondente
- Coluna de variação sempre mostra a variação entre o **mês mais recente** e o **segundo mais recente** selecionado
- Variação positiva em verde, negativa em vermelho, zero em cinza
- Variação de Margem % em pontos percentuais (pp), não em %
- Meses ordenados do mais recente (esquerda) para o mais antigo (direita)
- Período com mês corrente em andamento: exibir indicador `(parcial)` no header da coluna

### 6.4 Seletor de meses

- Multi-select de até 6 meses
- Padrão ao abrir: mês anterior + 2 meses antes (3 meses total — evita mês corrente incompleto como padrão)
- Opção rápida: "Últimos 3 meses" / "Últimos 6 meses" / "Ano atual"
- Meses sem dados desabilitados no seletor

### 6.5 Regras de exibição

- Valores monetários sem casas decimais no DRE (R$ 258.770, não R$ 258.770,32) — contexto gerencial
- CMV = 0 para um segmento não oculta a linha — exibe zero (pode significar custo não configurado)
- Nota de rodapé fixa: "Este DRE vai até Margem Bruta. Despesas operacionais não estão incluídas."
- Mês corrente: se `data_fim` do período = hoje, exibir "(parcial)" no header — dados ainda em aberto

---

## 7. Critérios de Aceitação

| # | Critério | Como verificar |
|---|----------|---------------|
| 1 | RECEITA BRUTA consolidada bate com `SUM(vlr_total) WHERE segmento IS NOT NULL` em `canonical.fato_venda` para o mês | Query manual vs UI |
| 2 | MARGEM BRUTA = RECEITA LÍQUIDA - CMV para cada segmento e no consolidado | Calcular manualmente |
| 3 | Variação exibe diferença entre os dois meses mais recentes selecionados | Trocar seleção de meses e verificar |
| 4 | Linha `_total` é soma dos 4 segmentos — não vem da MV | Verificar no code review que não há linha `segmento = '_total'` na MV |
| 5 | Mês corrente exibe `(parcial)` no header quando está no período selecionado | Selecionar mês atual |
| 6 | Seletor de meses lista apenas meses com dados (`mv_dre_mensal` não vazia para o tenant) | Verificar com tenant sem dados em determinado mês |
| 7 | Filtro de posto funciona — selecionar 1 posto retorna só dados daquele posto | Comparar com banco |
| 8 | Nenhum endpoint acessa `canonical.fato_venda` diretamente | Code review |
| 9 | Nota de rodapé "vai até Margem Bruta" aparece sempre, sem condição | Inspecionar DOM |

---

## 8. Dependências e Pré-requisitos

| Dependência | Status |
|-------------|--------|
| `analytics.mv_dre_mensal` criada e populada | ❌ pendente |
| Campo `segmento` em `canonical.fato_venda` (schema) | ✅ migration 0003 aplicada |
| Pipeline preenche `segmento` via `deriveSegmento()` | ❌ pendente implementação |
| Pelo menos 2 meses de dados no canonical (para variação) | ❌ pendente backfill |

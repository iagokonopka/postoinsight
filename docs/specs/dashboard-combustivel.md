# Spec — Dashboard de Combustível

**Versão:** 1.0
**Data:** 2026-04-06
**Status:** Rascunho

---

## 1. Objetivo

O Dashboard de Combustível responde à pergunta central do gestor/diretor/dono:

> *Quantos litros vendi hoje, nesta semana e neste mês — de cada produto? Qual a minha margem?*

Foco exclusivo em **visão macro**: volume, receita e margem por produto combustível e por período.
Análise operacional (por bico, por frentista, por turno) está fora do escopo MVP.

---

## 2. Escopo

Cobre:

- Materialized view `analytics.mv_combustivel_diario`
- 3 endpoints de API
- Comportamento do frontend: KPI cards, evolução de volume, breakdown por produto

Não cobre (MVP):

- Análise por bico
- Análise por frentista / vendedor
- Análise por turno
- Comparação com metas de volume

---

## 3. Modelo de Dados

### 3.1 Filtro de escopo

Todas as queries filtram por:

```sql
WHERE fv.segmento = 'combustivel'
```

Os produtos do segmento `combustivel` em Status ERP são identificados pelas categorias `CB` e `ARL`.
O campo `grupo_descricao` identifica o produto específico (ex: `"Gasolina Comum"`, `"Diesel S-10"`, `"Etanol"`, `"Arla 32"`).

### 3.2 Grão da MV

**`analytics.mv_combustivel_diario`**

Grão: 1 linha = 1 dia × 1 posto × 1 produto combustível (grupo).

Mais fino que `mv_vendas_diario` porque inclui `qtd_total` (litros), essencial para este dashboard, já coberto — mas criamos MV dedicada com índice otimizado para evitar full scan da MV geral.

> **Alternativa avaliada:** usar `mv_vendas_diario` com `WHERE segmento = 'combustivel'`.
> Rejeitada porque o índice `idx_mv_vendas_diario_segmento` não cobre bem queries por posto + data + produto quando o volume é alto. MV dedicada mantém queries abaixo de 100ms.

```sql
CREATE MATERIALIZED VIEW analytics.mv_combustivel_diario AS
SELECT
    fv.tenant_id,
    fv.location_id,
    fv.data_venda,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    dt.semana_ano,
    dt.dia_semana,
    dt.is_fim_de_semana,
    fv.categoria_codigo,                               -- CB ou ARL
    fv.grupo_id,
    fv.grupo_descricao,                                -- nome do produto (Gasolina Comum, Diesel S-10, etc.)

    COUNT(*)                                            AS qtd_abastecimentos,
    SUM(fv.qtd_venda)                                   AS volume_litros,
    SUM(fv.vlr_total)                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                 AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))
                                                        AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)  AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)
                                                        AS margem_bruta,

    -- preço médio de venda e custo médio (úteis para exibição no card de produto)
    CASE WHEN SUM(fv.qtd_venda) > 0
        THEN SUM(fv.vlr_total) / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                 AS preco_medio_litro,
    CASE WHEN SUM(fv.qtd_venda) > 0 AND SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda) > 0
        THEN SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda) / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                 AS custo_medio_litro

FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento = 'combustivel'
GROUP BY
    fv.tenant_id, fv.location_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.categoria_codigo, fv.grupo_id, fv.grupo_descricao
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_combustivel_diario_pk
    ON analytics.mv_combustivel_diario(tenant_id, location_id, data_venda, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_combustivel_diario_tenant_data
    ON analytics.mv_combustivel_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_combustivel_diario_posto_data
    ON analytics.mv_combustivel_diario(tenant_id, location_id, data_venda DESC);
```

**Refresh:** junto com `mv_vendas_diario`, após cada sync bem-sucedida.

---

## 4. API

Base path: `/api/v1/combustivel`

Mesmas regras de autenticação e filtragem de `tenant_id` da sessão que os demais endpoints.

---

### 4.1 `GET /api/v1/combustivel/resumo`

KPIs do período: totais de volume, receita e margem — consolidado e por produto.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | |
| `data_fim` | date | ✅ | |
| `location_id` | uuid[] | — | Omitir = todos os postos |

**Resposta:**

```json
{
  "periodo": { "inicio": "2026-04-01", "fim": "2026-04-06" },
  "totais": {
    "volume_litros": 185420.50,
    "receita_bruta": 980300.00,
    "receita_liquida": 979500.00,
    "cmv": 810200.00,
    "margem_bruta": 169300.00,
    "margem_pct": 17.28
  },
  "por_produto": [
    {
      "grupo_id": 1,
      "grupo_descricao": "Gasolina Comum",
      "volume_litros": 72000.00,
      "receita_bruta": 432000.00,
      "cmv": 362880.00,
      "margem_bruta": 69120.00,
      "margem_pct": 16.00,
      "preco_medio_litro": 6.00,
      "custo_medio_litro": 5.04,
      "participacao_volume_pct": 38.8,
      "participacao_receita_pct": 44.1
    },
    {
      "grupo_id": 2,
      "grupo_descricao": "Diesel S-10",
      "volume_litros": 85000.00,
      "receita_bruta": 425000.00,
      "cmv": 357000.00,
      "margem_bruta": 68000.00,
      "margem_pct": 16.00,
      "preco_medio_litro": 5.00,
      "custo_medio_litro": 4.20,
      "participacao_volume_pct": 45.8,
      "participacao_receita_pct": 43.4
    }
  ]
}
```

---

### 4.2 `GET /api/v1/combustivel/evolucao`

Evolução temporal de volume e receita — série para o gráfico.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | |
| `data_fim` | date | ✅ | |
| `granularidade` | enum | — | `dia` (default) \| `semana` \| `mes` |
| `location_id` | uuid[] | — | |
| `grupo_id` | integer[] | — | Filtrar por produto(s) específico(s). Omitir = todos |

**Resposta:**

```json
{
  "granularidade": "dia",
  "serie": [
    {
      "periodo": "2026-04-01",
      "volume_litros": 28500.00,
      "receita_bruta": 152000.00,
      "margem_bruta": 26000.00
    },
    {
      "periodo": "2026-04-02",
      "volume_litros": 31200.00,
      "receita_bruta": 166000.00,
      "margem_bruta": 28500.00
    }
  ]
}
```

---

### 4.3 `GET /api/v1/combustivel/produtos`

Lista os produtos combustível do tenant com totais do período. Usado no seletor de filtro e na tabela de breakdown.

**Query params:** igual ao `/resumo`.

**Resposta:** array de `por_produto` do `/resumo` — sem os `totais`.

---

## 5. Frontend

### 5.1 Página `/dashboard/combustivel`

Rota Next.js: `app/(dashboard)/dashboard/combustivel/page.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  [Filtro de período]  [Filtro de posto(s)]              │
├────────────┬────────────┬────────────┬──────────────────┤
│  Volume    │  Receita   │  CMV       │  Margem %        │
│  litros    │  Bruta     │            │                  │
├────────────┴────────────┴────────────┴──────────────────┤
│         Gráfico de evolução — Volume (litros) por dia   │
│         Linha por produto (Gasolina / Diesel / Etanol…) │
├─────────────────────────────────────────────────────────┤
│  Breakdown por produto                                  │
│                                                         │
│  Produto          Litros    Receita    Mg%   R$/L  Cst/L│
│  ─────────────────────────────────────────────────────  │
│  Gasolina Comum   72.000  R$432.000  16,0%  6,00  5,04  │
│  Diesel S-10      85.000  R$425.000  16,0%  5,00  4,20  │
│  Etanol           18.000  R$ 86.400  20,0%  4,80  3,84  │
│  Arla 32          10.420  R$ 36.900  14,0%  3,54  3,04  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Componentes

| Componente | Props | Fonte |
|-----------|-------|-------|
| `KpiCard` | `label`, `value`, `format` | `/resumo` → `totais` |
| `EvolucaoVolumeChart` | `serie`, `granularidade`, `produtos[]` | `/evolucao` |
| `ProdutosCombustivelTable` | `produtos[]` | `/resumo` → `por_produto` |
| `PeriodoSelector` | — | estado local / searchParams |
| `PostoSelector` | — | layout pai |

### 5.3 Gráfico de evolução

- Tipo: linha com área
- Eixo Y primário: volume em litros
- Uma linha por produto — cada produto com cor fixa (definida por `grupo_id`, consistente entre sessões)
- Opção de alternar para exibir Receita Bruta no lugar de volume (toggle no header do gráfico)

### 5.4 Tabela de produtos

- Ordenação padrão: volume_litros DESC
- Colunas: Produto / Volume (L) / Participação % / Receita / Margem % / Preço Médio / Custo Médio
- Custo Médio exibido apenas se `custo_medio_litro IS NOT NULL` para ao menos 1 produto (alguns tenants podem não ter custo configurado)
- Linha de totais no rodapé da tabela

### 5.5 Regras de exibição

- Arla 32 aparece na tabela de produtos mas **não** no gráfico de evolução por padrão (volume muito menor distorce escala) — toggle para incluí-la
- Produtos sem venda no período aparecem com zeros — não são omitidos da tabela
- Volume exibido com separador de milhar e 0 casas decimais para litros inteiros; 3 casas decimais para Arla (vendido por litro fracionado)
- Preço e custo médio: `R$ X,XX / L`

---

## 6. Critérios de Aceitação

| # | Critério | Como verificar |
|---|----------|---------------|
| 1 | KPI de volume total bate com `SUM(qtd_venda) WHERE segmento = 'combustivel'` em `canonical.fato_venda` | Query manual vs UI |
| 2 | Arla 32 aparece como produto separado, classificado como `combustivel` | Inserir registro com `categoria_codigo = 'ARL'` e verificar |
| 3 | Produtos de outros segmentos não aparecem no dashboard | Verificar `WHERE segmento = 'combustivel'` na MV |
| 4 | Preço médio e custo médio calculados corretamente: `SUM(vlr_total) / SUM(qtd_venda)` | Calcular manualmente para 1 produto em 1 dia |
| 5 | Evolução por produto exibe linha para cada `grupo_id` com venda no período | Verificar número de séries no gráfico |
| 6 | Filtro de posto funciona isoladamente | Selecionar 1 posto e comparar com soma no banco |
| 7 | Nenhum endpoint acessa `canonical.fato_venda` diretamente | Code review |
| 8 | Custo Médio não exibido quando todos os registros têm `custo_unitario = NULL` | Simular tenant sem custo configurado |

---

## 7. Dependências e Pré-requisitos

| Dependência | Status |
|-------------|--------|
| `analytics.mv_combustivel_diario` criada e populada | ❌ pendente |
| Campo `segmento` em `canonical.fato_venda` (schema) | ✅ migration 0003 aplicada |
| Pipeline preenche `segmento` via `deriveSegmento()` | ❌ pendente implementação |
| Pelo menos 1 posto com dados de combustível no canonical | ❌ pendente backfill |

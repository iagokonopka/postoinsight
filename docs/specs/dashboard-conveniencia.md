# Spec — Dashboard de Conveniência

**Versão:** 1.0
**Data:** 2026-04-06
**Status:** Rascunho

---

## 1. Objetivo

O Dashboard de Conveniência responde à pergunta do gestor sobre a loja:

> *Quanto vendi na loja hoje, nesta semana e neste mês? Quais categorias e produtos puxam mais receita? Qual minha margem?*

Engloba os segmentos **conveniencia**, **lubrificantes** e **servicos** — todos os produtos e serviços vendidos fora da pista de combustível.

---

## 2. Escopo

Cobre:

- Materialized view `analytics.mv_conveniencia_diario`
- 4 endpoints de API
- Frontend: KPI cards, evolução de receita, breakdown por segmento e por categoria/grupo

Não cobre (MVP):

- Gestão de estoque
- Curva ABC de produtos individuais (pós-MVP)
- Análise por operador / caixa
- Ticket médio por cliente

---

## 3. Modelo de Dados

### 3.1 Filtro de escopo

O dashboard cobre os 3 segmentos que não são combustível:

```sql
WHERE fv.segmento IN ('conveniencia', 'lubrificantes', 'servicos')
```

> **Por que agrupar os 3 segmentos em um dashboard?**
> O gestor chama tudo de "loja" — lubrificantes e serviços são vendidos no balcão ou na pista mas tratados como receita de loja. A separação por segmento existe dentro do dashboard (breakdown), não como dashboards distintos.

### 3.2 Grão da MV

**`analytics.mv_conveniencia_diario`**

Grão: 1 linha = 1 dia × 1 posto × 1 segmento × 1 grupo de produto.

```sql
CREATE MATERIALIZED VIEW analytics.mv_conveniencia_diario AS
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
    fv.segmento,
    fv.categoria_codigo,
    fv.categoria_descricao,
    fv.grupo_id,
    fv.grupo_descricao,

    COUNT(*)                                                            AS qtd_itens,
    SUM(fv.qtd_venda)                                                   AS qtd_total,
    SUM(fv.vlr_total)                                                   AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                                 AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))            AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)                 AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)           AS margem_bruta

FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IN ('conveniencia', 'lubrificantes', 'servicos')
GROUP BY
    fv.tenant_id, fv.location_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.segmento, fv.categoria_codigo, fv.categoria_descricao,
    fv.grupo_id, fv.grupo_descricao
WITH NO DATA;

CREATE UNIQUE INDEX idx_mv_conveniencia_diario_pk
    ON analytics.mv_conveniencia_diario(tenant_id, location_id, data_venda, segmento, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_conveniencia_diario_tenant_data
    ON analytics.mv_conveniencia_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_conveniencia_diario_posto_data
    ON analytics.mv_conveniencia_diario(tenant_id, location_id, data_venda DESC);

CREATE INDEX idx_mv_conveniencia_diario_segmento
    ON analytics.mv_conveniencia_diario(tenant_id, segmento, data_venda DESC);
```

**Refresh:** junto com as demais MVs, após cada sync bem-sucedida.

---

## 4. API

Base path: `/api/v1/conveniencia`

Mesmas regras de autenticação e filtragem por `tenant_id` da sessão.

---

### 4.1 `GET /api/v1/conveniencia/resumo`

KPIs do período: totais de receita e margem — consolidado e por segmento.

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
    "receita_bruta": 105320.50,
    "descontos": 730.00,
    "receita_liquida": 104590.50,
    "cmv": 15420.00,
    "margem_bruta": 89170.50,
    "margem_pct": 85.26
  },
  "por_segmento": [
    {
      "segmento": "conveniencia",
      "receita_bruta": 45320.50,
      "receita_liquida": 44590.50,
      "cmv": 4820.00,
      "margem_bruta": 39770.50,
      "margem_pct": 89.19,
      "participacao_pct": 43.0
    },
    {
      "segmento": "lubrificantes",
      "receita_bruta": 42000.00,
      "receita_liquida": 42000.00,
      "cmv": 8500.00,
      "margem_bruta": 33500.00,
      "margem_pct": 79.76,
      "participacao_pct": 39.9
    },
    {
      "segmento": "servicos",
      "receita_bruta": 18000.00,
      "receita_liquida": 18000.00,
      "cmv": 2100.00,
      "margem_bruta": 15900.00,
      "margem_pct": 88.33,
      "participacao_pct": 17.1
    }
  ]
}
```

---

### 4.2 `GET /api/v1/conveniencia/evolucao`

Evolução temporal da receita de loja — série para o gráfico.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | |
| `data_fim` | date | ✅ | |
| `granularidade` | enum | — | `dia` (default) \| `semana` \| `mes` |
| `location_id` | uuid[] | — | |
| `segmento` | enum | — | `conveniencia` \| `lubrificantes` \| `servicos`. Omitir = total |

**Resposta:**

```json
{
  "granularidade": "dia",
  "serie": [
    { "periodo": "2026-04-01", "receita_bruta": 16200.00, "margem_bruta": 13800.00 },
    { "periodo": "2026-04-02", "receita_bruta": 17500.00, "margem_bruta": 14900.00 }
  ]
}
```

---

### 4.3 `GET /api/v1/conveniencia/categorias`

Breakdown por categoria dentro de um segmento.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | |
| `data_fim` | date | ✅ | |
| `segmento` | enum | ✅ | Segmento a detalhar |
| `location_id` | uuid[] | — | |

**Resposta:**

```json
{
  "segmento": "conveniencia",
  "categorias": [
    {
      "categoria_codigo": "BEB",
      "categoria_descricao": "Bebidas",
      "receita_bruta": 18200.00,
      "cmv": 1820.00,
      "margem_bruta": 16380.00,
      "margem_pct": 90.00,
      "participacao_pct": 40.2
    },
    {
      "categoria_codigo": "LAN",
      "categoria_descricao": "Lanchonete",
      "receita_bruta": 12400.00,
      "cmv": 1240.00,
      "margem_bruta": 11160.00,
      "margem_pct": 90.00,
      "participacao_pct": 27.4
    }
  ]
}
```

---

### 4.4 `GET /api/v1/conveniencia/grupos`

Breakdown por grupo de produto dentro de uma categoria. Drill-down final.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | |
| `data_fim` | date | ✅ | |
| `categoria_codigo` | text | ✅ | Categoria a detalhar |
| `location_id` | uuid[] | — | |

**Resposta:** array com `grupo_id`, `grupo_descricao`, `receita_bruta`, `cmv`, `margem_bruta`, `margem_pct`, `participacao_pct`.

---

## 5. Frontend

### 5.1 Página `/dashboard/conveniencia`

Rota Next.js: `app/(dashboard)/dashboard/conveniencia/page.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  [Filtro de período]  [Filtro de posto(s)]              │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Receita  │ CMV      │ Margem   │ Margem % │ Qtd itens  │
│ Bruta    │          │ Bruta    │          │            │
├──────────┴──────────┴──────────┴──────────┴────────────┤
│         Gráfico de evolução — Receita por dia           │
│         [toggle de segmento: Total / Conv / Lub / Serv] │
├─────────────────────────────────────────────────────────┤
│  Breakdown por segmento                                 │
│                                                         │
│  ▶ Conveniência   R$ 45.320  43,0%  89,2% mg  [ver →] │
│  ▶ Lubrificantes  R$ 42.000  39,9%  79,8% mg  [ver →] │
│  ▶ Serviços       R$ 18.000  17,1%  88,3% mg  [ver →] │
│                                                         │
│  [clique → expande categorias do segmento]              │
│    BEB  Bebidas       R$ 18.200  40,2%  90,0% mg       │
│    LAN  Lanchonete    R$ 12.400  27,4%  90,0% mg       │
│    ...                                                  │
└─────────────────────────────────────────────────────────┘
```

### 5.2 Componentes

| Componente | Props | Fonte |
|-----------|-------|-------|
| `KpiCard` | `label`, `value`, `format` | `/resumo` → `totais` |
| `EvolucaoChart` | `serie`, `granularidade` | `/evolucao` |
| `SegmentoLojaPainel` | `segmentos[]` | `/resumo` → `por_segmento` |
| `CategoriasAccordion` | `segmento`, `categorias[]` | `/categorias` (lazy ao expandir) |
| `GruposLista` | `categoria_codigo`, `grupos[]` | `/grupos` (lazy ao expandir categoria) |

### 5.3 Drill-down em accordion

- Nível 1: os 3 segmentos (conveniencia / lubrificantes / servicos)
- Nível 2: ao expandir um segmento → carrega `/categorias?segmento=X` e lista as categorias
- Nível 3: ao expandir uma categoria → carrega `/grupos?categoria_codigo=X` e lista os grupos

Cada nível exibe: receita bruta, margem % e participação % dentro do nível pai.

### 5.4 Regras de exibição

- Segmentos sem venda no período exibidos com `R$ 0` — não omitidos
- Categorias com `receita_bruta = 0` no período são omitidas do accordion (sem dado relevante)
- Margem % não exibida se `receita_liquida = 0`
- Participação % sempre relativa ao total do nível pai (não ao total geral)

---

## 6. Critérios de Aceitação

| # | Critério | Como verificar |
|---|----------|---------------|
| 1 | Total de receita bruta bate com `SUM(vlr_total) WHERE segmento IN (...)` em `canonical.fato_venda` | Query manual vs UI |
| 2 | Registros de combustível (`segmento = 'combustivel'`) não aparecem | Verificar filtro na MV |
| 3 | Drill-down de categorias exibe apenas categorias com vendas no período filtrado | Trocar período e confirmar que lista muda |
| 4 | Drill-down de grupos fecha ao clicar novamente na categoria — accordion funciona corretamente | Teste manual |
| 5 | Filtro de segmento no gráfico de evolução alterna corretamente entre Total e por segmento | Teste manual |
| 6 | Participação % no drill-down é relativa ao pai — soma de categorias dentro de um segmento = 100% | Verificar soma das participações |
| 7 | Nenhum endpoint acessa `canonical.fato_venda` diretamente | Code review |
| 8 | Filtro de posto funciona isoladamente | Selecionar 1 posto e comparar com banco |

---

## 7. Dependências e Pré-requisitos

| Dependência | Status |
|-------------|--------|
| `analytics.mv_conveniencia_diario` criada e populada | ❌ pendente |
| Campo `segmento` em `canonical.fato_venda` (schema) | ✅ migration 0003 aplicada |
| Pipeline preenche `segmento` via `deriveSegmento()` | ❌ pendente implementação |
| Pelo menos 1 posto com dados de loja no canonical | ❌ pendente backfill |

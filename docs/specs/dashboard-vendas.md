# Spec — Dashboard de Vendas

**Versão:** 1.0
**Data:** 2026-04-06
**Status:** Rascunho

---

## 1. Objetivo

Este documento especifica a feature "Dashboard de Vendas" — o painel principal do PostoInsight, equivalente à pergunta que o gestor faz toda manhã:

> *Como estão minhas vendas hoje, nesta semana e neste mês — por posto, por segmento, por grupo de produto?*

---

## 2. Escopo

Cobre:

- Modelo de segmentação canônico (campo `segmento` + mapeamento de categorias)
- Materialized view `analytics.mv_vendas_diario`
- 4 endpoints de API
- Comportamento do frontend (KPI cards, gráfico de evolução, breakdown por segmento e grupo)

Não cobre:

- Dashboard de Combustível (spec separada — detalhe por bico/tanque)
- Dashboard de Conveniência (spec separada)
- DRE Mensal (spec separada)
- Exportação Excel/PDF (spec separada — pós-MVP)

---

## 3. Segmentação Canônica

### 3.1 Os 4 segmentos

PostoInsight adota 4 segmentos fixos para classificar todas as vendas de loja e pista:

| Segmento | Código canônico | Descrição |
|----------|----------------|-----------|
| Combustível | `combustivel` | Venda de combustíveis e Arla na pista |
| Lubrificantes | `lubrificantes` | Lubrificantes, filtros, fluidos e acessórios |
| Serviços | `servicos` | Lavagem, lubrificação e serviços prestados no posto |
| Conveniência | `conveniencia` | Loja: alimentos, bebidas, tabacaria, embalagens |

### 3.2 Mapeamento Status ERP → segmento

O mapeamento é feito pelo pipeline no momento da ingestão, com base no `Cd_CatItem` (= `categoria_codigo` no canônico).

**Tabela de mapeamento — Status ERP:**

| `Cd_CatItem` | Descrição (TCATI) | Segmento canônico |
|-------------|-------------------|--------------------|
| `CB` | Combustivel | `combustivel` |
| `ARL` | Arla 32 | `combustivel` |
| `LUB` | Lubrificante | `lubrificantes` |
| `FLT` | Filtros | `lubrificantes` |
| `FLF` | Fluidos e Aditivos | `lubrificantes` |
| `ASS` | Assessórios | `lubrificantes` |
| `LV` | Lavagem | `servicos` |
| `LU` | Lubrificacao | `servicos` |
| `BAN` | Borracharia | `servicos` |
| `MAQ` | Maquinas | `servicos` |
| `CV` | Conveniencia | `conveniencia` |
| `TAB` | Tabacaria | `conveniencia` |
| `BEB` | Bebidas | `conveniencia` |
| `EMP` | Embalagens | `conveniencia` |
| `LAN` | Lanchonete | `conveniencia` |
| `PAT` | Patrocinio | `conveniencia` |
| `op` | Outros produtos | `conveniencia` |
| `LIV` | Livros | `conveniencia` |
| demais | — | `NULL` (categorias internas — excluídas das views) |

**Categorias internas excluídas das views analíticas:**
`INA`, `FIN`, `MC`, `ME`, `ML`, `CP`, `UF` e quaisquer categorias que não constem na tabela acima.

> Nota WebPosto: o mapeamento WebPosto → segmento será definido na spec `sync-webposto.md`. O campo `segmento` segue a mesma lógica — derivado a partir de `grupoCodigo`.

### 3.3 Campo `segmento` no modelo canônico

O campo `segmento` é adicionado a **`canonical.fato_venda`** e a **`canonical.dim_produto`**.

**Regra de derivação (pipeline):**

```typescript
function deriveSegmento(categoriaCodigo: string): string | null {
  const map: Record<string, string> = {
    'CB':  'combustivel',
    'ARL': 'combustivel',
    'LUB': 'lubrificantes',
    'FLT': 'lubrificantes',
    'FLF': 'lubrificantes',
    'ASS': 'lubrificantes',
    'LV':  'servicos',
    'LU':  'servicos',
    'BAN': 'servicos',
    'MAQ': 'servicos',
    'CV':  'conveniencia',
    'TAB': 'conveniencia',
    'BEB': 'conveniencia',
    'EMP': 'conveniencia',
    'LAN': 'conveniencia',
    'PAT': 'conveniencia',
    'op':  'conveniencia',
    'LIV': 'conveniencia',
  }
  return map[categoriaCodigo] ?? null
}
```

`NULL` → categoria interna (financeiro, mecânica, etc.) — excluída das views analíticas com `WHERE segmento IS NOT NULL`.

### 3.4 DDL — alterações necessárias

> **Status:** ✅ Já aplicadas via migration `0003_little_zaladane`. Os campos `segmento` em `fato_venda` e `dim_produto` estão no schema em produção. Nenhuma migration adicional necessária para esta spec.

---

## 4. Materialized View

### 4.1 `analytics.mv_vendas_diario`

**Grão:** 1 linha = 1 dia × 1 posto × 1 segmento × 1 grupo de produto.

**Propósito:** servir 90% das queries do Dashboard de Vendas sem acessar `canonical.fato_venda` diretamente.

```sql
CREATE MATERIALIZED VIEW analytics.mv_vendas_diario AS
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

    -- métricas
    COUNT(*)                                    AS qtd_itens,
    SUM(fv.qtd_venda)                           AS qtd_total,
    SUM(fv.vlr_total)                           AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))         AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))
                                                AS receita_liquida,
    SUM(
        COALESCE(fv.custo_unitario, 0) * fv.qtd_venda
    )                                           AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)
                                                AS margem_bruta

FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL                   -- exclui categorias internas
GROUP BY
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
    fv.grupo_descricao
WITH NO DATA;

-- Índices na MV
CREATE UNIQUE INDEX idx_mv_vendas_diario_pk
    ON analytics.mv_vendas_diario(tenant_id, location_id, data_venda, segmento, categoria_codigo, grupo_id);

CREATE INDEX idx_mv_vendas_diario_tenant_data
    ON analytics.mv_vendas_diario(tenant_id, data_venda DESC);

CREATE INDEX idx_mv_vendas_diario_posto_data
    ON analytics.mv_vendas_diario(tenant_id, location_id, data_venda DESC);

CREATE INDEX idx_mv_vendas_diario_segmento
    ON analytics.mv_vendas_diario(tenant_id, segmento, data_venda DESC);
```

### 4.2 Refresh

A MV é atualizada pelo worker após cada sync bem-sucedida:

```typescript
// worker/src/pipeline/refresh.ts
await db.execute(sql`REFRESH MATERIALIZED VIEW CONCURRENTLY analytics.mv_vendas_diario`)
```

`CONCURRENTLY` exige o unique index — leituras não são bloqueadas durante o refresh.

---

## 5. API

Base path: `/api/v1/vendas`

Todos os endpoints:
- Requerem autenticação (Auth.js session)
- Filtram por `tenant_id` derivado da sessão — nunca aceito como parâmetro externo
- Aceitam `location_id` opcional (array) — se omitido, retorna consolidado de todos os postos do tenant
- Aceitam `data_inicio` e `data_fim` (formato `YYYY-MM-DD`)

---

### 5.1 `GET /api/v1/vendas/resumo`

Retorna os KPIs do período: totais de receita, CMV e margem por segmento.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | Início do período |
| `data_fim` | date | ✅ | Fim do período |
| `location_id` | uuid[] | — | Filtro por posto(s). Omitir = todos |

**Resposta:**

```json
{
  "periodo": { "inicio": "2026-04-01", "fim": "2026-04-06" },
  "postos": ["all"],
  "totais": {
    "receita_bruta": 485320.50,
    "descontos": 1230.00,
    "receita_liquida": 484090.50,
    "cmv": 310420.00,
    "margem_bruta": 173670.50,
    "margem_pct": 35.87
  },
  "por_segmento": [
    {
      "segmento": "combustivel",
      "receita_bruta": 380000.00,
      "receita_liquida": 379500.00,
      "cmv": 295000.00,
      "margem_bruta": 84500.00,
      "margem_pct": 22.26,
      "participacao_pct": 78.4
    },
    {
      "segmento": "lubrificantes",
      "receita_bruta": 42000.00,
      "receita_liquida": 42000.00,
      "cmv": 8500.00,
      "margem_bruta": 33500.00,
      "margem_pct": 79.76,
      "participacao_pct": 8.7
    },
    {
      "segmento": "servicos",
      "receita_bruta": 18000.00,
      "receita_liquida": 18000.00,
      "cmv": 2100.00,
      "margem_bruta": 15900.00,
      "margem_pct": 88.33,
      "participacao_pct": 3.7
    },
    {
      "segmento": "conveniencia",
      "receita_bruta": 45320.50,
      "receita_liquida": 44590.50,
      "cmv": 4820.00,
      "margem_bruta": 39770.50,
      "margem_pct": 89.19,
      "participacao_pct": 9.2
    }
  ]
}
```

**SQL (Drizzle):**

```typescript
// Agregação direto na MV — sem acesso a canonical
db.select({
  segmento: mv.segmento,
  receita_bruta: sum(mv.receita_bruta),
  descontos: sum(mv.descontos),
  receita_liquida: sum(mv.receita_liquida),
  cmv: sum(mv.cmv),
  margem_bruta: sum(mv.margem_bruta),
})
.from(analytics.mv_vendas_diario)
.where(and(
  eq(mv.tenant_id, tenantId),
  gte(mv.data_venda, dataInicio),
  lte(mv.data_venda, dataFim),
  locationIds ? inArray(mv.location_id, locationIds) : undefined,
))
.groupBy(mv.segmento)
```

---

### 5.2 `GET /api/v1/vendas/evolucao`

Evolução temporal das vendas — série de pontos para o gráfico de linha/barra.

**Query params:**

| Param | Tipo | Obrig | Descrição |
|-------|------|-------|-----------|
| `data_inicio` | date | ✅ | Início do período |
| `data_fim` | date | ✅ | Fim do período |
| `granularidade` | enum | — | `dia` (default) \| `semana` \| `mes` |
| `location_id` | uuid[] | — | Filtro por posto(s) |
| `segmento` | enum | — | Filtrar por segmento específico. Omitir = total |

**Resposta:**

```json
{
  "granularidade": "dia",
  "serie": [
    { "periodo": "2026-04-01", "receita_bruta": 72000.00, "margem_bruta": 28000.00 },
    { "periodo": "2026-04-02", "receita_bruta": 68500.00, "margem_bruta": 25000.00 },
    { "periodo": "2026-04-03", "receita_bruta": 81200.00, "margem_bruta": 30500.00 }
  ]
}
```

**Regra de granularidade:**

| Granularidade | Agrupamento SQL | Campo de retorno |
|--------------|----------------|-----------------|
| `dia` | `data_venda` | `YYYY-MM-DD` |
| `semana` | `ano_mes` + `semana_ano` | `YYYY-WNN` |
| `mes` | `ano_mes` | `YYYY-MM` |

---

### 5.3 `GET /api/v1/vendas/segmentos`

Breakdown detalhado por segmento — para o painel lateral ou modal de drill-down.

**Query params:** igual ao `/resumo`.

**Resposta:** mesma estrutura de `por_segmento` do `/resumo`, com adição de `qtd_itens` e `qtd_total` (volume físico).

---

### 5.4 `GET /api/v1/vendas/grupos`

Breakdown por grupo de produto dentro de um segmento. Usado no drill-down do painel.

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
  "segmento": "combustivel",
  "grupos": [
    {
      "grupo_id": 1,
      "grupo_descricao": "Gasolina",
      "receita_bruta": 180000.00,
      "cmv": 145000.00,
      "margem_bruta": 35000.00,
      "margem_pct": 19.44,
      "participacao_pct": 47.4
    },
    {
      "grupo_id": 2,
      "grupo_descricao": "Diesel",
      "receita_bruta": 150000.00,
      "cmv": 122000.00,
      "margem_bruta": 28000.00,
      "margem_pct": 18.67,
      "participacao_pct": 39.5
    }
  ]
}
```

---

## 6. Frontend

### 6.1 Página `/dashboard`

Rota Next.js: `app/(dashboard)/dashboard/page.tsx`

**Layout:**

```
┌─────────────────────────────────────────────────────────┐
│  [Filtro de período]  [Filtro de posto(s)]              │
├──────────┬──────────┬──────────┬──────────┬────────────┤
│ Receita  │ CMV      │ Margem   │ Margem % │ Qtd itens  │
│ Bruta    │          │ Bruta    │          │            │
├──────────┴──────────┴──────────┴──────────┴────────────┤
│              Gráfico de evolução (linha/barra)          │
│         Receita Bruta por dia/semana/mês                │
├─────────────────────────────────────────────────────────┤
│  Breakdown por segmento                                 │
│  ██████████ Combustível   R$ 380.000  78,4%  22,3% mg  │
│  ████       Lubrificantes R$  42.000   8,7%  79,8% mg  │
│  ██         Serviços      R$  18.000   3,7%  88,3% mg  │
│  ███        Conveniência  R$  45.320   9,2%  89,2% mg  │
│                                                         │
│  [clique no segmento → abre grupos]                     │
└─────────────────────────────────────────────────────────┘
```

### 6.2 Componentes

| Componente | Props | Fonte de dados |
|-----------|-------|---------------|
| `KpiCard` | `label`, `value`, `format` | `/resumo` → `totais` |
| `EvolucaoChart` | `serie`, `granularidade` | `/evolucao` |
| `SegmentoBreakdown` | `segmentos[]` | `/resumo` → `por_segmento` |
| `GruposDrilldown` | `segmento`, `grupos[]` | `/grupos` (lazy — só ao clicar) |
| `PeriodoSelector` | `value`, `onChange` | estado local |
| `PostoSelector` | `postos[]`, `value`, `onChange` | `app.locations` (layout pai) |

### 6.3 Filtros e estado

- **Período padrão ao abrir:** mês corrente (`data_inicio = primeiro dia do mês`, `data_fim = hoje`)
- **Atalhos de período:** Hoje / Esta semana / Este mês / Mês anterior / Personalizado
- **Posto padrão:** todos os postos do tenant
- Os filtros são mantidos em `searchParams` (URL) — compartilhável via link

### 6.4 Regras de exibição

- KPI de margem % não exibido se `receita_liquida = 0` (evitar divisão por zero no display)
- Segmentos sem venda no período aparecem com `R$ 0` — não são omitidos
- Gráfico de evolução: eixo Y começa em 0
- Drill-down de grupos: ao clicar em um segmento, expande abaixo — não abre modal
- Valores monetários: `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`
- Status de sincronização: indicador no header — `synced_at` do último `sync_jobs SUCCESS`

### 6.5 Loading e erro

- Skeleton nos KPI cards e gráfico durante fetch
- Toast de erro se qualquer endpoint retornar 4xx/5xx (sem quebrar a página inteira)
- Se `mv_vendas_diario` estiver vazia para o tenant (backfill ainda em andamento): banner informativo "Dados em sincronização — aguarde a conclusão do backfill inicial"

---

## 7. Critérios de Aceitação

| # | Critério | Como verificar |
|---|----------|---------------|
| 1 | Dashboard carrega em menos de 3s para período de 1 mês | Lighthouse / DevTools Network |
| 2 | KPI de receita bruta bate com soma direta em `canonical.fato_venda` para o mesmo período e posto | Query manual vs UI |
| 3 | Segmentação correta: CB e ARL somados em Combustível, LUB/FLT/FLF/ASS em Lubrificantes | Ingerir registros de teste por categoria e validar |
| 4 | Categorias internas (INA, FIN, etc.) não aparecem nos totais | Verificar `WHERE segmento IS NOT NULL` na MV |
| 5 | Filtro de posto funciona: selecionar 1 posto retorna só dados daquele posto | Comparar total filtrado vs soma por posto |
| 6 | Drill-down de grupos exibe grupos corretos para o segmento clicado | Clicar em Combustível → deve listar Gasolina, Diesel, etc. |
| 7 | Gráfico de evolução por dia, semana e mês retorna pontos corretos | Verificar contagem de pontos no período |
| 8 | Nenhuma query na API lê `canonical.fato_venda` diretamente — apenas a MV | Code review |
| 9 | `tenant_id` nunca é aceito como parâmetro externo — sempre derivado da sessão | Testar com tenant_id forjado no payload |
| 10 | Banner de backfill aparece quando `backfill_completed_at IS NULL` em `app.sync_state` | Simular estado de backfill pendente |
| 11 | REFRESH CONCURRENTLY não bloqueia leituras durante atualização da MV | Rodar refresh durante carga da página |
| 12 | Período padrão ao abrir = mês corrente | Abrir o dashboard sem filtros na URL |

---

## 8. Dependências e Pré-requisitos

| Dependência | Status |
|-------------|--------|
| `canonical.fato_venda` com campo `segmento` | ✅ migration 0003 aplicada |
| `canonical.dim_produto` com campo `segmento` | ✅ migration 0003 aplicada |
| `canonical.fato_venda` com `raw_ingest_id`, `reprocessed_at`, `reprocess_count` | ✅ migration 0003 aplicada |
| `analytics.mv_vendas_diario` criada e populada | ❌ pendente |
| Pipeline Status preenche `segmento` via `deriveSegmento()` | ❌ pendente |
| Pelo menos um posto com dados no canonical (backfill concluído) | ❌ pendente |

---

## 9. Notas de Implementação

- A MV deve ser criada **com `WITH NO DATA`** e populada no primeiro `REFRESH` pelo worker após o primeiro backfill completo.
- `REFRESH MATERIALIZED VIEW CONCURRENTLY` exige o unique index `idx_mv_vendas_diario_pk` — criá-lo antes do primeiro refresh.
- O campo `segmento` no `canonical.fato_venda` deve ser indexado separadamente — já incluído no DDL acima.
- **Não usar `canonical.fato_venda` diretamente em nenhum endpoint do dashboard** — toda query vai na MV. A exceção é o drill-down de produtos individuais (fora do escopo desta spec).
- A spec `sync-status.md` precisa ser atualizada para incluir a derivação de `segmento` no step de transformação do pipeline.

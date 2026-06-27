# Spec — Classificação de Produtos (Product Mapping)

**Versão:** 0.1
**Data:** 2026-06-24
**Status:** Rascunho
**Plano:** 2b (produto). Sucede o Plano 2a (despesa, `docs/specs/admin-mapping.md`).
**Mapeamento de origem:** `docs/data/inventory/produto-hierarquia.md`

---

## 1. Objetivo

Permitir que o cliente (**owner**) **cure a apresentação de produtos** nas telas Combustível e
Conveniência: renomear rótulos crus do ERP, agrupar produtos em grupos de display, reclassificar
segmento e esconder lixo/inativos — **sem nunca reescrever o dado canônico**.

Responde aos sintomas reais (ver mapeamento §3):

> *"Por que combustível só mostra 'Diseis' e 'Gasolinas' (com typo) em vez dos produtos reais?"* e
> *"Por que a conveniência abre uma árvore enorme com nomes inconsistentes?"*

Espelha o padrão já validado da **classificação de despesa** (Plano 2a): override
**não-destrutivo aplicado em tempo de leitura**.

---

## 2. Princípio arquitetural (não negociar)

Idêntico a `admin-mapping.md §2`:

- `canonical` e `raw` **nunca** são reescritos. A classificação vive em `app.product_classification`.
- As rotas de produto fazem **merge em memória** (mapa `classification_key → override`) ao montar o response.
- Reversível, auditável; **re-sync do ERP nunca apaga** a classificação.
- Toda query filtra `tenant_id` — sem exceção. Nenhuma rota lê `raw`.
- Escrita é **owner-only** (`requireOwnerRole`).

---

## 3. Chave de classificação (`classification_key`)

Decidida por análise Pareto real (mapeamento §4). Formato: string `"<nível>:<código>"`.

| Segmento | Nível | Chave | Justificativa |
|----------|-------|-------|---------------|
| `combustivel` | produto | `product:<source_product_id>` | só 8 SKUs; subgrupo é raso (esconde Diesel S-10 × S-500) |
| `conveniencia` / `lubrificantes` / `servicos` | grupo | `group:<group_id>` | 24 grupos cobrem 99%; unifica `group_id` disperso em várias categorias |

O schema **não** amarra o nível: aceita `category:<code>` ou `subgroup:<id>` no futuro sem DDL.

---

## 4. Modelo de dados

### 4.1 `app.product_classification`

Tenant-scoped (segue convenção de `expense_classification`). Migration manual nova
(`IF NOT EXISTS`, padrão da `0007`).

```
id                  uuid pk default gen_random_uuid()
tenant_id           uuid not null references app.tenants(id) on delete cascade
classification_key  text not null      -- "<nível>:<código>" (§3)
segment_override    text               -- 'combustivel'|'conveniencia'|'lubrificantes'|'servicos' | null = mantém derivado
display_group       text               -- grupo de display agregador (ex "Diesel", "Gasolina") | null
custom_label        text               -- rename do nó (null = usa nome do ERP)
visible             boolean not null default true   -- false = esconde da UI (lixo/inativo)
sort_order          integer            -- ordenação opcional de display
created_by          uuid not null      -- user.id (owner)
created_at          timestamptz not null default now()
updated_at          timestamptz not null default now()

UNIQUE (tenant_id, classification_key)
INDEX  (tenant_id)
```

- `segment_override` validado **na aplicação** (reusa o tipo `Segment` de `@postoinsight/shared`),
  não como enum nativo — evolui sem DDL. Valores persistidos em PT (regra ADR-018).
- Schema Drizzle em `packages/db/src/schema/app.ts` (junto de `expenseClassification`).

---

## 5. Role gating

Reusa `requireOwnerRole` (já existe, `apps/api/src/lib/auth.ts`):
- Leitura (`GET .../product-groups`) → `requireTenantSession` (qualquer role do tenant vê o estado).
- Escrita (`PUT .../product-classification`) → `requireOwnerRole` (403 se não-owner sem platformRole).

---

## 6. API

Estende `apps/api/src/routes/admin-mapping.ts`. Registrar paths no `server.ts`.

### 6.1 `GET /api/v1/admin/product-groups`

Lista os nós classificáveis com estado de classificação, ordenados por **receita desc** (Pareto).

**Query params:** `segment` (default lista combustível **e** conveniência), `location_id[]` opcional.

**SQL:** dois blocos agregados de `canonical.fact_sale` (a hierarquia completa só existe no canonical,
não nas MVs):
- combustível → `GROUP BY source_product_id` (chave `product:<id>`), com `subgroup_name` p/ contexto.
- conveniência → `GROUP BY group_id` (chave `group:<id>`), `MAX(group_name)`, `MAX(category_name)`.

`LEFT JOIN app.product_classification` por `(tenant_id, classification_key)`.

**Resposta:**
```jsonc
{
  "total_revenue": 138273543.0,
  "nodes": [
    {
      "classification_key": "product:6",
      "segment": "combustivel",
      "source_code": "6",
      "erp_label": "DIESEL S10",          // product_name / group_name cru do ERP
      "context": "Diseis",                  // subgroup_name (fuel) ou category_name (conv)
      "revenue": 53950737.35,
      "pct": 39.0,
      "cum_pct": 39.0,
      "segment_override": null,
      "display_group": null,
      "custom_label": null,
      "visible": true,
      "label": "DIESEL S10"                 // custom_label ?? erp_label
    }
    // ... todos os nós, desc por revenue
  ],
  "summary": { "classified": 6, "unclassified": 18, "pct_classified_revenue": 92.4 }
}
```

### 6.2 `PUT /api/v1/admin/product-classification`

Upsert em lote. **`requireOwnerRole`.** Auditado em `app.audit_log` (`payload_before`/`payload_after`).

**Body:**
```jsonc
{
  "items": [
    { "classification_key": "product:6", "custom_label": "Diesel S-10", "display_group": "Diesel" },
    { "classification_key": "product:9", "custom_label": "Diesel S-10 RendMax", "display_group": "Diesel" },
    { "classification_key": "group:13", "custom_label": "Presentes", "visible": false }
  ]
}
```

- Valida `segment_override ∈ Segment` quando presente → 400 se inválido.
- `custom_label`/`display_group` string vazia → `null`. `visible` default `true`.
- Upsert: `ON CONFLICT (tenant_id, classification_key) DO UPDATE` (seta `updated_at`).
- Resposta: `{ "ok": true, "upserted": <n> }`.

---

## 7. Read-time apply nas rotas de produto

Carregar o mapa do tenant (1 query: `select classification_key, segment_override, display_group,
custom_label, visible, sort_order from app.product_classification where tenant_id = $1`) →
`Map<key, override>`. Aplicar em memória sobre os resultados das MVs/queries:

### 7.1 Combustível (`/api/v1/fuel`)
- "Por produto" passa a agregar por **produto** (`source_product_id`), não por subgrupo.
  → a query da rota desce ao produto (de `fact_sale`) ou a MV ganha grão de produto (decisão de
  implementação; preferir query em `fact_sale` para "Por produto" e manter MV p/ séries temporais).
- Aplica `custom_label` no rótulo, `display_group` p/ rollup opcional, omite `visible = false`.

### 7.2 Conveniência (`/api/v1/convenience`)
- Agrega por `group:<group_id>`; aplica `custom_label`, agrupa por `display_group`, omite invisíveis.
- `segment_override` permite mover um grupo entre segmentos (ex: tirar "Lubrificantes" da loja).

Reusar `n`, `round2`, `pct` de `lib/queryParsers`. Sem refresh de MV; canonical intacto.

---

## 8. Frontend (`apps/web`)

### 8.1 Tela de mapeamento
- **Aba "Produtos"** na tela de mapeamento existente (`/configuracoes/mapeamento`, hoje só despesa),
  condicionada a `role === 'owner'`. (Decisão D2 — aba vs página nova; recomendado: aba.)
- Hook `useProductMapping.ts` (GET `/admin/product-groups` + PUT `/admin/product-classification`),
  espelha `useExpenseMapping` (TanStack Query + `useMutation`).
- Lista ordenada por receita, cada linha: `label` + receita + `pct` + contexto (subgrupo/categoria),
  input `custom_label`, input `display_group`, `<select>` `segment_override`, toggle `visible`.
- Indicador de progresso **por valor** (`pct_classified_revenue`). Save em lote (debounce).

### 8.2 Telas Combustível / Conveniência
- Passam a refletir rótulos/agrupamentos curados **automaticamente** (endpoints já retornam labels
  resolvidos — sem mudança de shape no frontend além do "Por produto" do combustível agora ter N barras).
- Textos de UI permanecem em PT (camada de apresentação).

---

## 9. Seed default (combustível — Rede JAM)

Opcional: popular `product_classification` com os 8 SKUs já mapeados (display groups Diesel/Gasolina/
Arla) via seed/script, para a tela combustível nascer curada. `created_by` = owner do tenant.

---

## 10. Verificação

1. `PUT` classificando `product:6 → "Diesel S-10"/Diesel`, `group:13 → visible:false` → recarregar
   `/api/v1/fuel` e `/api/v1/convenience`: rótulos/agrupamento mudam **sem refresh de MV**.
2. `canonical.fact_sale` / `dim_product` **intactos** (override não-destrutivo).
3. Nó `visible=false` some da UI mas continua no canonical.
4. Escrita por não-owner → **403**. Cada upsert gera linha em `app.audit_log`.
5. Toda query filtra `tenant_id`; nenhuma rota lê `raw`.
6. Migration aplicada pelo founder no Railway (regra CLAUDE.md §2.0).

---

## 11. Fora de escopo (futuro)
- Auto-sugestão fuzzy-match de classificação.
- Filtro por mês/range na tela de mapeamento (MVP = histórico completo).
- Curadoria abaixo de grupo na conveniência (subgrupo/produto) — incremento posterior.

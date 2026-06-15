# Spec — Classificação Contábil de Despesas (Admin Mapping)

**Versão:** 0.1
**Data:** 2026-06-14
**Status:** Rascunho
**Plano:** 2a (despesa). O Plano 2b — remapeamento de produto — é spec separada futura.

---

## 1. Objetivo

Permitir que o cliente **classifique contabilmente** cada grupo financeiro de despesa, evoluindo
o DRE de **Margem Bruta** para **Resultado Operacional**.

Responde à pergunta de gestão:

> *Tirando o que é compra de mercadoria e imposto, quanto a rede realmente gastou de despesa
> operacional no mês — e qual o resultado depois disso?*

O Plano 1 (`docs/specs/despesas.md`) trouxe as despesas como **anexo informativo bruto**. Esta
spec adiciona a **camada de classificação por tenant** que torna o cálculo de resultado correto.

### 1.1 Por que (fundamentação no dado real)

Análise de `canonical.fato_despesa` (Rede JAM, 18 meses — ver
`docs/analysis/despesas-classificacao-comercial.html`):

- **89,3%** do valor total "de despesa" (R$ 119,7 mi de R$ 134,1 mi) é o grupo **Combustíveis** —
  compra da Ipiranga, que **já é o CMV** contado em `fato_venda.custo_unitario`. Somá-lo ao DRE
  contaria o custo em dobro.
- **~30 grupos cobrem 99%** do valor (de 106 grupos). A cauda é irrelevante → a UI prioriza por valor.
- `centro_custo` e `descricao` **não servem** como sinal de classificação (são, respectivamente,
  só a unidade e a palavra genérica "CARTEIRA"). A **única chave de classificação é o grupo
  financeiro** (`grupo_financeiro_codigo`).

---

## 2. Princípio arquitetural (não negociar)

Override **não-destrutivo aplicado em tempo de leitura** (semantic layer):

- `canonical` e `raw` **nunca** são reescritos. A classificação é uma tabela de mapping por tenant.
- O DRE faz **merge em memória** (mapa `grupo_financeiro_codigo → tipo`) na hora de montar o response.
- Reversível, auditável; **re-sync do ERP nunca apaga** a classificação.
- Toda query filtra `tenant_id` — sem exceção.
- Escrita é **owner-only** (decisão contábil sensível).

---

## 3. Modelo contábil

### 3.1 Enum `accounting_type`

| Tipo | Entra no Resultado Operacional? | Exemplos reais (JAM) |
|------|--------------------------------|----------------------|
| `despesa_operacional` | ✅ **subtrai** da Margem Bruta | Salários, Aluguel, Energia, Manutenções, Fretes, Honorários, Propaganda, **Pró-labore** |
| `despesa_financeira` | ❌ informativo (abaixo do operacional) | Juros, Tarifa bancária, IOF, Perdas Financeiras |
| `imposto` | ❌ informativo | ICMS, PIS/COFINS, IPTU, IPVA, ISS, IBAMA, Parcelamento Impostos |
| `investimento` | ❌ informativo (capex) | Investimentos Estrutural, Novos postos, Energia solar, Máquinas |
| `cmv` | ❌ excluído (já no custo da venda) | Combustíveis, Lubrificantes, ARLA, Conveniência, Bebidas, Lancheria |
| `nao_operacional` | ❌ informativo (capital/caixa) | Empréstimo principal, Retirada de Lucro, Cheque Troco, Faltas de Caixa |

**Default (não persistido):** `nao_classificado` — todo grupo sem registro na tabela de mapping.
Exibido num balde próprio com aviso; **nunca entra no Resultado Operacional por engano** (passthrough).

> Não há tipo `ignorar`. Lixo de rateio/template (bloco COOPERBONJE) já é filtrado na ingestão
> (Plano 1, `docs/specs/despesas.md` §3.1) e nunca chega ao banco.

### 3.2 Resultado Operacional

```
(=) MARGEM BRUTA                         (de mv_dre_mensal — inalterado)
(-) Despesa Operacional                  Σ valor onde accounting_type = 'despesa_operacional'
(=) RESULTADO OPERACIONAL
    Margem Operacional %  = Resultado Operacional / Receita Líquida
─────────────────────────────────────────
Seções informativas (NÃO entram no resultado):
    Despesa Financeira     Σ 'despesa_financeira'
    Impostos               Σ 'imposto'
    Investimentos          Σ 'investimento'
    CMV (compras)          Σ 'cmv'          ← exibido para transparência; não recontado
    Não-operacional        Σ 'nao_operacional'
    Não classificado       Σ grupos sem mapping  ← com aviso enquanto > 0
```

Apenas `despesa_operacional` subtrai. Os demais são exibidos, organizados, mas fora do número.

---

## 4. Modelo de dados

### 4.1 `app.despesa_classificacao`

Tabela tenant-scoped (segue a convenção de `tenant_users`/`sync_jobs`).

```
id                       uuid pk default gen_random_uuid()
tenant_id                uuid not null references app.tenants(id) on delete cascade
grupo_financeiro_codigo  text not null      -- chave canônica (mv_despesa_grupo_mensal)
accounting_type          text not null      -- enum §3.1
custom_label             text               -- rename opcional do grupo (null = usa descrição do ERP)
created_by               uuid not null      -- user.id (owner que classificou)
created_at               timestamptz not null default now()
updated_at               timestamptz not null default now()

UNIQUE (tenant_id, grupo_financeiro_codigo)
INDEX  (tenant_id)
```

- **Chave** = `grupo_financeiro_codigo`. Grupos com código NULL no ERP (ex: "SOMENTE CONTAS A
  PAGAR") são representados pela sentinela literal `'__SEM_CODIGO__'` na API (GET e PUT), para
  caberem no UNIQUE e serem classificáveis.
- DDL via **migration manual `0007`** (padrão da `0006`, `IF NOT EXISTS`). Founder aplica no Railway.
- `accounting_type` validado na aplicação (não como enum nativo do Postgres, para evoluir sem DDL).

---

## 5. Role gating

Helper novo `requireOwnerRole(req, reply)` em `apps/api/src/lib/auth.ts` (espelha
`requireTenantSession`), usado como `preHandler` nas rotas de **escrita**:

- Roda **após** `requireTenantSession`.
- 403 se `req.role !== 'owner'` **e** sem `req.platformRole` (superadmin/support passam).
- Bônus: aplicar também em `POST /admin/backfill` (`admin.ts`), hoje sem checagem.

Leitura (`GET /admin/despesa-grupos`) exige apenas `requireTenantSession` (qualquer role do tenant
pode ver o estado; só não pode gravar).

---

## 6. API

Base path novo: `/api/v1/admin` — arquivo `apps/api/src/routes/admin-mapping.ts`. Registrar no
server junto de `dreRoutes`/`syncRoutes`.

### 6.1 `GET /api/v1/admin/despesa-grupos`

Lista os grupos financeiros do tenant (de `mv_despesa_grupo_mensal`) com o estado de classificação,
ordenados por **valor total desc** (prioridade Pareto).

**Query params:** `location_id[]` opcional. (Sem `meses` no MVP → considera todo o histórico.)

**SQL:** agregação de `mv_despesa_grupo_mensal` por `grupo_financeiro_codigo` (SUM total, SUM qtd,
MAX descrição) `LEFT JOIN app.despesa_classificacao` por `(tenant_id, grupo_financeiro_codigo)`.
NULL de código → sentinela `'__SEM_CODIGO__'`.

**Resposta:**

```jsonc
{
  "total_geral": 134097150.35,
  "grupos": [
    {
      "grupo_financeiro_codigo": "11",
      "grupo_financeiro_descricao": "Combustiveis",
      "total": 119732913.05,
      "qtd_lancamentos": 2932,
      "pct": 89.3,                       // % do total_geral
      "accounting_type": null,            // null = não classificado
      "custom_label": null,
      "label": "Combustiveis"             // custom_label ?? descricao
    },
    { "grupo_financeiro_codigo": "513", "grupo_financeiro_descricao": "Salários",
      "total": 1583076.00, "qtd_lancamentos": 169, "pct": 1.2,
      "accounting_type": "despesa_operacional", "custom_label": null, "label": "Salários" }
    // ... todos os grupos, desc por total
  ],
  "resumo": {
    "classificados": 28,
    "nao_classificados": 78,
    "valor_classificado": 132627000.00,   // soma dos grupos já com tipo
    "pct_classificado_valor": 98.9         // priorização por valor, não por contagem
  }
}
```

### 6.2 `PUT /api/v1/admin/despesa-classificacao`

Upsert de 1 ou vários grupos. **`requireOwnerRole`.**

**Body:**

```jsonc
{
  "itens": [
    { "grupo_financeiro_codigo": "11",  "accounting_type": "cmv" },
    { "grupo_financeiro_codigo": "513", "accounting_type": "despesa_operacional", "custom_label": "Folha de Pagamento" },
    { "grupo_financeiro_codigo": "631", "accounting_type": "nao_operacional" }
  ]
}
```

- Valida `accounting_type ∈` enum §3.1 → 400 se inválido.
- `custom_label` opcional (`null`/ausente mantém descrição do ERP); string vazia → trata como `null`.
- Upsert: `ON CONFLICT (tenant_id, grupo_financeiro_codigo) DO UPDATE` (seta `updated_at`, `created_by`
  permanece do primeiro insert).
- **Auditoria:** cada item gravado registra em `app.audit_log` (`payload_before`/`payload_after`).
- Resposta: `{ "ok": true, "upserted": <n> }`.

> Toda query filtra `tenant_id`. Nenhuma rota lê `raw`. Não há acesso a `canonical` na escrita.

---

## 7. Read-time apply no DRE

Em `apps/api/src/routes/dre.ts`, substituir o bloco "Anexo informativo" (linhas ~126-156) por:

1. **Carregar o mapa do tenant** (1 query): `select grupo_financeiro_codigo, accounting_type,
   custom_label from app.despesa_classificacao where tenant_id = $1` → `Map<codigo, {type,label}>`.
2. **Agregar despesa por mês × código** de `mv_despesa_grupo_mensal` (hoje agrupa só por descrição;
   passar a incluir `grupoFinanceiroCodigo`).
3. **Bucketizar** por `accounting_type` (default `nao_classificado` quando não há mapping):
   aplicar `custom_label ?? grupo_financeiro_descricao` no rótulo.
4. **Estender o response** (campos novos, sem quebrar os existentes):

```jsonc
{
  "meses": ["2026-05"], "locations": "all", "linhas": [ /* inalterado */ ],
  "despesas": {
    "2026-05": {
      "operacional":       { "total": 95000.00, "porGrupo": [ { "label": "Salários", "codigo": "513", "valor": 88000 } ] },
      "financeira":        { "total": 12000.00, "porGrupo": [ ... ] },
      "imposto":           { "total": 18000.00, "porGrupo": [ ... ] },
      "investimento":      { "total":  5000.00, "porGrupo": [ ... ] },
      "cmv":               { "total": 70000.00, "porGrupo": [ ... ] },
      "nao_operacional":   { "total":  8000.00, "porGrupo": [ ... ] },
      "nao_classificado":  { "total":  2000.00, "porGrupo": [ ... ] }
    }
  },
  "resultado_operacional": {
    "2026-05": {
      "margem_bruta": 258770.00,          // do _total de linhas[]
      "despesa_operacional": 95000.00,
      "resultado_operacional": 163770.00, // margem_bruta − despesa_operacional
      "margem_operacional_pct": 15.10     // resultado / receita_liquida do _total
    }
  }
}
```

- Reutilizar `n`, `round2`, `pct` de `lib/queryParsers` (já importados em `dre.ts`).
- `resultado_operacional` calculado por mês: `_total.margem_bruta − despesas.operacional.total`.
- O campo legado `despesas.<mes>.total_bruto`/`porGrupo` pode ser **removido** (frontend migra junto)
  ou mantido durante transição — decidir no code review.

---

## 8. Frontend (`apps/web`)

### 8.1 Tela de classificação — `AdminMapeamentoPage.tsx`

- Rota `/configuracoes/mapeamento`. Item no `Sidebar.tsx` (NAV_OPS) **condicionado a
  `useAuth().user?.role === 'owner'`**.
- Espelha o padrão de `ConfiguracoesPage.tsx` (Card + TanStack Query + `useMutation`).
- Hook `useDespesaMapping.ts` (GET `/admin/despesa-grupos` + PUT `/admin/despesa-classificacao`).
- Lista de grupos **ordenada por valor desc**, cada linha com:
  - `label` + total + `pct` + qtd
  - `<select>` de `accounting_type` (6 opções + "não classificado")
  - input de `custom_label` (placeholder = descrição do ERP)
  - badge "não classificado" enquanto `accounting_type === null`
- Indicador de progresso **por valor** (`pct_classificado_valor`), não por contagem.
- Save em lote (PUT com vários itens) ou por linha — preferir debounce/lote.

### 8.2 DRE — `DrePage.tsx`

- Trocar o painel bruto atual pela visão classificada:
  - Linha **(=) Resultado Operacional** + KPI de **Margem Operacional %**.
  - Seções informativas recolhíveis: Financeira, Impostos, Investimentos, CMV, Não-operacional.
  - **Aviso** ("⚠ Existem grupos não classificados — o Resultado Operacional pode estar incompleto")
    exibido **apenas enquanto** `despesas.<mes>.nao_classificado.total > 0`, com link para
    `/configuracoes/mapeamento`.

---

## 9. Verificação

1. **PUT** classificando: `11→cmv`, `513→despesa_operacional`, `601→imposto`, `631→nao_operacional`.
2. Recarregar `GET /dre/mensal` → `resultado_operacional = _total.margem_bruta −
   despesas.operacional.total`, **sem** refresh de MV.
3. Conferir `canonical.fato_despesa` **intacto** (override não-destrutivo).
4. Grupo não classificado → aparece em `nao_classificado`, **não** entra no Resultado Operacional;
   aviso visível no DRE.
5. Escrita por usuário não-owner → **403**.
6. Toda query filtra `tenant_id`. Nenhuma rota lê `raw`.
7. Auditoria: cada upsert gera linha em `app.audit_log`.

---

## 10. Fora de escopo (futuro)

- **Plano 2b** — remapeamento de hierarquia de produto (categoria/grupo/subgrupo) em
  `vendas.ts`/`conveniencia.ts` (resolve "Subgrupo null" e nomes crus).
- **Auto-sugestão fuzzy-match** (ex: CEEE/ENERGIA/LUZ → "Energia") — incremento posterior, para
  despesa e produto.
- Filtro por mês/range na tela de classificação (MVP considera histórico completo).

# Inventário — Hierarquia de Produto (Status ERP)

**Versão:** 1.0
**Data:** 2026-06-24
**Status:** Mapeamento completo (Fase 0 do Plano 2b)
**Spec relacionada:** `docs/specs/produto-classificacao.md` (a escrever)
**Fonte de dados:** amostras em `files/status/tabelas_sql/` (Rede JAM) + `docs/data/inventory/status-inventory.md`

> Objetivo deste documento: mapear **como produtos estão estruturados hoje** — da origem (ERP
> Status) até a UI — e **catalogar os problemas de classificação**, para fundamentar a decisão de
> "como classificar" antes de modelar a tabela de classificação. Responde diretamente aos sintomas
> vistos nas telas **Combustível** e **Conveniência**.

---

## 1. Estrutura da origem (ERP Status)

Hierarquia de **4 níveis**, em tabelas separadas, ligadas por FK em `TITEM`:

```
TCATI (Categoria)   — Cd_CatItem (varchar 3), Descricao        — ~38 categorias
  └─ TGRPI (Grupo)     — Cd_GrpItem (smallint), Descricao        — ~77 grupos
       └─ TSGrI (Subgrupo) — Cd_SGrItem (smallint), Cd_GrpItem(FK), Descricao
            └─ TITEM (Item)    — Cd_Item (varchar 15), Descricao, Cd_CatItem, Cd_GrpItem, Cd_SGrItem
                                  — ~13.599 itens (ativos + inativos)
```

Denormalizada na view de BI **`TMPBI_VENDA_DETALHADA`** (watermark `DATA_EMISSAO`), que é o que o
agente extrai. Colunas relevantes da view (uma linha por item de venda):

| Coluna view | Nível | Exemplo (real, JAM) |
|-------------|-------|---------------------|
| `CODIGO_CATEGORIA_ITEM` | 1 | `CB`, `TAB`, `BEB` |
| `DESCRICAO_CATEGORIA_ITEM` | 1 | `COMBUSTIVEIS`, `TABACARIA` |
| `CODIGO_GRUPO_ITEM` | 2 | `1`, `158` |
| `DESCRICAO_GRUPO_ITEM` | 2 | `Combustíveis`, `Tabacaria` |
| `CODIGO_SUBGRUPO_ITEM` | 3 | `1`, `30` |
| `DESCRICAO_SUBGRUPO_ITEM` | 3 | `Gasolinas`, `Cigarros` |
| `CODIGO_ITEM` | 4 | `1`, `8381` |
| `DESCRICAO_ITEM` | 4 | `GASOLINA COMUM`, `CIG DUNHILL CARLTON BOX` |

### 1.1 As 38 categorias reais (TCATI)
`ACESSORIOS, ARLA, BANHO, BEBIDAS, BRINDES, CAFES, CESTA BASICA, COMBUSTIVEIS, CONVENIENCIA,
Diversos, EMPÓRIO, Energia eletrica, EQUIP. IMFORMATICA, EQUIPAMENTOS, FERRAMENTAS, FILTROS,
FINANCEIRO, FLUIDOS, Inativos, INSUMOS LANCHERIA, INSUMOS PRODUÇÃO, LANCHES PRONTOS, LAVAGEM,
LIVROS, LUBRIFICAÇAO, LUBRIFICANTES, MANUTENÇÃO DO POSTO, Manutençao Veiculos, MAQUINA LAVA/SECA,
Material de Consumo, MATERIAL DE LIMPEZA, MATERIAL/ESCRITORIO, PRATOS PRONTOS, PRODUÇAO IMBE,
TABACARIA, UNIFORMES, UTENCILIOS / COZINHA`

Já dá para ver: categorias de **produto** (`BEBIDAS`, `TABACARIA`), de **serviço/operação**
(`LAVAGEM`, `MANUTENÇÃO DO POSTO`), e de **insumo/lixo** (`Inativos`, `INSUMOS PRODUÇÃO`,
`Material de Consumo`). Tudo misturado no mesmo nível.

---

## 2. Fluxo raw → canonical → analytics

| Camada | Onde | Campos de produto |
|--------|------|-------------------|
| **raw** | `raw.raw_ingest` (JSONB intocado da view) | payload cru de `TMPBI_VENDA_DETALHADA` |
| **canonical** | `canonical.fact_sale` + `canonical.dim_product` | `category_code`, `category_name`, `group_id`, `group_name`, `subgroup_id`, `subgroup_name`, `is_fuel`, `segment` |
| **analytics** | `mv_sales_daily`, `mv_fuel_daily`, `mv_convenience_daily` | agregadas por `category_code` / `group_id` / `group_name` (+ `segment`) |

### 2.1 Onde o `segment` é derivado
`packages/shared/src/types/sync.ts` → `deriveSegment(categoryCode)` via `SEGMENT_MAP` **hardcoded**:

| `category_code` | `segment` (valor persistido em PT) |
|-----------------|------------------------------------|
| `CB`, `ARL` | `combustivel` (+ `is_fuel = true`) |
| `LUB`, `FLT`, `FLF`, `ASS` | `lubrificantes` |
| `LV`, `LU`, `BAN`, `MAQ` | `servicos` |
| `CV`, `TAB`, `BEB`, `EMP`, `LAN`, `PAT`, `OP`, `PRL`, `LIV` | `conveniencia` |
| qualquer outro | `null` (excluído das MVs — `WHERE segment IS NOT NULL`) |

> **Ponto crítico:** a única curadoria existente hoje é esse mapa fixo de `category_code → segment`.
> Não há nenhuma curadoria de **nome de display** nem de **agrupamento** abaixo da categoria.
> Tudo que a UI mostra abaixo do segmento é texto cru do ERP.

### 2.2 Como as telas consomem
- **Combustível** (`CombustivelPage.tsx` → `/api/v1/fuel`): "Por produto" agrupa por
  **`subgroup_name`** (porque todo combustível cai sob 1 único grupo `Combustíveis`).
- **Conveniência** (`ConvenienciaPage.tsx` → `/api/v1/convenience`): accordion
  categoria → grupo → subgrupo → produto, todos os rótulos crus.

---

## 3. Mapa de problemas (sintoma → causa → onde aparece)

| # | Sintoma na UI | Causa raiz no dado | Onde aparece |
|---|---------------|--------------------|--------------|
| P1 | Rótulo "**Diseis**" (typo) na barra de volume | `TSGrI` subgroup 18 = `Diseis` — erro de digitação no cadastro do ERP | Combustível / "Por produto" |
| P2 | Só 2 barras ("Diseis", "Gasolinas") agrupam combustíveis muito diferentes | toda venda de combustível tem `group_id=1` (`Combustíveis`); a UI cai para `subgroup_name`, que tem granularidade/qualidade irregular | Combustível |
| P3 | Conveniência granular demais (abre até produto) com nomes inconsistentes | accordion expõe a hierarquia ERP inteira sem nenhum agrupamento de display curado | Conveniência / "Breakdown por categoria" |
| P4 | Caixa/encoding inconsistente ("Bebidas Nao Alcolicas", "ARLA " com espaço) | dados crus do ERP — sem normalização | Conveniência e Combustível |
| P5 | Categorias não-produto poluindo análise | `Inativos`, `Material de Consumo`, `INSUMOS PRODUÇÃO` etc. no mesmo nível dos produtos | qualquer tela que liste categorias |
| P6 | Subgrupos órfãos / `subgroup_id` NULL | ~60% dos registros antigos em `TSGrI` têm `Cd_GrpItem` NULL; itens podem não ter subgrupo | drill-down quebra ("Subgrupo null") |
| P7 | Itens `(INATIVO)` aparecem em listagens | flag de inatividade só no texto da `Descricao` | listagens de produto |

> Conclusão dos sintomas: o problema **não é o pipeline** — os dados canônicos estão corretos e
> fiéis ao ERP. O problema é a **ausência de uma camada de curadoria de display** entre o dado cru
> e a UI. É exatamente o que a classificação de despesa resolveu para o DRE.

---

## 4. Inventário da chave de classificação (decisão D1 — FECHADA)

Análise Pareto por receita em `canonical.fact_sale` (Rede JAM, histórico completo).

### 4.1 Combustível — por subgrupo (raso demais) → por **produto**
Só **3 subgrupos** cobrem 100%, sem NULL: `Diseis` (50,3%), `Gasolinas` (48,9%), `ARLA` (0,9%).
Mas o subgrupo esconde a diferenciação real. Descendo ao **produto** (8 SKUs):

| `source_product_id` | produto (cru) | subgrupo | receita | display_group sugerido |
|---------------------|---------------|----------|---------|------------------------|
| 6 | DIESEL S10 | Diseis | 53,9 mi | Diesel |
| 1 | GASOLINA COMUM | Gasolinas | 51,2 mi | Gasolina |
| 4 | GASOLINA ADITIVADA | Gasolinas | 15,5 mi | Gasolina |
| 5 | DIESEL S500 | Diseis | 14,8 mi | Diesel |
| 7 | GASOLINA PREMIUM | Gasolinas | 1,4 mi | Gasolina |
| 9 | DIESEL S10 RENDMAX | Diseis | 1,2 mi | Diesel |
| 99029648 | ARLA 32 BT LITRO | ARLA | 1,2 mi | Arla |
| 99029649 | ARLA 32 BT 20 L | ARLA | 13 mil | Arla |

→ **Chave de combustível = `product:<source_product_id>`**. Poucos SKUs, nomes já limpos; só faltava
a UI descer ao produto (hoje para no subgrupo, mostrando 2 barras com typo "Diseis").

### 4.2 Conveniência — por **grupo**
**24 grupos cobrem 99%** da receita (de ~47 totais) — distribuição Pareto clara. Top: Bebidas Não
Alcoólicas (16,7%), Lanches Prontos (16,6%), Tabacaria (15,2%), Lubrificantes (10%), Cafés (8,8%).

→ **Chave de conveniência = `group:<group_id>`**. Observação de qualidade: o mesmo `group_id`
aparece sob **categorias diferentes** (ex: grupo 13 "Presentes" em CONVENIENCIA/EMPÓRIO/ACESSORIOS;
grupo 28 "Cafés" em CAFES/CONVENIENCIA). Logo a agregação é por `group_id` com `MAX(group_name)`,
o que já **unifica** essas dispersões no display.

### 4.3 Decisão
Chave canônica unificada `"<nível>:<código>"` na tabela `app.product_classification`:
- **Combustível** → `product:<source_product_id>` (8 SKUs)
- **Conveniência** → `group:<group_id>` (~24 nós relevantes)
- Suporta evoluir para `subgroup:<id>` ou `category:<code>` sem mudar o schema.

---

## 5. Princípio de solução (espelha despesa — Plano 2a)

Override **não-destrutivo em tempo de leitura**: tabela `app.product_classification` por tenant,
mapeando a chave canônica → `segment_override` / `display_group` / `custom_label` / `visible`.
`canonical`/`raw` nunca reescritos; re-sync do ERP nunca apaga a curadoria; reclassificar é
instantâneo (sem refresh de MV). Escrita owner-only e auditada. Detalhamento na spec
`docs/specs/produto-classificacao.md`.

---

## 6. Referências
- Origem detalhada: `docs/data/inventory/status-inventory.md`
- Modelo canônico: `docs/data/canonical-model.md`
- Padrão de classificação (despesa): `docs/specs/admin-mapping.md`
- Derivação de segmento: `packages/shared/src/types/sync.ts`

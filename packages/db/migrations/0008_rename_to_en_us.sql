-- =============================================================================
-- 0008_rename_to_en_us.sql
-- ADR-018 — Padronização do backend para en-US.
--
-- Renomeia tabelas/colunas/índices/constraints dos schemas `canonical` e `app`
-- (camada que controlamos) para inglês, PRESERVANDO os dados (sem reprocessar).
-- As 6 materialized views de `analytics` são recriadas com SQL em inglês
-- (são derivadas — REFRESH após a migration).
--
-- Exceções (não mudam): nomes de origem ERP, e VALORES enum persistidos
-- (segment = 'combustivel'..., accounting_type = 'despesa_operacional'...).
--
-- Estratégia: ALTER RENAME (dim_date não vem do raw; JAM já backfillada).
-- Migration escrita à mão (padrão das 0002/0006/0007).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. Drop das MVs (dependem das colunas/tabelas canonical que serão renomeadas)
-- -----------------------------------------------------------------------------
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_vendas_diario";--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_combustivel_diario";--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_conveniencia_diario";--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_dre_mensal";--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_despesa_mensal";--> statement-breakpoint
DROP MATERIALIZED VIEW IF EXISTS "analytics"."mv_despesa_grupo_mensal";--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- 1. canonical.dim_tempo -> canonical.dim_date
-- -----------------------------------------------------------------------------
ALTER TABLE "canonical"."dim_tempo" RENAME TO "dim_date";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "data" TO "date";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "ano" TO "year";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "mes" TO "month";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "dia" TO "day";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "ano_mes" TO "year_month";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "trimestre" TO "quarter";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "semana_ano" TO "week_of_year";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "dia_semana" TO "day_of_week";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "nome_dia_semana" TO "day_of_week_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "nome_mes" TO "month_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "is_fim_de_semana" TO "is_weekend";--> statement-breakpoint
ALTER TABLE "canonical"."dim_date" RENAME COLUMN "is_feriado" TO "is_holiday";--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- 2. canonical.dim_produto -> canonical.dim_product
-- -----------------------------------------------------------------------------
ALTER TABLE "canonical"."dim_produto" RENAME TO "dim_product";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "source_produto_id" TO "source_product_id";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "nome" TO "name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "nome_resumido" TO "short_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "categoria_codigo" TO "category_code";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "categoria_descricao" TO "category_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "grupo_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "grupo_descricao" TO "group_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "subgrupo_id" TO "subgroup_id";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "subgrupo_descricao" TO "subgroup_name";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "tipo_produto" TO "product_type";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "unidade_venda" TO "sale_unit";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "is_combustivel" TO "is_fuel";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "segmento" TO "segment";--> statement-breakpoint
ALTER TABLE "canonical"."dim_product" RENAME COLUMN "ativo" TO "active";--> statement-breakpoint
ALTER INDEX "canonical"."idx_dim_produto_current" RENAME TO "idx_dim_product_current";--> statement-breakpoint
ALTER INDEX "canonical"."idx_dim_produto_lookup" RENAME TO "idx_dim_product_lookup";--> statement-breakpoint
-- nota: a CHECK constraint chk_segmento existia só no schema Drizzle, nunca foi criada no banco
-- (drift pré-ADR-018) — por isso não há RENAME aqui.

-- -----------------------------------------------------------------------------
-- 3. canonical.fato_venda -> canonical.fact_sale
-- -----------------------------------------------------------------------------
ALTER TABLE "canonical"."fato_venda" RENAME TO "fact_sale";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "data_venda" TO "sale_date";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "hora_venda" TO "sale_time";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "turno" TO "shift";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "nr_nota" TO "invoice_number";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "source_produto_id" TO "source_product_id";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "descricao_produto" TO "product_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "categoria_codigo" TO "category_code";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "categoria_descricao" TO "category_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "grupo_id" TO "group_id";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "grupo_descricao" TO "group_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "subgrupo_id" TO "subgroup_id";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "subgrupo_descricao" TO "subgroup_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "is_combustivel" TO "is_fuel";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "segmento" TO "segment";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "qtd_venda" TO "quantity";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "vlr_unitario" TO "unit_value";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "vlr_total" TO "total_value";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "custo_unitario" TO "unit_cost";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "desconto_total" TO "discount_total";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "acrescimo_total" TO "surcharge_total";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "bico_codigo" TO "nozzle_code";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "bico_descricao" TO "nozzle_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "tanque_codigo" TO "tank_code";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "tanque_descricao" TO "tank_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "source_cliente_id" TO "source_customer_id";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "source_funcionario_id" TO "source_employee_id";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME COLUMN "forma_pagamento_tipo" TO "payment_method_type";--> statement-breakpoint
ALTER TABLE "canonical"."fact_sale" RENAME CONSTRAINT "uq_fato_venda" TO "uq_fact_sale";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_venda_tenant_data" RENAME TO "idx_fact_sale_tenant_date";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_venda_location_data" RENAME TO "idx_fact_sale_location_date";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_venda_segmento" RENAME TO "idx_fact_sale_segment";--> statement-breakpoint
-- nota: a CHECK constraint chk_fato_segmento existia só no schema Drizzle, nunca foi criada no banco
-- (drift pré-ADR-018) — por isso não há RENAME aqui.

-- -----------------------------------------------------------------------------
-- 4. canonical.fato_despesa -> canonical.fact_expense
-- -----------------------------------------------------------------------------
ALTER TABLE "canonical"."fato_despesa" RENAME TO "fact_expense";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "data_despesa" TO "expense_date";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "descricao" TO "description";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "grupo_financeiro_codigo" TO "financial_group_code";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "grupo_financeiro_descricao" TO "financial_group_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "centro_custo_codigo" TO "cost_center_code";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "centro_custo_descricao" TO "cost_center_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "operacao" TO "operation";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "tipo_lancamento" TO "entry_type";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "fornecedor_nome" TO "supplier_name";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "fornecedor_doc" TO "supplier_doc";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME COLUMN "valor" TO "amount";--> statement-breakpoint
ALTER TABLE "canonical"."fact_expense" RENAME CONSTRAINT "uq_fato_despesa" TO "uq_fact_expense";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_despesa_tenant_data" RENAME TO "idx_fact_expense_tenant_date";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_despesa_location_data" RENAME TO "idx_fact_expense_location_date";--> statement-breakpoint
ALTER INDEX "canonical"."idx_fato_despesa_grupo" RENAME TO "idx_fact_expense_group";--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- 5. app.despesa_classificacao -> app.expense_classification
-- -----------------------------------------------------------------------------
ALTER TABLE "app"."despesa_classificacao" RENAME TO "expense_classification";--> statement-breakpoint
ALTER TABLE "app"."expense_classification" RENAME COLUMN "grupo_financeiro_codigo" TO "financial_group_code";--> statement-breakpoint
ALTER TABLE "app"."expense_classification" RENAME CONSTRAINT "uq_despesa_classificacao" TO "uq_expense_classification";--> statement-breakpoint
ALTER INDEX "app"."idx_despesa_classificacao_tenant" RENAME TO "idx_expense_classification_tenant";--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- 6. Recriação das MVs em inglês (WITH NO DATA — REFRESH após a migration)
-- -----------------------------------------------------------------------------

-- mv_sales_daily ---------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_sales_daily" AS
SELECT
    fs.tenant_id,
    fs.location_id,
    fs.sale_date,
    dd.year,
    dd.month,
    dd.year_month,
    dd.week_of_year,
    dd.day_of_week,
    dd.is_weekend,
    fs.segment,
    fs.category_code,
    fs.category_name,
    fs.group_id,
    fs.group_name,
    COUNT(*)::bigint                                                 AS item_count,
    SUM(fs.quantity)                                                 AS total_quantity,
    SUM(fs.total_value)                                              AS gross_revenue,
    SUM(COALESCE(fs.discount_total, 0))                             AS discounts,
    SUM(fs.total_value) - SUM(COALESCE(fs.discount_total, 0))       AS net_revenue,
    SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)                    AS cogs,
    SUM(fs.total_value)
        - SUM(COALESCE(fs.discount_total, 0))
        - SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)             AS gross_margin
FROM canonical.fact_sale fs
JOIN canonical.dim_date dd ON dd.date = fs.sale_date
WHERE fs.segment IS NOT NULL
GROUP BY
    fs.tenant_id, fs.location_id, fs.sale_date,
    dd.year, dd.month, dd.year_month, dd.week_of_year, dd.day_of_week, dd.is_weekend,
    fs.segment, fs.category_code, fs.category_name,
    fs.group_id, fs.group_name
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_sales_daily_pk"
    ON "analytics"."mv_sales_daily"
    (tenant_id, location_id, sale_date, segment, category_code, group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_sales_daily_tenant_date"
    ON "analytics"."mv_sales_daily" (tenant_id, sale_date DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_sales_daily_location_date"
    ON "analytics"."mv_sales_daily" (tenant_id, location_id, sale_date DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_sales_daily_segment"
    ON "analytics"."mv_sales_daily" (tenant_id, segment, sale_date DESC);--> statement-breakpoint

-- mv_fuel_daily ----------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_fuel_daily" AS
SELECT
    fs.tenant_id,
    fs.location_id,
    fs.sale_date,
    dd.year,
    dd.month,
    dd.year_month,
    dd.week_of_year,
    dd.day_of_week,
    dd.is_weekend,
    fs.category_code,
    fs.group_id,
    fs.group_name,
    COUNT(*)::bigint                                                 AS refuel_count,
    SUM(fs.quantity)                                                 AS volume_liters,
    SUM(fs.total_value)                                              AS gross_revenue,
    SUM(COALESCE(fs.discount_total, 0))                             AS discounts,
    SUM(fs.total_value) - SUM(COALESCE(fs.discount_total, 0))       AS net_revenue,
    SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)                    AS cogs,
    SUM(fs.total_value)
        - SUM(COALESCE(fs.discount_total, 0))
        - SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)             AS gross_margin,
    CASE WHEN SUM(fs.quantity) > 0
        THEN SUM(fs.total_value) / SUM(fs.quantity)
        ELSE NULL
    END                                                             AS avg_price_liter,
    CASE WHEN SUM(fs.quantity) > 0
              AND SUM(COALESCE(fs.unit_cost, 0) * fs.quantity) > 0
        THEN SUM(COALESCE(fs.unit_cost, 0) * fs.quantity) / SUM(fs.quantity)
        ELSE NULL
    END                                                             AS avg_cost_liter
FROM canonical.fact_sale fs
JOIN canonical.dim_date dd ON dd.date = fs.sale_date
WHERE fs.segment = 'combustivel'
GROUP BY
    fs.tenant_id, fs.location_id, fs.sale_date,
    dd.year, dd.month, dd.year_month, dd.week_of_year, dd.day_of_week, dd.is_weekend,
    fs.category_code, fs.group_id, fs.group_name
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_fuel_daily_pk"
    ON "analytics"."mv_fuel_daily"
    (tenant_id, location_id, sale_date, category_code, group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_fuel_daily_tenant_date"
    ON "analytics"."mv_fuel_daily" (tenant_id, sale_date DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_fuel_daily_location_date"
    ON "analytics"."mv_fuel_daily" (tenant_id, location_id, sale_date DESC);--> statement-breakpoint

-- mv_convenience_daily ---------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_convenience_daily" AS
SELECT
    fs.tenant_id,
    fs.location_id,
    fs.sale_date,
    dd.year,
    dd.month,
    dd.year_month,
    dd.week_of_year,
    dd.day_of_week,
    dd.is_weekend,
    fs.segment,
    fs.category_code,
    fs.category_name,
    fs.group_id,
    fs.group_name,
    COUNT(*)::bigint                                                 AS item_count,
    SUM(fs.quantity)                                                 AS total_quantity,
    SUM(fs.total_value)                                              AS gross_revenue,
    SUM(COALESCE(fs.discount_total, 0))                             AS discounts,
    SUM(fs.total_value) - SUM(COALESCE(fs.discount_total, 0))       AS net_revenue,
    SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)                    AS cogs,
    SUM(fs.total_value)
        - SUM(COALESCE(fs.discount_total, 0))
        - SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)             AS gross_margin
FROM canonical.fact_sale fs
JOIN canonical.dim_date dd ON dd.date = fs.sale_date
WHERE fs.segment IN ('conveniencia','lubrificantes','servicos')
GROUP BY
    fs.tenant_id, fs.location_id, fs.sale_date,
    dd.year, dd.month, dd.year_month, dd.week_of_year, dd.day_of_week, dd.is_weekend,
    fs.segment, fs.category_code, fs.category_name,
    fs.group_id, fs.group_name
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_convenience_daily_pk"
    ON "analytics"."mv_convenience_daily"
    (tenant_id, location_id, sale_date, segment, category_code, group_id);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_convenience_daily_tenant_date"
    ON "analytics"."mv_convenience_daily" (tenant_id, sale_date DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_convenience_daily_location_date"
    ON "analytics"."mv_convenience_daily" (tenant_id, location_id, sale_date DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_convenience_daily_segment"
    ON "analytics"."mv_convenience_daily" (tenant_id, segment, sale_date DESC);--> statement-breakpoint

-- mv_income_statement_monthly --------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_income_statement_monthly" AS
SELECT
    fs.tenant_id,
    fs.location_id,
    dd.year,
    dd.month,
    dd.year_month,
    fs.segment,
    COUNT(*)::bigint                                                 AS item_count,
    SUM(fs.quantity)                                                 AS total_quantity,
    SUM(fs.total_value)                                              AS gross_revenue,
    SUM(COALESCE(fs.discount_total, 0))                             AS discounts,
    SUM(fs.total_value) - SUM(COALESCE(fs.discount_total, 0))       AS net_revenue,
    SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)                    AS cogs,
    SUM(fs.total_value)
        - SUM(COALESCE(fs.discount_total, 0))
        - SUM(COALESCE(fs.unit_cost, 0) * fs.quantity)             AS gross_margin
FROM canonical.fact_sale fs
JOIN canonical.dim_date dd ON dd.date = fs.sale_date
WHERE fs.segment IS NOT NULL
GROUP BY
    fs.tenant_id, fs.location_id,
    dd.year, dd.month, dd.year_month,
    fs.segment
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_income_statement_monthly_pk"
    ON "analytics"."mv_income_statement_monthly"
    (tenant_id, location_id, year_month, segment);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_income_statement_monthly_tenant_period"
    ON "analytics"."mv_income_statement_monthly" (tenant_id, year_month DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_income_statement_monthly_location_period"
    ON "analytics"."mv_income_statement_monthly" (tenant_id, location_id, year_month DESC);--> statement-breakpoint

-- mv_expense_monthly -----------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_expense_monthly" AS
SELECT
    fe.tenant_id,
    fe.location_id,
    dd.year,
    dd.month,
    dd.year_month,
    COUNT(*)::bigint        AS entry_count,
    SUM(fe.amount)          AS total_expenses
FROM canonical.fact_expense fe
JOIN canonical.dim_date dd ON dd.date = fe.expense_date
GROUP BY
    fe.tenant_id, fe.location_id, dd.year, dd.month, dd.year_month
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_expense_monthly_pk"
    ON "analytics"."mv_expense_monthly"
    (tenant_id, location_id, year_month);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_expense_monthly_tenant"
    ON "analytics"."mv_expense_monthly" (tenant_id, year_month DESC);--> statement-breakpoint

-- mv_expense_group_monthly -----------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_expense_group_monthly" AS
SELECT
    fe.tenant_id,
    fe.location_id,
    dd.year,
    dd.month,
    dd.year_month,
    COALESCE(fe.financial_group_code, '')      AS financial_group_code,
    MAX(fe.financial_group_name)               AS financial_group_name,
    COUNT(*)::bigint        AS entry_count,
    SUM(fe.amount)          AS total_expenses
FROM canonical.fact_expense fe
JOIN canonical.dim_date dd ON dd.date = fe.expense_date
GROUP BY
    fe.tenant_id, fe.location_id, dd.year, dd.month, dd.year_month,
    COALESCE(fe.financial_group_code, '')
WITH NO DATA;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_expense_group_monthly_pk"
    ON "analytics"."mv_expense_group_monthly"
    (tenant_id, location_id, year_month, financial_group_code);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_expense_group_monthly_tenant"
    ON "analytics"."mv_expense_group_monthly" (tenant_id, year_month DESC);

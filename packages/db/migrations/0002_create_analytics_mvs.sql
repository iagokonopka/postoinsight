-- =============================================================================
-- 0002_create_analytics_mvs.sql
-- Cria o schema `analytics` e as 4 materialized views que servem os
-- dashboards (vendas, combustível, conveniência, DRE mensal).
--
-- drizzle-kit não emite DDL de MV — esta migration é mantida manualmente.
-- Todas as MVs são criadas WITH NO DATA. O worker dispara o primeiro
-- REFRESH após o backfill inicial.
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS "analytics";
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_vendas_diario
-- Grão: tenant × location × dia × segmento × categoria × grupo
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_vendas_diario" AS
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

    COUNT(*)::bigint                                                 AS qtd_itens,
    SUM(fv.qtd_venda)                                                AS qtd_total,
    SUM(fv.vlr_total)                                                AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                              AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))          AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)               AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)         AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL
GROUP BY
    fv.tenant_id, fv.location_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.segmento, fv.categoria_codigo, fv.categoria_descricao,
    fv.grupo_id, fv.grupo_descricao
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_vendas_diario_pk"
    ON "analytics"."mv_vendas_diario"
    (tenant_id, location_id, data_venda, segmento, categoria_codigo, grupo_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_vendas_diario_tenant_data"
    ON "analytics"."mv_vendas_diario" (tenant_id, data_venda DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_vendas_diario_location_data"
    ON "analytics"."mv_vendas_diario" (tenant_id, location_id, data_venda DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_vendas_diario_segmento"
    ON "analytics"."mv_vendas_diario" (tenant_id, segmento, data_venda DESC);
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_combustivel_diario
-- Grão: tenant × location × dia × produto combustível
-- Filtro: segmento = 'combustivel'
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_combustivel_diario" AS
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
    fv.categoria_codigo,
    fv.grupo_id,
    fv.grupo_descricao,

    COUNT(*)::bigint                                                 AS qtd_abastecimentos,
    SUM(fv.qtd_venda)                                                AS volume_litros,
    SUM(fv.vlr_total)                                                AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                              AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))          AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)               AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)         AS margem_bruta,

    CASE WHEN SUM(fv.qtd_venda) > 0
        THEN SUM(fv.vlr_total) / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                              AS preco_medio_litro,
    CASE WHEN SUM(fv.qtd_venda) > 0
              AND SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda) > 0
        THEN SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)
             / SUM(fv.qtd_venda)
        ELSE NULL
    END                                                              AS custo_medio_litro
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento = 'combustivel'
GROUP BY
    fv.tenant_id, fv.location_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.categoria_codigo, fv.grupo_id, fv.grupo_descricao
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_combustivel_diario_pk"
    ON "analytics"."mv_combustivel_diario"
    (tenant_id, location_id, data_venda, categoria_codigo, grupo_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_combustivel_diario_tenant_data"
    ON "analytics"."mv_combustivel_diario" (tenant_id, data_venda DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_combustivel_diario_location_data"
    ON "analytics"."mv_combustivel_diario" (tenant_id, location_id, data_venda DESC);
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_conveniencia_diario
-- Grão: tenant × location × dia × segmento × categoria × grupo
-- Filtro: segmento IN ('conveniencia','lubrificantes','servicos')
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_conveniencia_diario" AS
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

    COUNT(*)::bigint                                                 AS qtd_itens,
    SUM(fv.qtd_venda)                                                AS qtd_total,
    SUM(fv.vlr_total)                                                AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                              AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))          AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)               AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)         AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IN ('conveniencia','lubrificantes','servicos')
GROUP BY
    fv.tenant_id, fv.location_id, fv.data_venda,
    dt.ano, dt.mes, dt.ano_mes, dt.semana_ano, dt.dia_semana, dt.is_fim_de_semana,
    fv.segmento, fv.categoria_codigo, fv.categoria_descricao,
    fv.grupo_id, fv.grupo_descricao
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_conveniencia_diario_pk"
    ON "analytics"."mv_conveniencia_diario"
    (tenant_id, location_id, data_venda, segmento, categoria_codigo, grupo_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_conveniencia_diario_tenant_data"
    ON "analytics"."mv_conveniencia_diario" (tenant_id, data_venda DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_conveniencia_diario_location_data"
    ON "analytics"."mv_conveniencia_diario" (tenant_id, location_id, data_venda DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_conveniencia_diario_segmento"
    ON "analytics"."mv_conveniencia_diario" (tenant_id, segmento, data_venda DESC);
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_dre_mensal
-- Grão: tenant × location × ano_mes × segmento
-- Linha consolidada (_total) é calculada na API — não armazenada.
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_dre_mensal" AS
SELECT
    fv.tenant_id,
    fv.location_id,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    fv.segmento,

    COUNT(*)::bigint                                                 AS qtd_itens,
    SUM(fv.qtd_venda)                                                AS qtd_total,
    SUM(fv.vlr_total)                                                AS receita_bruta,
    SUM(COALESCE(fv.desconto_total, 0))                              AS descontos,
    SUM(fv.vlr_total) - SUM(COALESCE(fv.desconto_total, 0))          AS receita_liquida,
    SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)               AS cmv,
    SUM(fv.vlr_total)
        - SUM(COALESCE(fv.desconto_total, 0))
        - SUM(COALESCE(fv.custo_unitario, 0) * fv.qtd_venda)         AS margem_bruta
FROM canonical.fato_venda fv
JOIN canonical.dim_tempo dt ON dt.data = fv.data_venda
WHERE fv.segmento IS NOT NULL
GROUP BY
    fv.tenant_id, fv.location_id,
    dt.ano, dt.mes, dt.ano_mes,
    fv.segmento
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_dre_mensal_pk"
    ON "analytics"."mv_dre_mensal"
    (tenant_id, location_id, ano_mes, segmento);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_dre_mensal_tenant_periodo"
    ON "analytics"."mv_dre_mensal" (tenant_id, ano_mes DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_dre_mensal_location_periodo"
    ON "analytics"."mv_dre_mensal" (tenant_id, location_id, ano_mes DESC);

-- =============================================================================
-- 0006_create_fato_despesa.sql
-- Cria a tabela canonical.fato_despesa (despesas / baixas financeiras do
-- Status ERP — fonte TMPBI_DOCUMENTOS_BAIXADOS) e as duas materialized views
-- de analytics que alimentam o anexo de despesas no DRE.
--
-- Grão de fato_despesa: 1 linha = 1 baixa. Sem segmento (despesas não são
-- segmentadas). Classificação contábil por grupo financeiro vem no Plano 2.
-- Spec: docs/specs/despesas.md
--
-- Migration escrita à mão (drizzle-kit não emite DDL de MV; mantemos a tabela
-- aqui junto para uma única unidade de migração).
-- =============================================================================

CREATE TABLE IF NOT EXISTS "canonical"."fato_despesa" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"source_location_id" text NOT NULL,
	"data_despesa" date NOT NULL,
	"descricao" text,
	"grupo_financeiro_codigo" text,
	"grupo_financeiro_descricao" text,
	"centro_custo_codigo" text,
	"centro_custo_descricao" text,
	"operacao" text,
	"tipo_lancamento" text,
	"fornecedor_nome" text,
	"fornecedor_doc" text,
	"valor" numeric(15, 2) NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"raw_ingest_id" uuid,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fato_despesa" UNIQUE("tenant_id","location_id","source","source_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_despesa_tenant_data" ON "canonical"."fato_despesa" ("tenant_id","data_despesa");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_despesa_location_data" ON "canonical"."fato_despesa" ("location_id","data_despesa");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_despesa_grupo" ON "canonical"."fato_despesa" ("tenant_id","grupo_financeiro_codigo","data_despesa");--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_despesa_mensal
-- Grão: tenant × location × mês (sem segmento)
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_despesa_mensal" AS
SELECT
    fd.tenant_id,
    fd.location_id,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    COUNT(*)::bigint        AS qtd_lancamentos,
    SUM(fd.valor)           AS total_despesas
FROM canonical.fato_despesa fd
JOIN canonical.dim_tempo dt ON dt.data = fd.data_despesa
GROUP BY
    fd.tenant_id, fd.location_id, dt.ano, dt.mes, dt.ano_mes
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_despesa_mensal_pk"
    ON "analytics"."mv_despesa_mensal"
    (tenant_id, location_id, ano_mes);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_despesa_mensal_tenant"
    ON "analytics"."mv_despesa_mensal" (tenant_id, ano_mes DESC);
--> statement-breakpoint

-- -----------------------------------------------------------------------------
-- mv_despesa_grupo_mensal
-- Grão: tenant × location × mês × grupo financeiro
-- Usada no anexo de despesas do DRE (breakdown por grupo). COALESCE garante
-- chave única mesmo quando grupo financeiro é nulo.
-- -----------------------------------------------------------------------------
CREATE MATERIALIZED VIEW IF NOT EXISTS "analytics"."mv_despesa_grupo_mensal" AS
SELECT
    fd.tenant_id,
    fd.location_id,
    dt.ano,
    dt.mes,
    dt.ano_mes,
    COALESCE(fd.grupo_financeiro_codigo, '')      AS grupo_financeiro_codigo,
    MAX(fd.grupo_financeiro_descricao)            AS grupo_financeiro_descricao,
    COUNT(*)::bigint        AS qtd_lancamentos,
    SUM(fd.valor)           AS total_despesas
FROM canonical.fato_despesa fd
JOIN canonical.dim_tempo dt ON dt.data = fd.data_despesa
GROUP BY
    fd.tenant_id, fd.location_id, dt.ano, dt.mes, dt.ano_mes,
    COALESCE(fd.grupo_financeiro_codigo, '')
WITH NO DATA;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_mv_despesa_grupo_mensal_pk"
    ON "analytics"."mv_despesa_grupo_mensal"
    (tenant_id, location_id, ano_mes, grupo_financeiro_codigo);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_mv_despesa_grupo_mensal_tenant"
    ON "analytics"."mv_despesa_grupo_mensal" (tenant_id, ano_mes DESC);

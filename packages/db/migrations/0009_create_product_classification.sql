-- =============================================================================
-- 0009_create_product_classification.sql
-- Cria a tabela app.product_classification — camada de curadoria de apresentação
-- de produtos (rótulo, agrupamento de display, segmento, visibilidade),
-- tenant-scoped.
--
-- Override NÃO-DESTRUTIVO aplicado em tempo de leitura nas telas Combustível e
-- Conveniência: canonical/raw nunca são reescritos; re-sync do ERP nunca apaga.
--
-- classification_key = "<nível>:<código>" (ex "product:6", "group:154").
-- segment_override é validado na aplicação (reusa Segment), não como enum nativo,
-- para evoluir sem DDL. Valores persistidos em PT (ADR-018).
--
-- Migration escrita à mão (padrão da 0007). Spec: docs/specs/produto-classificacao.md
-- =============================================================================

CREATE TABLE IF NOT EXISTS "app"."product_classification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"classification_key" text NOT NULL,
	"segment_override" text,
	"display_group" text,
	"custom_label" text,
	"visible" boolean DEFAULT true NOT NULL,
	"sort_order" integer,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_product_classification" UNIQUE("tenant_id","classification_key"),
	CONSTRAINT "fk_product_classification_tenant"
		FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_classification_tenant"
	ON "app"."product_classification" ("tenant_id");

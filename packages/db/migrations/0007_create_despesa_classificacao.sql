-- =============================================================================
-- 0007_create_despesa_classificacao.sql
-- Cria a tabela app.despesa_classificacao — camada de classificação contábil
-- de despesas por grupo financeiro, tenant-scoped.
--
-- Override NÃO-DESTRUTIVO aplicado em tempo de leitura no DRE: canonical/raw
-- nunca são reescritos. Cada grupo financeiro recebe um accounting_type que
-- decide se entra (despesa_operacional) ou não no Resultado Operacional.
--
-- accounting_type é validado na aplicação (não como enum nativo) para evoluir
-- sem DDL. Chave = grupo_financeiro_codigo (a mv_despesa_grupo_mensal já faz
-- COALESCE(codigo, '') — grupos sem código usam string vazia '').
--
-- Migration escrita à mão (padrão da 0006). Spec: docs/specs/admin-mapping.md
-- =============================================================================

CREATE TABLE IF NOT EXISTS "app"."despesa_classificacao" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"grupo_financeiro_codigo" text NOT NULL,
	"accounting_type" text NOT NULL,
	"custom_label" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_despesa_classificacao" UNIQUE("tenant_id","grupo_financeiro_codigo"),
	CONSTRAINT "fk_despesa_classificacao_tenant"
		FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_despesa_classificacao_tenant"
	ON "app"."despesa_classificacao" ("tenant_id");

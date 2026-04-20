CREATE SCHEMA "app";
--> statement-breakpoint
CREATE SCHEMA "raw";
--> statement-breakpoint
CREATE SCHEMA "canonical";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "app"."user_role" AS ENUM('owner', 'manager', 'viewer');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp with time zone,
	"token_type" text,
	"scope" text,
	"id_token" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"posto_id" uuid NOT NULL,
	"erp_source" text NOT NULL,
	"agent_token" text NOT NULL,
	"credentials" jsonb NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_seen_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "connectors_agent_token_unique" UNIQUE("agent_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."postos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"source_posto_id" text NOT NULL,
	"erp_source" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."sync_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"posto_id" uuid NOT NULL,
	"erp_source" text NOT NULL,
	"entity" text NOT NULL,
	"job_type" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"rows_ingested" text,
	"rows_rejected" text,
	"error_message" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."sync_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"posto_id" uuid NOT NULL,
	"erp_source" text NOT NULL,
	"entity" text NOT NULL,
	"last_synced_at" timestamp with time zone,
	"backfill_completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."tenant_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "app"."user_role" DEFAULT 'viewer' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tenants_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "raw"."raw_ingest" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"posto_id" uuid NOT NULL,
	"connector_id" uuid NOT NULL,
	"erp_source" text NOT NULL,
	"entity" text NOT NULL,
	"job_id" text NOT NULL,
	"batch_number" text,
	"payload" jsonb NOT NULL,
	"processed_at" timestamp with time zone,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."dim_produto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_produto_id" text NOT NULL,
	"nome" text NOT NULL,
	"nome_resumido" text,
	"categoria_codigo" text NOT NULL,
	"categoria_descricao" text,
	"grupo_id" integer NOT NULL,
	"grupo_descricao" text,
	"subgrupo_id" integer,
	"subgrupo_descricao" text,
	"tipo_produto" text,
	"unidade_venda" text,
	"is_combustivel" boolean NOT NULL,
	"segmento" text,
	"ativo" boolean DEFAULT true NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"is_current" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."dim_tempo" (
	"data" date PRIMARY KEY NOT NULL,
	"ano" smallint NOT NULL,
	"mes" smallint NOT NULL,
	"dia" smallint NOT NULL,
	"ano_mes" text NOT NULL,
	"trimestre" smallint NOT NULL,
	"semana_ano" smallint NOT NULL,
	"dia_semana" smallint NOT NULL,
	"nome_dia_semana" text NOT NULL,
	"nome_mes" text NOT NULL,
	"is_fim_de_semana" boolean NOT NULL,
	"is_feriado" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."fato_venda" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"posto_id" uuid NOT NULL,
	"source_posto_id" text NOT NULL,
	"data_venda" date NOT NULL,
	"hora_venda" time,
	"turno" text,
	"nr_nota" text,
	"source_produto_id" text NOT NULL,
	"descricao_produto" text NOT NULL,
	"categoria_codigo" text NOT NULL,
	"categoria_descricao" text,
	"grupo_id" integer NOT NULL,
	"grupo_descricao" text,
	"subgrupo_id" integer,
	"subgrupo_descricao" text,
	"is_combustivel" boolean NOT NULL,
	"segmento" text,
	"qtd_venda" numeric(15, 4) NOT NULL,
	"vlr_unitario" numeric(15, 4) NOT NULL,
	"vlr_total" numeric(15, 4) NOT NULL,
	"custo_unitario" numeric(15, 4),
	"desconto_total" numeric(15, 4),
	"acrescimo_total" numeric(15, 4),
	"bico_codigo" integer,
	"bico_descricao" text,
	"tanque_codigo" text,
	"tanque_descricao" text,
	"source_cliente_id" text,
	"source_funcionario_id" text,
	"forma_pagamento_tipo" text,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fato_venda" UNIQUE("tenant_id","posto_id","source","source_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_raw_ingest_unprocessed" ON "raw"."raw_ingest" ("processed_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dim_produto_current" ON "canonical"."dim_produto" ("tenant_id","source","source_produto_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dim_produto_lookup" ON "canonical"."dim_produto" ("tenant_id","source","source_produto_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_venda_tenant_data" ON "canonical"."fato_venda" ("tenant_id","data_venda");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_venda_posto_data" ON "canonical"."fato_venda" ("posto_id","data_venda");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_venda_segmento" ON "canonical"."fato_venda" ("tenant_id","segmento","data_venda");
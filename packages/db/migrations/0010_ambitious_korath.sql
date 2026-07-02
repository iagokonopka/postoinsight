DO $$ BEGIN
 CREATE TYPE "app"."token_purpose" AS ENUM('activation', 'reset', 'login');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."expense_classification" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"financial_group_code" text NOT NULL,
	"accounting_type" text NOT NULL,
	"custom_label" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_expense_classification" UNIQUE("tenant_id","financial_group_code")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."one_time_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"purpose" "app"."token_purpose" NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_by" uuid,
	"request_ip" text,
	"request_user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "one_time_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
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
	CONSTRAINT "uq_product_classification" UNIQUE("tenant_id","classification_key")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."dim_date" (
	"date" date PRIMARY KEY NOT NULL,
	"year" smallint NOT NULL,
	"month" smallint NOT NULL,
	"day" smallint NOT NULL,
	"year_month" text NOT NULL,
	"quarter" smallint NOT NULL,
	"week_of_year" smallint NOT NULL,
	"day_of_week" smallint NOT NULL,
	"day_of_week_name" text NOT NULL,
	"month_name" text NOT NULL,
	"is_weekend" boolean NOT NULL,
	"is_holiday" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."dim_product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"source" text NOT NULL,
	"source_location_id" text NOT NULL,
	"source_product_id" text NOT NULL,
	"name" text NOT NULL,
	"short_name" text,
	"category_code" text NOT NULL,
	"category_name" text,
	"group_id" integer NOT NULL,
	"group_name" text,
	"subgroup_id" integer,
	"subgroup_name" text,
	"product_type" text,
	"sale_unit" text,
	"location_id" uuid,
	"is_fuel" boolean NOT NULL,
	"segment" text,
	"active" boolean DEFAULT true NOT NULL,
	"valid_from" date NOT NULL,
	"valid_to" date,
	"is_current" boolean DEFAULT true NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."fact_expense" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"source_location_id" text NOT NULL,
	"expense_date" date NOT NULL,
	"description" text,
	"financial_group_code" text,
	"financial_group_name" text,
	"cost_center_code" text,
	"cost_center_name" text,
	"operation" text,
	"entry_type" text,
	"supplier_name" text,
	"supplier_doc" text,
	"amount" numeric(15, 2) NOT NULL,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"raw_ingest_id" uuid,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "uq_fact_expense" UNIQUE("tenant_id","location_id","source","source_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "canonical"."fact_sale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"source_location_id" text NOT NULL,
	"sale_date" date NOT NULL,
	"sale_time" time,
	"shift" text,
	"invoice_number" text,
	"source_product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"category_code" text NOT NULL,
	"category_name" text,
	"group_id" integer NOT NULL,
	"group_name" text,
	"subgroup_id" integer,
	"subgroup_name" text,
	"is_fuel" boolean NOT NULL,
	"segment" text,
	"quantity" numeric(15, 4) NOT NULL,
	"unit_value" numeric(15, 4) NOT NULL,
	"total_value" numeric(15, 4) NOT NULL,
	"unit_cost" numeric(15, 4),
	"discount_total" numeric(15, 4),
	"surcharge_total" numeric(15, 4),
	"nozzle_code" integer,
	"nozzle_name" text,
	"tank_code" text,
	"tank_name" text,
	"source_customer_id" text,
	"source_employee_id" text,
	"payment_method_type" text,
	"source" text NOT NULL,
	"source_id" text NOT NULL,
	"synced_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw_ingest_id" uuid,
	"reprocessed_at" timestamp with time zone,
	"reprocess_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "uq_fact_sale" UNIQUE("tenant_id","location_id","source","source_id")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."expense_classification" ADD CONSTRAINT "expense_classification_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."one_time_tokens" ADD CONSTRAINT "one_time_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."product_classification" ADD CONSTRAINT "product_classification_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_expense_classification_tenant" ON "app"."expense_classification" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_one_time_tokens_user_purpose" ON "app"."one_time_tokens" ("user_id","purpose");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_one_time_tokens_expires" ON "app"."one_time_tokens" ("expires_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_product_classification_tenant" ON "app"."product_classification" ("tenant_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dim_product_current" ON "canonical"."dim_product" ("tenant_id","source","source_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_dim_product_lookup" ON "canonical"."dim_product" ("tenant_id","source","source_product_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_expense_tenant_date" ON "canonical"."fact_expense" ("tenant_id","expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_expense_location_date" ON "canonical"."fact_expense" ("location_id","expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_expense_group" ON "canonical"."fact_expense" ("tenant_id","financial_group_code","expense_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_sale_tenant_date" ON "canonical"."fact_sale" ("tenant_id","sale_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_sale_location_date" ON "canonical"."fact_sale" ("location_id","sale_date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fact_sale_segment" ON "canonical"."fact_sale" ("tenant_id","segment","sale_date");
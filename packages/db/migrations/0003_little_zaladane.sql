CREATE SCHEMA "analytics";
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "app"."erp_source" AS ENUM('status', 'webposto');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "app"."sync_job_status" AS ENUM('pending', 'running', 'success', 'error');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "app"."sync_job_trigger" AS ENUM('scheduler', 'user', 'backfill');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "app"."sync_job_type" AS ENUM('incremental', 'backfill', 'full_sync');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"actor_user_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_entity" text,
	"target_id" uuid,
	"payload_before" jsonb,
	"payload_after" jsonb,
	"ip_address" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."connector_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"connector_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "app"."user_role" DEFAULT 'viewer' NOT NULL,
	"location_id" uuid,
	"token" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."login_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid,
	"logged_in_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."sync_rejections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sync_job_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"erp_source" "app"."erp_source" NOT NULL,
	"source_id" text,
	"raw_payload" jsonb,
	"rejection_reason" text NOT NULL,
	"rejected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."usage_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"metadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "app"."accounts" ALTER COLUMN "expires_at" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app"."connectors" ALTER COLUMN "erp_source" SET DATA TYPE erp_source;--> statement-breakpoint
ALTER TABLE "app"."locations" ALTER COLUMN "erp_source" SET DATA TYPE erp_source;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ALTER COLUMN "erp_source" SET DATA TYPE erp_source;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ALTER COLUMN "job_type" SET DATA TYPE sync_job_type;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ALTER COLUMN "status" SET DATA TYPE sync_job_status;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ALTER COLUMN "rows_ingested" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ALTER COLUMN "rows_rejected" SET DATA TYPE integer;--> statement-breakpoint
ALTER TABLE "app"."sync_state" ALTER COLUMN "erp_source" SET DATA TYPE erp_source;--> statement-breakpoint
ALTER TABLE "app"."connectors" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."connectors" ADD COLUMN "last_sync_attempt_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."connectors" ADD COLUMN "last_sync_success_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."connectors" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."locations" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."locations" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."platform_users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "triggered_by" "app"."sync_job_trigger" DEFAULT 'scheduler' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "triggered_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "period_from" date;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "period_to" date;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "retry_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "created_by" uuid;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "deactivated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "deactivated_by" uuid;--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "plan" text DEFAULT 'trial' NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "trial_ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "cancel_reason" text;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "onboarding_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "app"."tenants" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "last_login_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "failed_login_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "locked_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "canonical"."dim_produto" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" ADD COLUMN "raw_ingest_id" uuid;--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" ADD COLUMN "reprocessed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" ADD COLUMN "reprocess_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."login_history" ADD CONSTRAINT "login_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_log_tenant_created" ON "app"."audit_log" ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_audit_log_actor" ON "app"."audit_log" ("actor_user_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_connector_events_connector" ON "app"."connector_events" ("connector_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_connector_events_tenant" ON "app"."connector_events" ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_login_history_user" ON "app"."login_history" ("user_id","logged_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_login_history_tenant" ON "app"."login_history" ("tenant_id","logged_in_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_rejections_job" ON "app"."sync_rejections" ("sync_job_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_rejections_tenant" ON "app"."sync_rejections" ("tenant_id","rejected_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_events_tenant" ON "app"."usage_events" ("tenant_id","occurred_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_usage_events_user" ON "app"."usage_events" ("user_id","occurred_at");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."tenant_users" ADD CONSTRAINT "tenant_users_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "app"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "app"."tenant_users" ADD CONSTRAINT "tenant_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_jobs_tenant_created" ON "app"."sync_jobs" ("tenant_id","created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_sync_jobs_location_entity" ON "app"."sync_jobs" ("location_id","entity","created_at");--> statement-breakpoint
ALTER TABLE "app"."connectors" ADD CONSTRAINT "uq_connectors_location_erp" UNIQUE("location_id","erp_source");--> statement-breakpoint
ALTER TABLE "app"."sync_state" ADD CONSTRAINT "uq_sync_state_location_entity" UNIQUE("location_id","entity");--> statement-breakpoint
ALTER TABLE "app"."tenant_users" ADD CONSTRAINT "uq_tenant_users_tenant_user" UNIQUE("tenant_id","user_id");
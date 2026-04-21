DO $$ BEGIN
 CREATE TYPE "app"."platform_role" AS ENUM('superadmin', 'support');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "app"."platform_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform_role" "app"."platform_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "platform_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "app"."postos" RENAME TO "locations";--> statement-breakpoint
ALTER TABLE "app"."connectors" RENAME COLUMN "posto_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "app"."locations" RENAME COLUMN "source_posto_id" TO "source_location_id";--> statement-breakpoint
ALTER TABLE "app"."sync_jobs" RENAME COLUMN "posto_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "app"."sync_state" RENAME COLUMN "posto_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "raw"."raw_ingest" RENAME COLUMN "posto_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" RENAME COLUMN "posto_id" TO "location_id";--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" RENAME COLUMN "source_posto_id" TO "source_location_id";--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" DROP CONSTRAINT "uq_fato_venda";--> statement-breakpoint
DROP INDEX IF EXISTS "idx_fato_venda_posto_data";--> statement-breakpoint
ALTER TABLE "canonical"."dim_produto" ADD COLUMN "source_location_id" text NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_fato_venda_location_data" ON "canonical"."fato_venda" ("location_id","data_venda");--> statement-breakpoint
ALTER TABLE "canonical"."fato_venda" ADD CONSTRAINT "uq_fato_venda" UNIQUE("tenant_id","location_id","source","source_id");
ALTER TABLE "app"."login_history" ADD COLUMN "success" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."sync_state" ADD COLUMN "next_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "password_changed_at" timestamp with time zone;
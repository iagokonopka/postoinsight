ALTER TABLE "app"."accounts" ADD CONSTRAINT "accounts_pkey" PRIMARY KEY("provider","provider_account_id");--> statement-breakpoint
ALTER TABLE "app"."verification_tokens" ADD CONSTRAINT "verification_tokens_pkey" PRIMARY KEY("identifier","token");--> statement-breakpoint
ALTER TABLE "app"."login_history" ADD COLUMN "success" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "app"."sync_state" ADD COLUMN "next_run_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "app"."users" ADD COLUMN "password_changed_at" timestamp with time zone;
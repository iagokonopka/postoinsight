-- Migration 0005: corrige unique constraint de sync_state para incluir erp_source
--
-- Problema: a constraint anterior cobria apenas (location_id, entity),
-- o que impediria uma mesma location ter sync_state para dois ERPs diferentes
-- (ex: status + webposto na mesma unidade).
--
-- Solução: dropar a constraint antiga e criar nova cobrindo (location_id, erp_source, entity).

ALTER TABLE "app"."sync_state" DROP CONSTRAINT IF EXISTS "uq_sync_state_location_entity";--> statement-breakpoint
ALTER TABLE "app"."sync_state" ADD CONSTRAINT "uq_sync_state_location_erp_entity" UNIQUE("location_id","erp_source","entity");

import { pgSchema, uuid, text, jsonb, timestamp, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const rawSchema = pgSchema('raw')

export const rawIngest = rawSchema.table('raw_ingest', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull(),
  postoId:     uuid('posto_id').notNull(),
  connectorId: uuid('connector_id').notNull(),
  erpSource:   text('erp_source').notNull(),
  entity:      text('entity').notNull(),
  jobId:       text('job_id').notNull(),
  batchNumber: text('batch_number'),
  payload:     jsonb('payload').notNull(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  receivedAt:  timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_raw_ingest_unprocessed').on(t.processedAt).where(sql`${t.processedAt} IS NULL`),
])

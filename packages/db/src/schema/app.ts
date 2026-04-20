import { pgSchema, uuid, text, boolean, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core'

export const appSchema = pgSchema('app')

export const userRoleEnum = appSchema.enum('user_role', ['owner', 'manager', 'viewer'])

export const tenants = appSchema.table('tenants', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      text('name').notNull(),
  slug:      text('slug').notNull().unique(),
  active:    boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const postos = appSchema.table('postos', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id').notNull(),
  name:          text('name').notNull(),
  address:       text('address'),
  sourcePostoId: text('source_posto_id').notNull(),
  erpSource:     text('erp_source').notNull(),
  active:        boolean('active').notNull().default(true),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const users = appSchema.table('users', {
  id:            uuid('id').primaryKey().defaultRandom(),
  name:          text('name'),
  email:         text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true }),
  image:         text('image'),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:     timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const accounts = appSchema.table('accounts', {
  userId:            uuid('user_id').notNull(),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken:      text('refresh_token'),
  accessToken:       text('access_token'),
  expiresAt:         timestamp('expires_at', { withTimezone: true }),
  tokenType:         text('token_type'),
  scope:             text('scope'),
  idToken:           text('id_token'),
})

export const sessions = appSchema.table('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId:       uuid('user_id').notNull(),
  expires:      timestamp('expires', { withTimezone: true }).notNull(),
})

export const verificationTokens = appSchema.table('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { withTimezone: true }).notNull(),
})

export const tenantUsers = appSchema.table('tenant_users', {
  id:       uuid('id').primaryKey().defaultRandom(),
  tenantId: uuid('tenant_id').notNull(),
  userId:   uuid('user_id').notNull(),
  role:     userRoleEnum('role').notNull().default('viewer'),
  active:   boolean('active').notNull().default(true),
})

export const connectors = appSchema.table('connectors', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull(),
  postoId:     uuid('posto_id').notNull(),
  erpSource:   text('erp_source').notNull(),
  agentToken:  text('agent_token').notNull().unique(),
  credentials: jsonb('credentials').notNull(),
  active:      boolean('active').notNull().default(true),
  lastSeenAt:  timestamp('last_seen_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const syncState = appSchema.table('sync_state', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  tenantId:            uuid('tenant_id').notNull(),
  postoId:             uuid('posto_id').notNull(),
  erpSource:           text('erp_source').notNull(),
  entity:              text('entity').notNull(),
  lastSyncedAt:        timestamp('last_synced_at', { withTimezone: true }),
  backfillCompletedAt: timestamp('backfill_completed_at', { withTimezone: true }),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const syncJobs = appSchema.table('sync_jobs', {
  id:            uuid('id').primaryKey().defaultRandom(),
  tenantId:      uuid('tenant_id').notNull(),
  postoId:       uuid('posto_id').notNull(),
  erpSource:     text('erp_source').notNull(),
  entity:        text('entity').notNull(),
  jobType:       text('job_type').notNull(),
  status:        text('status').notNull().default('pending'),
  rowsIngested:  text('rows_ingested'),
  rowsRejected:  text('rows_rejected'),
  errorMessage:  text('error_message'),
  startedAt:     timestamp('started_at', { withTimezone: true }),
  completedAt:   timestamp('completed_at', { withTimezone: true }),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

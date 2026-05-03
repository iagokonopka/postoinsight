import {
  pgSchema, uuid, text, boolean, timestamp, jsonb, integer, date,
  unique, index, primaryKey,
} from 'drizzle-orm/pg-core'
import type { PgTableExtraConfig } from 'drizzle-orm/pg-core/table'

export const appSchema = pgSchema('app')

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const userRoleEnum = appSchema.enum('user_role', ['owner', 'manager', 'viewer'])
export const platformRoleEnum = appSchema.enum('platform_role', ['superadmin', 'support'])
export const erpSourceEnum = appSchema.enum('erp_source', ['status', 'webposto'])
export const syncJobStatusEnum = appSchema.enum('sync_job_status', ['pending', 'running', 'success', 'error'])
export const syncJobTypeEnum = appSchema.enum('sync_job_type', ['incremental', 'backfill', 'full_sync'])
export const syncJobTriggerEnum = appSchema.enum('sync_job_trigger', ['scheduler', 'user', 'backfill'])

// ---------------------------------------------------------------------------
// tenants
// ---------------------------------------------------------------------------
export const tenants = appSchema.table('tenants', {
  id:                      uuid('id').primaryKey().defaultRandom(),
  name:                    text('name').notNull(),
  slug:                    text('slug').notNull().unique(),
  active:                  boolean('active').notNull().default(true),
  plan:                    text('plan').notNull().default('trial'),
  trialEndsAt:             timestamp('trial_ends_at', { withTimezone: true }),
  cancelledAt:             timestamp('cancelled_at', { withTimezone: true }),
  cancelReason:            text('cancel_reason'),
  onboardingCompletedAt:   timestamp('onboarding_completed_at', { withTimezone: true }),
  metadata:                jsonb('metadata'),
  deletedAt:               timestamp('deleted_at', { withTimezone: true }),
  createdAt:               timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:               timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// locations
// ---------------------------------------------------------------------------
export const locations = appSchema.table('locations', {
  id:               uuid('id').primaryKey().defaultRandom(),
  tenantId:         uuid('tenant_id').notNull(),
  name:             text('name').notNull(),
  address:          text('address'),
  sourceLocationId: text('source_location_id').notNull(),
  erpSource:        erpSourceEnum('erp_source').notNull(),
  active:           boolean('active').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt:        timestamp('deleted_at', { withTimezone: true }),
})

// ---------------------------------------------------------------------------
// users
// ---------------------------------------------------------------------------
export const users = appSchema.table('users', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  name:                 text('name'),
  email:                text('email').notNull().unique(),
  emailVerified:        timestamp('email_verified', { withTimezone: true }),
  image:                text('image'),
  passwordHash:         text('password_hash'),
  active:               boolean('active').notNull().default(true),
  lastLoginAt:          timestamp('last_login_at', { withTimezone: true }),
  /** Quando a senha foi trocada pela última vez — null = nunca trocou desde o seed */
  passwordChangedAt:    timestamp('password_changed_at', { withTimezone: true }),
  failedLoginAttempts:  integer('failed_login_attempts').notNull().default(0),
  lockedUntil:          timestamp('locked_until', { withTimezone: true }),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// accounts (Auth.js)
// ---------------------------------------------------------------------------
export const accounts = appSchema.table('accounts', {
  userId:            uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type:              text('type').notNull(),
  provider:          text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken:      text('refresh_token'),
  accessToken:       text('access_token'),
  expiresAt:         integer('expires_at'),
  tokenType:         text('token_type'),
  scope:             text('scope'),
  idToken:           text('id_token'),
}, (t): PgTableExtraConfig => ({
  accountsPkey: primaryKey({ name: 'accounts_pkey', columns: [t.provider, t.providerAccountId] }),
}))

// ---------------------------------------------------------------------------
// sessions (Auth.js)
// ---------------------------------------------------------------------------
export const sessions = appSchema.table('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires', { withTimezone: true }).notNull(),
})

// ---------------------------------------------------------------------------
// verificationTokens (Auth.js)
// ---------------------------------------------------------------------------
export const verificationTokens = appSchema.table('verification_tokens', {
  identifier: text('identifier').notNull(),
  token:      text('token').notNull(),
  expires:    timestamp('expires', { withTimezone: true }).notNull(),
}, (t): PgTableExtraConfig => ({
  verificationTokensPkey: primaryKey({ name: 'verification_tokens_pkey', columns: [t.identifier, t.token] }),
}))

// ---------------------------------------------------------------------------
// tenantUsers
// ---------------------------------------------------------------------------
export const tenantUsers = appSchema.table('tenant_users', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  userId:         uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role:           userRoleEnum('role').notNull().default('viewer'),
  active:         boolean('active').notNull().default(true),
  locationId:     uuid('location_id'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy:      uuid('created_by'),
  updatedBy:      uuid('updated_by'),
  deactivatedAt:  timestamp('deactivated_at', { withTimezone: true }),
  deactivatedBy:  uuid('deactivated_by'),
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),
}, (t): PgTableExtraConfig => ({
  uqTenantUsersTenantUser: unique('uq_tenant_users_tenant_user').on(t.tenantId, t.userId),
}))

// ---------------------------------------------------------------------------
// platformUsers
// ---------------------------------------------------------------------------
export const platformUsers = appSchema.table('platform_users', {
  id:           uuid('id').primaryKey().defaultRandom(),
  userId:       uuid('user_id').notNull().unique(),
  platformRole: platformRoleEnum('platform_role').notNull(),
  createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// connectors
// ---------------------------------------------------------------------------
export const connectors = appSchema.table('connectors', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  tenantId:            uuid('tenant_id').notNull(),
  locationId:          uuid('location_id').notNull(),
  erpSource:           erpSourceEnum('erp_source').notNull(),
  agentToken:          text('agent_token').notNull().unique(),
  credentials:         jsonb('credentials').notNull(),
  active:              boolean('active').notNull().default(true),
  lastSeenAt:          timestamp('last_seen_at', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastSyncAttemptAt:   timestamp('last_sync_attempt_at', { withTimezone: true }),
  lastSyncSuccessAt:   timestamp('last_sync_success_at', { withTimezone: true }),
  deletedAt:           timestamp('deleted_at', { withTimezone: true }),
}, (t): PgTableExtraConfig => ({
  uqConnectorsLocationErp: unique('uq_connectors_location_erp').on(t.locationId, t.erpSource),
}))

// ---------------------------------------------------------------------------
// syncState
// ---------------------------------------------------------------------------
export const syncState = appSchema.table('sync_state', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  tenantId:            uuid('tenant_id').notNull(),
  locationId:          uuid('location_id').notNull(),
  erpSource:           erpSourceEnum('erp_source').notNull(),
  entity:              text('entity').notNull(),
  lastSyncedAt:        timestamp('last_synced_at', { withTimezone: true }),
  backfillCompletedAt: timestamp('backfill_completed_at', { withTimezone: true }),
  /** Próxima execução agendada — populada pelo pipeline após cada sync bem-sucedida */
  nextRunAt:           timestamp('next_run_at', { withTimezone: true }),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t): PgTableExtraConfig => ({
  uqSyncStateLocationErpEntity: unique('uq_sync_state_location_erp_entity').on(t.locationId, t.erpSource, t.entity),
}))

// ---------------------------------------------------------------------------
// syncJobs
// ---------------------------------------------------------------------------
export const syncJobs = appSchema.table('sync_jobs', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  tenantId:           uuid('tenant_id').notNull(),
  locationId:         uuid('location_id').notNull(),
  erpSource:          erpSourceEnum('erp_source').notNull(),
  entity:             text('entity').notNull(),
  jobType:            syncJobTypeEnum('job_type').notNull(),
  status:             syncJobStatusEnum('status').notNull().default('pending'),
  rowsIngested:       integer('rows_ingested'),
  rowsRejected:       integer('rows_rejected'),
  errorMessage:       text('error_message'),
  startedAt:          timestamp('started_at', { withTimezone: true }),
  completedAt:        timestamp('completed_at', { withTimezone: true }),
  triggeredBy:        syncJobTriggerEnum('triggered_by').notNull().default('scheduler'),
  triggeredByUserId:  uuid('triggered_by_user_id'),
  periodFrom:         date('period_from'),
  periodTo:           date('period_to'),
  retryCount:         integer('retry_count').notNull().default(0),
  metadata:           jsonb('metadata'),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t): PgTableExtraConfig => ({
  idxSyncJobsTenantCreated:    index('idx_sync_jobs_tenant_created').on(t.tenantId, t.createdAt),
  idxSyncJobsLocationEntity:   index('idx_sync_jobs_location_entity').on(t.locationId, t.entity, t.createdAt),
}))

// ---------------------------------------------------------------------------
// invitations
// ---------------------------------------------------------------------------
export const invitations = appSchema.table('invitations', {
  id:          uuid('id').primaryKey().defaultRandom(),
  tenantId:    uuid('tenant_id').notNull().references(() => tenants.id, { onDelete: 'cascade' }),
  email:       text('email').notNull(),
  role:        userRoleEnum('role').notNull().default('viewer'),
  locationId:  uuid('location_id'),
  token:       text('token').notNull().unique(),
  invitedBy:   uuid('invited_by').notNull(),
  expiresAt:   timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt:  timestamp('accepted_at', { withTimezone: true }),
  createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

// ---------------------------------------------------------------------------
// auditLog
// ---------------------------------------------------------------------------
export const auditLog = appSchema.table('audit_log', {
  id:             uuid('id').primaryKey().defaultRandom(),
  tenantId:       uuid('tenant_id'),
  actorUserId:    uuid('actor_user_id').notNull(),
  action:         text('action').notNull(),
  targetEntity:   text('target_entity'),
  targetId:       uuid('target_id'),
  payloadBefore:  jsonb('payload_before'),
  payloadAfter:   jsonb('payload_after'),
  ipAddress:      text('ip_address'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t): PgTableExtraConfig => ({
  idxAuditLogTenantCreated: index('idx_audit_log_tenant_created').on(t.tenantId, t.createdAt),
  idxAuditLogActor:         index('idx_audit_log_actor').on(t.actorUserId, t.createdAt),
}))

// ---------------------------------------------------------------------------
// loginHistory
// ---------------------------------------------------------------------------
export const loginHistory = appSchema.table('login_history', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tenantId:    uuid('tenant_id'),
  loggedInAt:  timestamp('logged_in_at', { withTimezone: true }).notNull().defaultNow(),
  ipAddress:   text('ip_address'),
  userAgent:   text('user_agent'),
  /** true = login bem-sucedido, false = credenciais inválidas ou conta bloqueada */
  success:     boolean('success').notNull().default(true),
}, (t): PgTableExtraConfig => ({
  idxLoginHistoryUser:   index('idx_login_history_user').on(t.userId, t.loggedInAt),
  idxLoginHistoryTenant: index('idx_login_history_tenant').on(t.tenantId, t.loggedInAt),
}))

// ---------------------------------------------------------------------------
// connectorEvents
// ---------------------------------------------------------------------------
export const connectorEvents = appSchema.table('connector_events', {
  id:           uuid('id').primaryKey().defaultRandom(),
  connectorId:  uuid('connector_id').notNull(),
  tenantId:     uuid('tenant_id').notNull(),
  locationId:   uuid('location_id').notNull(),
  eventType:    text('event_type').notNull(),
  occurredAt:   timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  metadata:     jsonb('metadata'),
}, (t): PgTableExtraConfig => ({
  idxConnectorEventsConnector: index('idx_connector_events_connector').on(t.connectorId, t.occurredAt),
  idxConnectorEventsTenant:    index('idx_connector_events_tenant').on(t.tenantId, t.occurredAt),
}))

// ---------------------------------------------------------------------------
// syncRejections
// ---------------------------------------------------------------------------
export const syncRejections = appSchema.table('sync_rejections', {
  id:               uuid('id').primaryKey().defaultRandom(),
  syncJobId:        uuid('sync_job_id').notNull(),
  tenantId:         uuid('tenant_id').notNull(),
  locationId:       uuid('location_id').notNull(),
  erpSource:        erpSourceEnum('erp_source').notNull(),
  sourceId:         text('source_id'),
  rawPayload:       jsonb('raw_payload'),
  rejectionReason:  text('rejection_reason').notNull(),
  rejectedAt:       timestamp('rejected_at', { withTimezone: true }).notNull().defaultNow(),
}, (t): PgTableExtraConfig => ({
  idxSyncRejectionsJob:    index('idx_sync_rejections_job').on(t.syncJobId),
  idxSyncRejectionsTenant: index('idx_sync_rejections_tenant').on(t.tenantId, t.rejectedAt),
}))

// ---------------------------------------------------------------------------
// usageEvents
// ---------------------------------------------------------------------------
export const usageEvents = appSchema.table('usage_events', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull(),
  tenantId:    uuid('tenant_id').notNull(),
  eventType:   text('event_type').notNull(),
  occurredAt:  timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow(),
  metadata:    jsonb('metadata'),
}, (t): PgTableExtraConfig => ({
  idxUsageEventsTenant: index('idx_usage_events_tenant').on(t.tenantId, t.occurredAt),
  idxUsageEventsUser:   index('idx_usage_events_user').on(t.userId, t.occurredAt),
}))
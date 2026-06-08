import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { syncJobs } from '@postoinsight/db'

/**
 * Ciclo de vida de sync_jobs — torna o sync observável.
 *
 * Convenção: o `job_id` gerado no disparo (sync/trigger, backfill) é usado como
 * a PK `sync_jobs.id`. Assim as mensagens `done`/`error` do agente, que carregam
 * apenas o `job_id`, localizam a linha diretamente por id.
 *
 * Sem isso, a tela de Sincronização lia uma tabela vazia ("sync do quê, desde
 * quando"). Cada disparo agora cria uma linha `running`, finalizada em
 * `success` (com nº de registros) ou `error` (com mensagem).
 */

type Trigger = 'scheduler' | 'user' | 'backfill'
type JobType = 'incremental' | 'backfill' | 'full_sync'

export async function startSyncJob(params: {
  jobId: string
  tenantId: string
  locationId: string
  erpSource: 'status' | 'webposto'
  entity: string
  jobType: JobType
  triggeredBy: Trigger
  triggeredByUserId?: string | null
  periodFrom?: string | null
  periodTo?: string | null
  watermark?: string | null
}): Promise<void> {
  await db.insert(syncJobs).values({
    id:                params.jobId,
    tenantId:          params.tenantId,
    locationId:        params.locationId,
    erpSource:         params.erpSource,
    entity:            params.entity,
    jobType:           params.jobType,
    status:            'running',
    startedAt:         new Date(),
    triggeredBy:       params.triggeredBy,
    triggeredByUserId: params.triggeredByUserId ?? null,
    periodFrom:        params.periodFrom ?? null,
    periodTo:          params.periodTo ?? null,
    metadata:          params.watermark ? { watermark: params.watermark } : null,
  }).onConflictDoNothing()
}

export async function completeSyncJob(jobId: string, rowsIngested: number): Promise<void> {
  await db
    .update(syncJobs)
    .set({ status: 'success', completedAt: new Date(), rowsIngested })
    .where(eq(syncJobs.id, jobId))
}

export async function failSyncJob(jobId: string, message: string): Promise<void> {
  await db
    .update(syncJobs)
    .set({ status: 'error', completedAt: new Date(), errorMessage: message.slice(0, 2000) })
    .where(eq(syncJobs.id, jobId))
}

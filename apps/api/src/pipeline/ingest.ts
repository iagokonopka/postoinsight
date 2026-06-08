import { db } from '../db.js'
import { rawIngest } from '@postoinsight/db'
import type { AgentMessage } from '@postoinsight/shared'
import { completeSyncJob } from '../lib/sync-jobs.js'
import type { connectors } from '@postoinsight/db'
import type { InferSelectModel } from 'drizzle-orm'
import PgBoss from 'pg-boss'
import { env } from '../env.js'

type Connector = InferSelectModel<typeof connectors>

let boss: PgBoss | null = null

export async function getBoss(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss(env.DATABASE_URL)
    await boss.start()
  }
  return boss
}

export async function ingestBatch(
  msg: Extract<AgentMessage, { type: 'batch' | 'done' }>,
  connector: Connector,
): Promise<void> {
  if (msg.type === 'done') {
    // Finaliza o job: total_rows é o nº de registros puxados do ERP neste job.
    await completeSyncJob(msg.job_id, msg.total_rows)
    return
  }

  // 1. Persiste payload raw intocado
  const [record] = await db.insert(rawIngest).values({
    tenantId:    connector.tenantId,
    locationId:  connector.locationId,
    connectorId: connector.id,
    erpSource:   connector.erpSource,
    entity:      msg.entity,
    jobId:       msg.job_id,
    batchNumber: String(msg.batch),
    payload:     msg.rows as object[],
  }).returning({ id: rawIngest.id })

  if (!record) return

  // 2. Enfileira no pg-boss para o worker processar
  const b = await getBoss()

  const queue = msg.entity === 'fato_venda'
    ? 'pipeline:fato_venda'
    : msg.entity === 'despesa'
    ? 'pipeline:despesa'
    : 'pipeline:dim_produto'

  await b.send(queue, {
    rawIngestId: record.id,
    tenantId:    connector.tenantId,
    locationId:  connector.locationId,
    entity:      msg.entity,
    jobId:       msg.job_id,
  }, {
    retryLimit:   3,
    retryDelay:   60,
    retryBackoff: true,
    expireInSeconds: 300,
  })
}

/**
 * Enfileira um refresh das materialized views de analytics.
 * Throttling via singletonSeconds: no máximo 1 refresh a cada 30s,
 * mesmo que muitos batches cheguem em rajada.
 */
export async function enqueueAnalyticsRefresh(): Promise<void> {
  const b = await getBoss()
  await b.send('pipeline:refresh-analytics', {}, {
    singletonKey:    'refresh-analytics',
    singletonSeconds: 30,
    retryLimit:      2,
    retryDelay:      30,
    expireInSeconds: 600,
  })
}

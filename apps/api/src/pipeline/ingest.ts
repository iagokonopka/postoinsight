import { db } from '../db.js'
import { rawIngest, syncJobs } from '@postoinsight/db'
import type { AgentMessage } from '@postoinsight/shared'
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
    // Sinaliza conclusão do job no sync_jobs
    await db
      .update(syncJobs)
      .set({ status: 'pipeline_queued', completedAt: new Date() })
      .where(/* job_id match — simplificado */ undefined as never)
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

import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { connectors, locations } from '@postoinsight/db'
import { activeConnections } from './agent.js'
import { startSyncJob } from '../lib/sync-jobs.js'

interface BackfillBody {
  locationId: string
  from: string
  to: string
  entity?: 'fato_venda' | 'despesa'
  batch_size?: number
  delay_ms?: number
}

interface SyncDimProdutoBody {
  locationId: string
}

export const adminRoutes: FastifyPluginAsync = async (app) => {

  // ---------------------------------------------------------------------------
  // POST /admin/backfill
  // Dispara extração histórica de fato_venda para uma location.
  // Requer que o agente esteja conectado via WebSocket.
  // ---------------------------------------------------------------------------
  app.post<{ Body: BackfillBody }>('/backfill', {
    schema: {
      body: {
        type: 'object',
        required: ['locationId', 'from', 'to'],
        properties: {
          locationId: { type: 'string', format: 'uuid' },
          from:       { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          to:         { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
          entity:     { type: 'string', enum: ['fato_venda', 'despesa'], default: 'fato_venda' },
          batch_size: { type: 'integer', minimum: 1, maximum: 1000, default: 200 },
          delay_ms:   { type: 'integer', minimum: 0, maximum: 5000, default: 200 },
        },
      },
    },
  }, async (req, reply) => {
    const { locationId, from, to, entity = 'fato_venda', batch_size = 200, delay_ms = 200 } = req.body

    // 1. Valida datas
    if (from > to) {
      return reply.status(400).send({ error: '"from" must be before or equal to "to"' })
    }

    // 2. Busca a location
    const [location] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(eq(locations.id, locationId))
      .limit(1)

    if (!location) {
      return reply.status(404).send({ error: `Location not found: ${locationId}` })
    }

    // 3. Busca conector ativo da location
    const [connector] = await db
      .select({
        id:         connectors.id,
        agentToken: connectors.agentToken,
        tenantId:   connectors.tenantId,
        erpSource:  connectors.erpSource,
      })
      .from(connectors)
      .where(and(
        eq(connectors.locationId, locationId),
        eq(connectors.active, true),
      ))
      .limit(1)

    if (!connector) {
      return reply.status(404).send({ error: `No active connector for location: ${locationId}` })
    }

    // 4. Verifica que o agente está conectado
    const socket = activeConnections.get(connector.agentToken)
    if (!socket) {
      return reply.status(503).send({ error: 'Agent is not connected', locationId })
    }

    // 5. Registra o job (rastreável) e dispara o comando
    const jobId = randomUUID()

    await startSyncJob({
      jobId,
      tenantId:    connector.tenantId,
      locationId,
      erpSource:   connector.erpSource,
      entity,
      jobType:     'backfill',
      triggeredBy: 'backfill',
      periodFrom:  from,
      periodTo:    to,
    })

    const command = {
      command:    'backfill',
      job_id:     jobId,
      entity,
      from,
      to,
      batch_size,
      delay_ms,
    }

    socket.socket.send(JSON.stringify(command))

    app.log.info({ locationId, jobId, entity, from, to, batch_size }, 'Backfill dispatched')

    return reply.status(202).send({
      job_id:     jobId,
      locationId,
      entity,
      from,
      to,
      batch_size,
      status:     'dispatched',
    })
  })

  // ---------------------------------------------------------------------------
  // POST /admin/sync-dim-produto
  // Dispara o full sync da dimensão de produtos (TITEM/TCATI/TGRPI/TSGrI) de
  // uma location. Sem watermark — sincroniza o cadastro inteiro (SCD2 no worker).
  // ---------------------------------------------------------------------------
  app.post<{ Body: SyncDimProdutoBody }>('/sync-dim-produto', {
    schema: {
      body: {
        type: 'object',
        required: ['locationId'],
        properties: { locationId: { type: 'string', format: 'uuid' } },
      },
    },
  }, async (req, reply) => {
    const { locationId } = req.body

    const [connector] = await db
      .select({
        id:         connectors.id,
        agentToken: connectors.agentToken,
        tenantId:   connectors.tenantId,
        erpSource:  connectors.erpSource,
      })
      .from(connectors)
      .where(and(eq(connectors.locationId, locationId), eq(connectors.active, true)))
      .limit(1)

    if (!connector) {
      return reply.status(404).send({ error: `No active connector for location: ${locationId}` })
    }

    const socket = activeConnections.get(connector.agentToken)
    if (!socket) {
      return reply.status(503).send({ error: 'Agent is not connected', locationId })
    }

    const jobId = randomUUID()

    await startSyncJob({
      jobId,
      tenantId:    connector.tenantId,
      locationId,
      erpSource:   connector.erpSource,
      entity:      'dim_produto',
      jobType:     'full_sync',
      triggeredBy: 'backfill',
    })

    const command = { command: 'sync', job_id: jobId, entity: 'dim_produto', watermark: '' }
    socket.socket.send(JSON.stringify(command))

    app.log.info({ locationId, jobId }, 'dim_produto full sync dispatched')

    return reply.status(202).send({ job_id: jobId, locationId, entity: 'dim_produto', status: 'dispatched' })
  })
}

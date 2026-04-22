import type { FastifyPluginAsync } from 'fastify'
import { eq, and } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import { db } from '../db.js'
import { connectors, locations } from '@postoinsight/db'
import { activeConnections } from './agent.js'

interface BackfillBody {
  locationId: string
  from: string
  to: string
  batch_size?: number
  delay_ms?: number
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
          batch_size: { type: 'integer', minimum: 1, maximum: 1000, default: 200 },
          delay_ms:   { type: 'integer', minimum: 0, maximum: 5000, default: 200 },
        },
      },
    },
  }, async (req, reply) => {
    const { locationId, from, to, batch_size = 200, delay_ms = 200 } = req.body

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
      .select({ id: connectors.id, agentToken: connectors.agentToken })
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

    // 5. Dispara o comando
    const jobId = randomUUID()
    const command = {
      command:    'backfill',
      job_id:     jobId,
      entity:     'fato_venda',
      from,
      to,
      batch_size,
      delay_ms,
    }

    socket.socket.send(JSON.stringify(command))

    app.log.info({ locationId, jobId, from, to, batch_size }, 'Backfill dispatched')

    return reply.status(202).send({
      job_id:     jobId,
      locationId,
      entity:     'fato_venda',
      from,
      to,
      batch_size,
      status:     'dispatched',
    })
  })
}

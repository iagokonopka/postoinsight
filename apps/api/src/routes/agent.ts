import type { FastifyPluginAsync } from 'fastify'
import type { SocketStream } from '@fastify/websocket'
import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { connectors } from '@postoinsight/db'
import type { AgentMessage } from '@postoinsight/shared'
import { ingestBatch } from '../pipeline/ingest.js'

// Mapa de conexões ativas: agentToken → SocketStream
export const activeConnections = new Map<string, SocketStream>()

export const agentRoutes: FastifyPluginAsync = async (app) => {

  // -------------------------------------------------------------------------
  // GET /agent/v1/connect — WebSocket upgrade
  // -------------------------------------------------------------------------
  app.get('/connect', { websocket: true }, async (socket, req) => {
    const authHeader = req.headers['authorization']
    const token = authHeader?.replace('Bearer ', '').trim()

    if (!token) {
      socket.socket.close(4001, 'Missing authorization token')
      return
    }

    const [connector] = await db
      .select()
      .from(connectors)
      .where(eq(connectors.agentToken, token))
      .limit(1)

    if (!connector || !connector.active) {
      socket.socket.close(4003, 'Invalid or inactive token')
      return
    }

    // Registra conexão ativa
    activeConnections.set(token, socket)

    // Atualiza last_seen_at
    await db
      .update(connectors)
      .set({ lastSeenAt: new Date() })
      .where(eq(connectors.agentToken, token))

    app.log.info({ connectorId: connector.id, postoId: connector.postoId }, 'Agent connected')

    socket.socket.on('message', async (raw) => {
      try {
        const msg: AgentMessage = JSON.parse(raw.toString())

        if (msg.type === 'pong') return

        if (msg.type === 'batch' || msg.type === 'done') {
          await ingestBatch(msg, connector)
        }

        if (msg.type === 'error') {
          app.log.error({ jobId: msg.job_id, message: msg.message }, 'Agent reported error')
        }
      } catch (err) {
        app.log.error(err, 'Failed to process agent message')
      }
    })

    socket.socket.on('close', () => {
      activeConnections.delete(token)
      app.log.info({ connectorId: connector.id }, 'Agent disconnected')
    })

    // Heartbeat — responde pings do agente
    socket.socket.on('ping', () => socket.socket.ping())
  })
}

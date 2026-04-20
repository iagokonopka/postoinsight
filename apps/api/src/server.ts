import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import { env } from './env.js'
import { agentRoutes } from './routes/agent.js'

const server = Fastify({
  logger: {
    level: env.NODE_ENV === 'development' ? 'info' : 'warn',
    transport: env.NODE_ENV === 'development'
      ? { target: 'pino-pretty' }
      : undefined,
  },
})

await server.register(cors, { origin: true })
await server.register(websocket)
await server.register(agentRoutes, { prefix: '/agent/v1' })

server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}

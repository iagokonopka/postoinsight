import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import { env } from './env.js'
import { agentRoutes } from './routes/agent.js'
import { adminRoutes } from './routes/admin.js'

const server = Fastify({
  logger: env.NODE_ENV === 'development'
    ? { level: 'info', transport: { target: 'pino-pretty' } }
    : { level: 'warn' },
})

await server.register(cors, { origin: true })
await server.register(websocket)
await server.register(agentRoutes, { prefix: '/agent/v1' })
await server.register(adminRoutes, { prefix: '/admin' })

server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}

import Fastify from 'fastify'
import websocket from '@fastify/websocket'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import { env } from './env.js'
import { agentRoutes } from './routes/agent.js'
import { adminRoutes } from './routes/admin.js'
import { authRoutes } from './routes/auth.js'
import { locationsRoutes } from './routes/locations.js'
import { syncRoutes } from './routes/sync.js'
import { salesRoutes } from './routes/sales.js'
import { fuelRoutes } from './routes/fuel.js'
import { convenienceRoutes } from './routes/convenience.js'
import { dreRoutes } from './routes/dre.js'
import { arlaRoutes } from './routes/arla.js'
import { lubricantsRoutes } from './routes/lubricants.js'
import { usersRoutes } from './routes/users.js'
import { connectorsRoutes } from './routes/connectors.js'
import { adminMappingRoutes } from './routes/admin-mapping.js'

const server = Fastify({
  logger: env.NODE_ENV === 'development'
    ? { level: 'info', transport: { target: 'pino-pretty' } }
    : { level: 'warn' },
})

// CORS — allowlist explícita.
// Endpoints de dashboard usam cookie de sessão (Auth.js) — credentials:true exige
// origin específico (não wildcard). Em dev sem WEB_ORIGIN, libera localhost.
const allowlist = (env.WEB_ORIGIN ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

// Cookie plugin — necessário para reply.setCookie() / reply.clearCookie() em /auth/*
await server.register(cookie)

await server.register(cors, {
  credentials: true,
  origin: (origin, cb) => {
    // Requests server-side (sem origin) — passam (Bearer token é validado por sessão)
    if (!origin) return cb(null, true)
    if (allowlist.includes(origin)) return cb(null, true)
    if (env.NODE_ENV === 'development' && allowlist.length === 0) {
      return cb(null, true)
    }
    return cb(new Error('Origin não permitida'), false)
  },
})
await server.register(websocket)
await server.register(agentRoutes, { prefix: '/agent/v1' })
await server.register(adminRoutes, { prefix: '/admin' })
await server.register(authRoutes,         { prefix: '/auth' })
await server.register(locationsRoutes,    { prefix: '/api/v1/locations' })
await server.register(syncRoutes,         { prefix: '/api/v1/sync' })
await server.register(salesRoutes,        { prefix: '/api/v1/sales' })
await server.register(fuelRoutes,         { prefix: '/api/v1/fuel' })
await server.register(convenienceRoutes,  { prefix: '/api/v1/convenience' })
await server.register(dreRoutes,          { prefix: '/api/v1/dre' })
await server.register(arlaRoutes,         { prefix: '/api/v1/arla' })
await server.register(lubricantsRoutes,   { prefix: '/api/v1/lubricants' })
await server.register(usersRoutes,         { prefix: '/api/v1/users' })
await server.register(connectorsRoutes,    { prefix: '/api/v1/connectors' })
await server.register(adminMappingRoutes,   { prefix: '/api/v1/admin' })

server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}

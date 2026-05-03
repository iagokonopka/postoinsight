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
import { vendasRoutes } from './routes/vendas.js'
import { combustivelRoutes } from './routes/combustivel.js'
import { convenienciaRoutes } from './routes/conveniencia.js'
import { dreRoutes } from './routes/dre.js'

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
await server.register(vendasRoutes,       { prefix: '/api/v1/vendas' })
await server.register(combustivelRoutes,  { prefix: '/api/v1/combustivel' })
await server.register(convenienciaRoutes, { prefix: '/api/v1/conveniencia' })
await server.register(dreRoutes,          { prefix: '/api/v1/dre' })

server.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' })
} catch (err) {
  server.log.error(err)
  process.exit(1)
}

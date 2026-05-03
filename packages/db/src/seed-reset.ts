/**
 * seed-reset.ts
 *
 * Apaga todos os dados operacionais do schema `app` na ordem correta (respeitando FK).
 * Nunca toca em raw.*, canonical.* ou analytics.*.
 *
 * USO: apenas em ambiente de desenvolvimento.
 * Em produção (NODE_ENV=production) lança erro e encerra sem fazer nada.
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

// Proteção contra execução acidental em produção
if (process.env['NODE_ENV'] === 'production') {
  console.error('ERRO: seed:reset não pode ser executado em produção (NODE_ENV=production).')
  process.exit(1)
}

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL is required')

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client, { schema })

console.log('Iniciando seed:reset — apagando dados do schema app...')

// Ordem de deleção respeita dependências de FK (tabelas filhas primeiro)

// Tabelas de log/eventos — sem FKs bloqueantes
await db.delete(schema.usageEvents)
await db.delete(schema.syncRejections)
await db.delete(schema.connectorEvents)
await db.delete(schema.loginHistory)
await db.delete(schema.auditLog)
console.log('  ✓ Logs e eventos removidos')

// Sync
await db.delete(schema.syncState)
await db.delete(schema.syncJobs)
console.log('  ✓ sync_state e sync_jobs removidos')

// Connectors
await db.delete(schema.connectors)
console.log('  ✓ connectors removidos')

// Invitations
await db.delete(schema.invitations)
console.log('  ✓ invitations removidos')

// Auth.js — sessions e accounts antes dos users
await db.delete(schema.sessions)
await db.delete(schema.accounts)
await db.delete(schema.verificationTokens)
console.log('  ✓ sessions, accounts, verification_tokens removidos')

// tenant_users antes de users e tenants
await db.delete(schema.tenantUsers)
console.log('  ✓ tenant_users removidos')

// platform_users antes de users
await db.delete(schema.platformUsers)
console.log('  ✓ platform_users removidos')

// users
await db.delete(schema.users)
console.log('  ✓ users removidos')

// locations antes de tenants
await db.delete(schema.locations)
console.log('  ✓ locations removidas')

// tenants por último
await db.delete(schema.tenants)
console.log('  ✓ tenants removidos')

console.log('\nseed:reset concluído. Execute pnpm seed para repopular.')

await client.end()

import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { randomUUID } from 'crypto'
import * as schema from './schema/index.js'

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL is required')

const client = postgres(connectionString, { max: 1 })
const db = drizzle(client, { schema })

// ---------------------------------------------------------------------------
// Tenant: Rede JAM
// ---------------------------------------------------------------------------
const tenantId = randomUUID()

await db.insert(schema.tenants).values({
  id:   tenantId,
  name: 'Rede JAM',
  slug: 'rede-jam',
}).onConflictDoNothing()

console.log(`Tenant: Rede JAM (${tenantId})`)

// ---------------------------------------------------------------------------
// Postos operacionais
// Cd_Estab 001/002/005/006 — CNAE 4731800 (comércio varejista de combustíveis)
// Excluídos: 007 (escritório Imbé), 080 (centro de distribuição), 090 (matriz)
// ---------------------------------------------------------------------------
const postosData = [
  { sourcePostoId: '001', name: 'JAM Rota 1',    address: 'Rua Osmani Veras, 2660 — Terra de Areia/RS' },
  { sourcePostoId: '002', name: 'JAM Torres',     address: 'Av. Castelo Branco, 1853 — Torres/RS'       },
  { sourcePostoId: '005', name: 'JAM Imbé',       address: 'Av. Paraguassu, 3108 — Imbé/RS'             },
  { sourcePostoId: '006', name: 'JAM Tramandaí',  address: 'Av. Fernandes Bastos, 281 — Tramandaí/RS'   },
] as const

const postoIds: Record<string, string> = {}

for (const posto of postosData) {
  const postoId = randomUUID()
  postoIds[posto.sourcePostoId] = postoId

  await db.insert(schema.postos).values({
    id:            postoId,
    tenantId,
    name:          posto.name,
    address:       posto.address,
    sourcePostoId: posto.sourcePostoId,
    erpSource:     'status',
  }).onConflictDoNothing()

  console.log(`  Posto: ${posto.name} (CD_ESTAB=${posto.sourcePostoId}) → ${postoId}`)
}

// ---------------------------------------------------------------------------
// Connectors + sync_state inicial (1 por posto)
// Credenciais do SQL Server via env — preencher .env antes de rodar
// ---------------------------------------------------------------------------
const sqlCreds = {
  host:     process.env['JAM_DB_HOST']     ?? 'PREENCHER',
  port:     parseInt(process.env['JAM_DB_PORT'] ?? '1433'),
  database: process.env['JAM_DB_NAME']     ?? 'PREENCHER',
  user:     process.env['JAM_DB_USER']     ?? 'PREENCHER',
  password: process.env['JAM_DB_PASSWORD'] ?? 'PREENCHER',
}

const agentTokens: Array<{ posto: string; token: string }> = []

for (const posto of postosData) {
  const postoId = postoIds[posto.sourcePostoId]!
  const agentToken = randomUUID()
  agentTokens.push({ posto: posto.name, token: agentToken })

  await db.insert(schema.connectors).values({
    tenantId,
    postoId,
    erpSource:   'status',
    agentToken,
    credentials: sqlCreds,
  }).onConflictDoNothing()

  // sync_state inicial — watermark NULL = buscar histórico completo no backfill
  await db.insert(schema.syncState).values({
    tenantId,
    postoId,
    erpSource:  'status',
    entity:     'fato_venda',
  }).onConflictDoNothing()

  await db.insert(schema.syncState).values({
    tenantId,
    postoId,
    erpSource:  'status',
    entity:     'dim_produto',
  }).onConflictDoNothing()
}

// ---------------------------------------------------------------------------
// Usuário admin do tenant JAM
// ---------------------------------------------------------------------------
const adminEmail = process.env['JAM_ADMIN_EMAIL'] ?? 'admin@postosjam.com.br'
const userId = randomUUID()

await db.insert(schema.users).values({
  id:    userId,
  name:  'Admin JAM',
  email: adminEmail,
}).onConflictDoNothing()

await db.insert(schema.tenantUsers).values({
  tenantId,
  userId,
  role: 'owner',
}).onConflictDoNothing()

// ---------------------------------------------------------------------------
// Resumo final
// ---------------------------------------------------------------------------
console.log('\n─────────────────────────────────────────')
console.log('Seed concluído com sucesso.')
console.log('\nAGENT_TOKENs gerados (copiar para o .env de cada agente):')
for (const { posto, token } of agentTokens) {
  console.log(`  ${posto.padEnd(18)} → ${token}`)
}
console.log('\nVariáveis de ambiente necessárias no .env:')
console.log('  JAM_DB_HOST=')
console.log('  JAM_DB_PORT=1433')
console.log('  JAM_DB_NAME=')
console.log('  JAM_DB_USER=')
console.log('  JAM_DB_PASSWORD=')
console.log('  JAM_ADMIN_EMAIL=')
console.log('─────────────────────────────────────────')

await client.end()

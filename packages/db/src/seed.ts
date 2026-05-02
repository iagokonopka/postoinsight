import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { randomUUID } from 'crypto'
import bcrypt from 'bcryptjs'
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
// Locations (CD_ESTAB operacionais JAM)
// Excluídos: 007 (escritório Imbé), 080 (CD), 090 (matriz)
// ---------------------------------------------------------------------------
const locationsData = [
  { sourceLocationId: '001', name: 'JAM Rota 1',   address: 'Rua Osmani Veras, 2660 — Terra de Areia/RS' },
  { sourceLocationId: '002', name: 'JAM Torres',    address: 'Av. Castelo Branco, 1853 — Torres/RS'       },
  { sourceLocationId: '005', name: 'JAM Imbé',      address: 'Av. Paraguassu, 3108 — Imbé/RS'             },
  { sourceLocationId: '006', name: 'JAM Tramandaí', address: 'Av. Fernandes Bastos, 281 — Tramandaí/RS'   },
] as const

const locationIds: Record<string, string> = {}

for (const loc of locationsData) {
  const locationId = randomUUID()
  locationIds[loc.sourceLocationId] = locationId

  await db.insert(schema.locations).values({
    id:               locationId,
    tenantId,
    name:             loc.name,
    address:          loc.address,
    sourceLocationId: loc.sourceLocationId,
    erpSource:        'status',
  }).onConflictDoNothing()

  console.log(`  Location: ${loc.name} (CD_ESTAB=${loc.sourceLocationId}) → ${locationId}`)
}

// ---------------------------------------------------------------------------
// Connectors + sync_state inicial
// ---------------------------------------------------------------------------
const sqlCreds = {
  host:     process.env['JAM_DB_HOST']     ?? 'PREENCHER',
  port:     parseInt(process.env['JAM_DB_PORT'] ?? '1433'),
  database: process.env['JAM_DB_NAME']     ?? 'PREENCHER',
  user:     process.env['JAM_DB_USER']     ?? 'PREENCHER',
  password: process.env['JAM_DB_PASSWORD'] ?? 'PREENCHER',
}

const agentTokens: Array<{ location: string; sourceLocationId: string; token: string }> = []

for (const loc of locationsData) {
  const locationId = locationIds[loc.sourceLocationId]!
  const agentToken = randomUUID()
  agentTokens.push({ location: loc.name, sourceLocationId: loc.sourceLocationId, token: agentToken })

  await db.insert(schema.connectors).values({
    tenantId,
    locationId,
    erpSource:   'status',
    agentToken,
    credentials: sqlCreds,
  }).onConflictDoNothing()

  await db.insert(schema.syncState).values({
    tenantId,
    locationId,
    erpSource: 'status',
    entity:    'fato_venda',
  }).onConflictDoNothing()

  await db.insert(schema.syncState).values({
    tenantId,
    locationId,
    erpSource: 'status',
    entity:    'dim_produto',
  }).onConflictDoNothing()
}

// ---------------------------------------------------------------------------
// Usuário admin do tenant JAM
// ---------------------------------------------------------------------------
const adminEmail = process.env['JAM_ADMIN_EMAIL'] ?? 'admin@postosjam.com.br'
const adminPassword = process.env['JAM_ADMIN_PASSWORD'] ?? 'admin123'
const passwordHash = await bcrypt.hash(adminPassword, 12)
const userId = randomUUID()

await db.insert(schema.users).values({
  id:           userId,
  name:         'Admin JAM',
  email:        adminEmail,
  passwordHash,
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
console.log(`  Admin email:    ${adminEmail}`)
console.log(`  Admin senha:    ${adminPassword}  <- TROCAR EM PRODUCAO`)
console.log('\nLOCATIONS env var (copiar para o .env do agente):')
const locationsParts = agentTokens.map(({ sourceLocationId, token }) => `${sourceLocationId}:${token}`)
console.log(`  LOCATIONS=${locationsParts.join(',')}`)
console.log('\nTokens por location:')
for (const { location, token } of agentTokens) {
  console.log(`  ${location.padEnd(18)} → ${token}`)
}
console.log('─────────────────────────────────────────')

await client.end()

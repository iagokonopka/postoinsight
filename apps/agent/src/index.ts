import './env.js'
import { parseLocations } from './env.js'
import { connectLocation } from './ws-client.js'
import { closePool } from './db.js'

const locations = parseLocations()
console.log(`PostoInsight Agent starting — ${locations.length} location(s): ${locations.map(l => l.sourceLocationId).join(', ')}`)

for (const location of locations) {
  connectLocation(location)
}

async function shutdown() {
  console.log('Shutting down...')
  await closePool()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

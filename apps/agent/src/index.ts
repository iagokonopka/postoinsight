import './env.js'
import { connect } from './ws-client.js'
import { closePool } from './db.js'

console.log('PostoInsight Agent starting...')
connect()

process.on('SIGTERM', async () => {
  console.log('Shutting down...')
  await closePool()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await closePool()
  process.exit(0)
})

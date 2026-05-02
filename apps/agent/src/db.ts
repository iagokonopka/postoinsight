import sql from 'mssql'
import { env } from './env.js'

const config: sql.config = {
  server:          env.DB_HOST,
  port:            env.DB_PORT,
  database:        env.DB_NAME,
  user:            env.DB_USER,
  password:        env.DB_PASSWORD,
  connectionTimeout: 15_000,
  requestTimeout:    120_000,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
    instanceName:           env.DB_INSTANCE || undefined,
  },
  pool: {
    max: 3,
    min: 0,
    idleTimeoutMillis: 60_000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool || !pool.connected) {
    pool = await new sql.ConnectionPool(config).connect()
    console.log('SQL Server connected')
  }
  return pool
}

export async function closePool(): Promise<void> {
  await pool?.close()
  pool = null
}

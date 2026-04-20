import sql from 'mssql'
import { env } from './env.js'

const config: sql.config = {
  server:   env.DB_HOST,
  port:     env.DB_PORT,
  database: env.DB_NAME,
  user:     env.DB_USER,
  password: env.DB_PASSWORD,
  options: {
    encrypt:                false,
    trustServerCertificate: true,
  },
  pool: {
    max: 3,
    min: 1,
    idleTimeoutMillis: 30_000,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await new sql.ConnectionPool(config).connect()
    console.log('SQL Server connected')
  }
  return pool
}

export async function closePool(): Promise<void> {
  await pool?.close()
  pool = null
}

import { config } from 'dotenv'
import { z } from 'zod'

config()

const schema = z.object({
  POSTOINSIGHT_API_URL: z.string().url(),
  AGENT_TOKEN:          z.string().uuid(),
  DB_HOST:              z.string(),
  DB_PORT:              z.coerce.number().default(1433),
  DB_NAME:              z.string(),
  DB_USER:              z.string(),
  DB_PASSWORD:          z.string(),
})

export const env = schema.parse(process.env)

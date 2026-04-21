import { config } from 'dotenv'
import { z } from 'zod'

config()

const schema = z.object({
  POSTOINSIGHT_API_URL: z.string(),
  DB_HOST:              z.string(),
  DB_PORT:              z.coerce.number().default(1433),
  DB_NAME:              z.string(),
  DB_USER:              z.string(),
  DB_PASSWORD:          z.string(),
  // Format: "source_location_id:token,..."  e.g. "001:uuid1,002:uuid2"
  LOCATIONS:            z.string(),
})

export const env = schema.parse(process.env)

export type LocationConfig = { sourceLocationId: string; token: string }

export function parseLocations(): LocationConfig[] {
  return env.LOCATIONS.split(',').map((entry) => {
    const [sourceLocationId, token] = entry.trim().split(':')
    if (!sourceLocationId || !token) throw new Error(`Invalid LOCATIONS entry: ${entry}`)
    return { sourceLocationId, token }
  })
}

import { z } from 'zod'

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_SECRET:   z.string().min(16).optional(),
})

export const env = schema.parse(process.env)

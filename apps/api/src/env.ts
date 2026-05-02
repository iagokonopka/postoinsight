import { z } from 'zod'

const schema = z.object({
  NODE_ENV:     z.enum(['development', 'production', 'test']).default('development'),
  PORT:         z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  API_SECRET:   z.string().min(16).optional(),
  // AUTH_SECRET — mesmo valor usado pelo apps/web. Usado para decriptar
  // o JWE Auth.js v5. Obrigatório em produção.
  AUTH_SECRET:  z.string().min(16),
  // CSV de origins permitidas pelo CORS (ex: "https://app.postoinsight.com,http://localhost:3001")
  // Se ausente em development → permite qualquer origin. Em production → bloqueia tudo.
  WEB_ORIGIN:   z.string().optional(),
})

export const env = schema.parse(process.env)

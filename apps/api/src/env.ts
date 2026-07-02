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
  // Base pública do SPA — usada para montar links de ativação/reset/login.
  // Ex: "https://web-production-c2e6bc.up.railway.app" ou "http://localhost:3001"
  WEB_APP_URL:  z.string().url().default('http://localhost:3001'),
  // Base pública desta API — usada no link de login por e-mail (o endpoint
  // /auth/login-link/consume seta o cookie e redireciona ao SPA).
  API_PUBLIC_URL: z.string().url().default('http://localhost:3000'),
  // Chave da API Resend para envio de e-mails de auth. Se ausente, o link é
  // apenas logado no console (modo dev) em vez de enviado.
  RESEND_API_KEY: z.string().optional(),
  // Remetente dos e-mails de auth (deve ser de domínio verificado no Resend).
  AUTH_EMAIL_FROM: z.string().default('PostoInsight <nao-responda@postoinsight.com>'),
})

export const env = schema.parse(process.env)

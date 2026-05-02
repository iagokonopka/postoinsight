import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./src/schema/app.ts', './src/schema/raw.ts', './src/schema/canonical.ts', './src/schema/analytics.ts'],
  out: './migrations',
  dbCredentials: {
    url: process.env['DATABASE_URL']!,
  },
  schemaFilter: ['app', 'raw', 'canonical', 'analytics'],
  verbose: true,
})

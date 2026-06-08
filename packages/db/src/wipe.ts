/**
 * wipe.ts
 *
 * Wipe TOTAL do banco: dropa os schemas app, raw, canonical e analytics
 * (CASCADE) e o estado de filas do pg-boss. Diferente do seed-reset (que só
 * limpa dados do schema app), este script zera 100% da estrutura para um
 * rebuild do zero via `pnpm migrate` + `pnpm seed`.
 *
 * Roda contra o DATABASE_URL configurado — inclusive produção (Railway).
 * Por isso exige confirmação explícita: CONFIRM_WIPE=yes.
 *
 * USO:
 *   CONFIRM_WIPE=yes pnpm --filter @postoinsight/db wipe
 */

import postgres from 'postgres'

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL is required')

if (process.env['CONFIRM_WIPE'] !== 'yes') {
  console.error('ABORTADO: defina CONFIRM_WIPE=yes para confirmar o wipe TOTAL do banco.')
  console.error('Este comando dropa app, raw, canonical, analytics e o estado do pg-boss.')
  process.exit(1)
}

const client = postgres(connectionString, { max: 1 })

console.log('Iniciando WIPE TOTAL do banco...')

await client.unsafe(`
  DROP SCHEMA IF EXISTS analytics CASCADE;
  DROP SCHEMA IF EXISTS canonical CASCADE;
  DROP SCHEMA IF EXISTS raw CASCADE;
  DROP SCHEMA IF EXISTS app CASCADE;
  DROP SCHEMA IF EXISTS pgboss CASCADE;
  DROP TABLE IF EXISTS public.pgboss CASCADE;
  DROP SCHEMA IF EXISTS drizzle CASCADE;
  DROP TABLE IF EXISTS public."__drizzle_migrations" CASCADE;
`)

console.log('  ✓ Schemas app, raw, canonical, analytics removidos')
console.log('  ✓ Estado do pg-boss removido')
console.log('  ✓ Histórico de migrations do Drizzle removido')
console.log('\nWIPE concluído. Próximos passos:')
console.log('  1. pnpm --filter @postoinsight/db migrate')
console.log('  2. LOCATIONS=001:...,002:...,005:...,006:... pnpm --filter @postoinsight/db seed')

await client.end()

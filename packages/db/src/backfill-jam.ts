/**
 * backfill-jam.ts
 *
 * Orquestra o rebuild completo dos dados da Rede JAM, location por location,
 * em janelas mensais — sem cliques manuais.
 *
 * Para cada location (ordem 001 → 002 → 005 → 006):
 *   1. dispara o full sync de dim_produto e espera concluir
 *   2. para cada mês de START_DATE até hoje:
 *        - backfill de fato_venda  (espera concluir)
 *        - backfill de despesa     (espera concluir)
 *
 * Serializa por job: só dispara o próximo depois que o anterior sai de `running`
 * (consultando app.sync_jobs). Isso evita afogar o SQL Server do cliente e o
 * WebSocket do agente. Tudo é idempotente (ON CONFLICT DO NOTHING no pipeline),
 * então pode re-rodar com segurança.
 *
 * USO:
 *   API_URL=https://api-production-3a9c.up.railway.app \
 *   pnpm --filter @postoinsight/db backfill:jam
 *
 * Variáveis:
 *   DATABASE_URL  (via --env-file=.env) — banco do Railway
 *   API_URL       — base da API (default: produção Railway)
 *   START_DATE    — primeiro mês a puxar (default: 2025-01-01)
 *   BATCH_SIZE    — default 200
 *   DELAY_MS      — delay entre lotes no agente (default 200)
 *   JOB_TIMEOUT_S — timeout por janela em segundos (default 1800 = 30min)
 */

import postgres from 'postgres'

const connectionString = process.env['DATABASE_URL']
if (!connectionString) throw new Error('DATABASE_URL is required')

const API_URL       = (process.env['API_URL'] ?? 'https://api-production-3a9c.up.railway.app').replace(/\/$/, '')
const START_DATE    = process.env['START_DATE'] ?? '2025-01-01'
const BATCH_SIZE    = parseInt(process.env['BATCH_SIZE'] ?? '200')
const DELAY_MS      = parseInt(process.env['DELAY_MS'] ?? '200')
const JOB_TIMEOUT_S = parseInt(process.env['JOB_TIMEOUT_S'] ?? '1800')
const POLL_MS       = 3000

const sql = postgres(connectionString, { max: 1 })

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Gera janelas mensais [from, to] de START_DATE até o mês corrente.
function monthlyWindows(start: string): Array<{ from: string; to: string; label: string }> {
  const windows: Array<{ from: string; to: string; label: string }> = []
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  let y = sy!, m = sm!
  while (y < now.getUTCFullYear() || (y === now.getUTCFullYear() && m <= now.getUTCMonth() + 1)) {
    const from = `${y}-${String(m).padStart(2, '0')}-01`
    const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate() // dia 0 do mês seguinte = último deste
    const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    windows.push({ from, to, label: `${y}-${String(m).padStart(2, '0')}` })
    m++
    if (m > 12) { m = 1; y++ }
  }
  return windows
}

// Espera o job sair de `running`/`pending`. Retorna o status final.
async function waitForJob(jobId: string): Promise<{ status: string; rows: number | null; error: string | null }> {
  const deadline = Date.now() + JOB_TIMEOUT_S * 1000
  while (Date.now() < deadline) {
    const [job] = await sql<{ status: string; rows_ingested: number | null; error_message: string | null }[]>`
      SELECT status, rows_ingested, error_message FROM app.sync_jobs WHERE id = ${jobId}
    `
    if (job && job.status !== 'running' && job.status !== 'pending') {
      return { status: job.status, rows: job.rows_ingested, error: job.error_message }
    }
    await sleep(POLL_MS)
  }
  return { status: 'timeout', rows: null, error: `timeout após ${JOB_TIMEOUT_S}s` }
}

async function postJson(path: string, body: unknown): Promise<{ ok: boolean; status: number; json: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
  let json: any = null
  try { json = await res.json() } catch { /* sem corpo */ }
  return { ok: res.ok, status: res.status, json }
}

async function dispatchAndWait(label: string, path: string, body: unknown): Promise<boolean> {
  process.stdout.write(`    ${label} ... `)
  const res = await postJson(path, body)
  if (res.status !== 202 || !res.json?.job_id) {
    console.log(`FALHOU (HTTP ${res.status}: ${JSON.stringify(res.json)})`)
    return false
  }
  const final = await waitForJob(res.json.job_id)
  if (final.status === 'success') {
    console.log(`ok — ${final.rows ?? 0} registros`)
    return true
  }
  console.log(`${final.status.toUpperCase()} — ${final.error ?? ''}`)
  return false
}

// ---------------------------------------------------------------------------

console.log(`Backfill Rede JAM`)
console.log(`  API:    ${API_URL}`)
console.log(`  Desde:  ${START_DATE}`)

// Sanidade: API no ar?
try {
  const health = await fetch(`${API_URL}/health`)
  if (!health.ok) throw new Error(`HTTP ${health.status}`)
} catch (err) {
  console.error(`\nERRO: API inacessível em ${API_URL}/health — ${String(err)}`)
  await sql.end()
  process.exit(1)
}

const locs = await sql<{ id: string; source_location_id: string; name: string }[]>`
  SELECT l.id, l.source_location_id, l.name
  FROM app.locations l
  JOIN app.tenants t ON t.id = l.tenant_id
  WHERE t.slug = 'rede-jam' AND l.deleted_at IS NULL
  ORDER BY l.source_location_id
`

if (locs.length === 0) {
  console.error('ERRO: nenhuma location encontrada. Rodou o seed?')
  await sql.end()
  process.exit(1)
}

const windows = monthlyWindows(START_DATE)
console.log(`  Locations: ${locs.length} | Janelas mensais: ${windows.length}\n`)

let failures = 0

for (const loc of locs) {
  console.log(`▶ ${loc.name} (CD_ESTAB=${loc.source_location_id})`)

  // 1. dim_produto (full sync) — necessário antes dos fatos
  const dimOk = await dispatchAndWait('dim_produto', '/admin/sync-dim-produto', { locationId: loc.id })
  if (!dimOk) {
    failures++
    console.log(`  ⚠ dim_produto falhou para ${loc.name} — pulando esta location (agente offline?)\n`)
    continue
  }

  // 2. fatos, mês a mês
  for (const w of windows) {
    const vOk = await dispatchAndWait(
      `${w.label} fato_venda`,
      '/admin/backfill',
      { locationId: loc.id, entity: 'fato_venda', from: w.from, to: w.to, batch_size: BATCH_SIZE, delay_ms: DELAY_MS },
    )
    const dOk = await dispatchAndWait(
      `${w.label} despesa   `,
      '/admin/backfill',
      { locationId: loc.id, entity: 'despesa', from: w.from, to: w.to, batch_size: BATCH_SIZE, delay_ms: DELAY_MS },
    )
    if (!vOk) failures++
    if (!dOk) failures++
  }
  console.log('')
}

console.log('─────────────────────────────────────────')
console.log(failures === 0 ? 'Backfill concluído sem falhas.' : `Backfill concluído com ${failures} janela(s) com falha — revise o log acima.`)
console.log('Validação: GET /api/v1/sync/status e SELECT count(*) FROM canonical.fato_venda / fato_despesa.')

await sql.end()
process.exit(failures === 0 ? 0 : 1)

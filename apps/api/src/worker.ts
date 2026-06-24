import PgBoss from 'pg-boss'
import { eq, and } from 'drizzle-orm'
import { db } from './db.js'
import { env } from './env.js'
import { rawIngest, factSale, factExpense, locations, syncState } from '@postoinsight/db'
import { transformStatusVenda, type StatusVendaRow } from './pipeline/transform-fact-sale.js'
import { transformStatusDespesa, isRateioNoise, type StatusDespesaRow } from './pipeline/transform-expense.js'
import { transformDimProduto, type DimProdutoPayload } from './pipeline/transform-dim-product.js'
import { dimProduct } from '@postoinsight/db'
import { refreshAnalyticsMvs } from './pipeline/refresh-analytics.js'
import { enqueueAnalyticsRefresh } from './pipeline/ingest.js'

const boss = new PgBoss(env.DATABASE_URL)

// Retry logic — Railway may start the worker before Postgres is ready
async function startWithRetry(maxAttempts = 20, delayMs = 5000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await boss.start()
      return
    } catch (err: any) {
      const isNotReady =
        err?.code === '57P03' ||
        err?.errno === -104 ||
        err?.message?.includes('not yet accepting connections') ||
        err?.message?.includes('ECONNRESET') ||
        err?.message?.includes('ECONNREFUSED')
      if (!isNotReady || attempt === maxAttempts) throw err
      console.log(`Worker: Postgres not ready yet (attempt ${attempt}/${maxAttempts}), retrying in ${delayMs}ms...`)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
}

await startWithRetry()

console.log('Worker started — listening for pipeline jobs')

// ---------------------------------------------------------------------------
// pipeline:fato_venda
// ---------------------------------------------------------------------------
await boss.work('pipeline:fato_venda', { teamSize: 4, teamConcurrency: 4 }, async (job) => {
  const { rawIngestId, tenantId, locationId } = job.data as {
    rawIngestId: string
    tenantId: string
    locationId: string
  }

  // 1. Busca o payload raw
  const [record] = await db
    .select()
    .from(rawIngest)
    .where(eq(rawIngest.id, rawIngestId))
    .limit(1)

  if (!record) throw new Error(`raw_ingest not found: ${rawIngestId}`)

  const rows = record.payload as StatusVendaRow[]

  // 2. Valida que a location existe no tenant
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1)

  if (!location) throw new Error(`Location not found: locationId=${locationId} tenantId=${tenantId}`)

  // 3. Transforma
  let rejected = 0
  const validRows: ReturnType<typeof transformStatusVenda>[] = []

  for (const row of rows) {
    try {
      const transformed = transformStatusVenda(row, tenantId, locationId)

      // Validações
      if (!transformed.saleDate) { rejected++; continue }
      if (Number(transformed.totalValue) < 0) { rejected++; continue }
      if (Number(transformed.quantity) <= 0) { rejected++; continue }
      if (!transformed.sourceProductId) { rejected++; continue }

      validRows.push(transformed)
    } catch {
      rejected++
    }
  }

  // 4. Upsert em lotes de 100 (evita queries gigantes)
  const BATCH = 100
  for (let i = 0; i < validRows.length; i += BATCH) {
    const chunk = validRows.slice(i, i + BATCH)
    await db
      .insert(factSale)
      .values(chunk)
      .onConflictDoNothing()
  }

  // 5. Atualiza watermark (maior DATA_EMISSAO do lote)
  const maxDate = rows.reduce((max, r) => {
    const d = r.DATA_EMISSAO.split('T')[0] ?? ''
    return d > max ? d : max
  }, '')

  if (maxDate) {
    await db
      .update(syncState)
      .set({ lastSyncedAt: new Date(maxDate), updatedAt: new Date() })
      .where(and(
        eq(syncState.locationId, locationId),
        eq(syncState.entity, 'fato_venda'),
      ))
  }

  // 6. Marca raw_ingest como processado
  await db
    .update(rawIngest)
    .set({ processedAt: new Date() })
    .where(eq(rawIngest.id, rawIngestId))

  console.log(`pipeline:fato_venda — inserted=${validRows.length} rejected=${rejected} locationId=${locationId}`)

  // 7. Enfileira refresh das MVs de analytics (throttled — singleton 30s)
  if (validRows.length > 0) {
    await enqueueAnalyticsRefresh()
  }
})

// ---------------------------------------------------------------------------
// pipeline:despesa
// Transforma baixas financeiras (TMPBI_DOCUMENTOS_BAIXADOS) → canonical.fato_despesa.
// Sem segmento. Filtra lixo de rateio. Spec: docs/specs/despesas.md
// ---------------------------------------------------------------------------
await boss.work('pipeline:despesa', { teamSize: 2, teamConcurrency: 2 }, async (job) => {
  const { rawIngestId, tenantId, locationId } = job.data as {
    rawIngestId: string
    tenantId: string
    locationId: string
  }

  const [record] = await db
    .select()
    .from(rawIngest)
    .where(eq(rawIngest.id, rawIngestId))
    .limit(1)

  if (!record) throw new Error(`raw_ingest not found: ${rawIngestId}`)

  const rows = record.payload as StatusDespesaRow[]

  // Valida que a location existe no tenant
  const [location] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.id, locationId), eq(locations.tenantId, tenantId)))
    .limit(1)

  if (!location) throw new Error(`Location not found: locationId=${locationId} tenantId=${tenantId}`)

  let rejected = 0
  const validRows: ReturnType<typeof transformStatusDespesa>[] = []

  for (const row of rows) {
    try {
      if (isRateioNoise(row)) { rejected++; continue }
      const transformed = transformStatusDespesa(row, tenantId, locationId)

      if (!transformed.expenseDate) { rejected++; continue }
      if (!(Number(transformed.amount) > 0)) { rejected++; continue }
      if (!transformed.sourceId || transformed.sourceId === '--') { rejected++; continue }

      validRows.push({ ...transformed, rawIngestId } as typeof transformed)
    } catch {
      rejected++
    }
  }

  const BATCH = 100
  for (let i = 0; i < validRows.length; i += BATCH) {
    const chunk = validRows.slice(i, i + BATCH)
    await db
      .insert(factExpense)
      .values(chunk)
      .onConflictDoNothing()
  }

  // Watermark: maior DATA_MOV do lote
  const maxDate = rows.reduce((max, r) => {
    const d = (r.DATA_MOV ?? '').split('T')[0] ?? ''
    return d > max ? d : max
  }, '')

  if (maxDate) {
    await db
      .update(syncState)
      .set({ lastSyncedAt: new Date(maxDate), updatedAt: new Date() })
      .where(and(
        eq(syncState.locationId, locationId),
        eq(syncState.entity, 'despesa'),
      ))
  }

  await db
    .update(rawIngest)
    .set({ processedAt: new Date() })
    .where(eq(rawIngest.id, rawIngestId))

  console.log(`pipeline:despesa — inserted=${validRows.length} rejected=${rejected} locationId=${locationId}`)

  if (validRows.length > 0) {
    await enqueueAnalyticsRefresh()
  }
})

// ---------------------------------------------------------------------------
// pipeline:refresh-analytics
// REFRESH MATERIALIZED VIEW CONCURRENTLY nas 4 MVs do schema `analytics`.
// Disparado após batches de fato_venda. Singleton 30s evita corrida.
// ---------------------------------------------------------------------------
await boss.work('pipeline:refresh-analytics', { teamSize: 1, teamConcurrency: 1 }, async () => {
  const t0 = Date.now()
  await refreshAnalyticsMvs()
  console.log(`pipeline:refresh-analytics — refreshed in ${Date.now() - t0}ms`)
})

// ---------------------------------------------------------------------------
// pipeline:dim_produto — SCD2
// ---------------------------------------------------------------------------
await boss.work('pipeline:dim_produto', { teamSize: 2, teamConcurrency: 2 }, async (job) => {
  const { rawIngestId, tenantId, locationId } = job.data as { rawIngestId: string; tenantId: string; locationId: string }

  const [record] = await db
    .select()
    .from(rawIngest)
    .where(eq(rawIngest.id, rawIngestId))
    .limit(1)

  if (!record) throw new Error(`raw_ingest not found: ${rawIngestId}`)

  const [loc] = await db
    .select({ sourceLocationId: locations.sourceLocationId })
    .from(locations)
    .where(eq(locations.id, locationId))
    .limit(1)

  if (!loc) throw new Error(`Location not found: ${locationId}`)

  const today = new Date().toISOString().split('T')[0]!
  const payload = record.payload as DimProdutoPayload
  const rows = transformDimProduto(payload, tenantId, loc.sourceLocationId, today)

  let inserted = 0
  let versioned = 0

  for (const row of rows) {
    // Busca versão atual
    const [current] = await db
      .select()
      .from(dimProduct)
      .where(and(
        eq(dimProduct.tenantId, tenantId),
        eq(dimProduct.source, 'status'),
        eq(dimProduct.sourceProductId, row.sourceProductId),
        eq(dimProduct.isCurrent, true),
      ))
      .limit(1)

    if (!current) {
      // Novo produto
      await db.insert(dimProduct).values({ ...row, isCurrent: true, validTo: null })
      inserted++
      continue
    }

    // Verifica se algum campo SCD2 mudou
    const changed =
      current.name !== row.name ||
      current.categoryCode !== row.categoryCode ||
      current.groupId !== row.groupId ||
      current.subgroupId !== row.subgroupId ||
      current.isFuel !== row.isFuel ||
      current.active !== row.active

    if (!changed) continue

    // Fecha versão atual
    await db
      .update(dimProduct)
      .set({ validTo: today, isCurrent: false })
      .where(eq(dimProduct.id, current.id))

    // Insere nova versão
    await db.insert(dimProduct).values({ ...row, isCurrent: true, validTo: null })
    versioned++
  }

  await db
    .update(rawIngest)
    .set({ processedAt: new Date() })
    .where(eq(rawIngest.id, rawIngestId))

  console.log(`pipeline:dim_produto — inserted=${inserted} versioned=${versioned} tenantId=${tenantId}`)
})

process.on('SIGTERM', async () => {
  await boss.stop()
  process.exit(0)
})

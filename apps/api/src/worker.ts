import 'dotenv/config'
import PgBoss from 'pg-boss'
import { eq, and } from 'drizzle-orm'
import { db } from './db.js'
import { env } from './env.js'
import { rawIngest, fatoVenda, locations, syncState } from '@postoinsight/db'
import { transformStatusVenda, type StatusVendaRow } from './pipeline/transform-fato-venda.js'
import { transformDimProduto, type DimProdutoPayload } from './pipeline/transform-dim-produto.js'
import { dimProduto } from '@postoinsight/db'
import { sql } from 'drizzle-orm'

const boss = new PgBoss(env.DATABASE_URL)
await boss.start()

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
      if (!transformed.dataVenda) { rejected++; continue }
      if (Number(transformed.vlrTotal) < 0) { rejected++; continue }
      if (Number(transformed.qtdVenda) <= 0) { rejected++; continue }
      if (!transformed.sourceProdutoId) { rejected++; continue }

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
      .insert(fatoVenda)
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

  console.log(`pipeline:fato_venda — inserted=${validRows.length} rejected=${rejected} postoId=${postoId}`)
})

// ---------------------------------------------------------------------------
// pipeline:dim_produto — SCD2
// ---------------------------------------------------------------------------
await boss.work('pipeline:dim_produto', { teamSize: 2, teamConcurrency: 2 }, async (job) => {
  const { rawIngestId, tenantId } = job.data as { rawIngestId: string; tenantId: string }

  const [record] = await db
    .select()
    .from(rawIngest)
    .where(eq(rawIngest.id, rawIngestId))
    .limit(1)

  if (!record) throw new Error(`raw_ingest not found: ${rawIngestId}`)

  const today = new Date().toISOString().split('T')[0]!
  const payload = record.payload as DimProdutoPayload
  const rows = transformDimProduto(payload, tenantId, today)

  let inserted = 0
  let versioned = 0

  for (const row of rows) {
    // Busca versão atual
    const [current] = await db
      .select()
      .from(dimProduto)
      .where(and(
        eq(dimProduto.tenantId, tenantId),
        eq(dimProduto.source, 'status'),
        eq(dimProduto.sourceProdutoId, row.sourceProdutoId),
        eq(dimProduto.isCurrent, true),
      ))
      .limit(1)

    if (!current) {
      // Novo produto
      await db.insert(dimProduto).values({ ...row, isCurrent: true, validTo: null })
      inserted++
      continue
    }

    // Verifica se algum campo SCD2 mudou
    const changed =
      current.nome !== row.nome ||
      current.categoriaCodigo !== row.categoriaCodigo ||
      current.grupoId !== row.grupoId ||
      current.subgrupoId !== row.subgrupoId ||
      current.isCombustivel !== row.isCombustivel ||
      current.ativo !== row.ativo

    if (!changed) continue

    // Fecha versão atual
    await db
      .update(dimProduto)
      .set({ validTo: today, isCurrent: false })
      .where(eq(dimProduto.id, current.id))

    // Insere nova versão
    await db.insert(dimProduto).values({ ...row, isCurrent: true, validTo: null })
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

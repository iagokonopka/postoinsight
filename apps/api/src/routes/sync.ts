import type { FastifyPluginAsync } from 'fastify'
import { and, eq, isNull, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { locations, syncJobs, syncState } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'

/**
 * Formata duração entre dois timestamps no padrão "Xm Ys".
 * Retorna null se algum dos dois for nulo.
 */
function formatDuration(startedAt: Date | null, completedAt: Date | null): string | null {
  if (!startedAt || !completedAt) return null
  const ms = completedAt.getTime() - startedAt.getTime()
  if (ms < 0) return null
  const totalSecs = Math.floor(ms / 1000)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  return `${mins}m ${secs}s`
}

/**
 * Converte status do syncJob para o status de exibição na UI.
 * syncJobStatusEnum: 'pending' | 'running' | 'success' | 'error'
 */
function toDisplayStatus(status: string, completedAt: Date | null): string {
  if (status === 'success') {
    // Verifica se o sync foi feito nas últimas 48h
    const THRESHOLD_MS = 48 * 60 * 60 * 1000
    if (completedAt && Date.now() - completedAt.getTime() > THRESHOLD_MS) return 'warning'
    return 'success'
  }
  if (status === 'error') return 'failed'
  if (status === 'running' || status === 'pending') return 'running'
  return 'warning'
}

/**
 * GET /api/v1/sync/status
 * Dados da página de Sincronização: status por location + histórico de jobs.
 * Multitenancy: filtra sempre por req.tenantId — nunca aceita tenantId externo.
 */
export const syncRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  app.get('/status', async (req, reply) => {
    const tenantId = req.tenantId!

    // ------------------------------------------------------------------
    // 1. Locations do tenant
    // ------------------------------------------------------------------
    const locs = await db
      .select({ id: locations.id, name: locations.name })
      .from(locations)
      .where(and(eq(locations.tenantId, tenantId), isNull(locations.deletedAt)))
      .orderBy(locations.name)

    // ------------------------------------------------------------------
    // 2. Último sync_job por location (DISTINCT ON)
    // ------------------------------------------------------------------
    const latestJobs = await db
      .selectDistinctOn([syncJobs.locationId], {
        locationId:   syncJobs.locationId,
        status:       syncJobs.status,
        rowsIngested: syncJobs.rowsIngested,
        startedAt:    syncJobs.startedAt,
        completedAt:  syncJobs.completedAt,
        errorMessage: syncJobs.errorMessage,
      })
      .from(syncJobs)
      .where(eq(syncJobs.tenantId, tenantId))
      .orderBy(syncJobs.locationId, desc(syncJobs.createdAt))

    const jobByLocation = new Map(latestJobs.map(j => [j.locationId, j]))

    // ------------------------------------------------------------------
    // 3. next_run_at via sync_state (pode ter múltiplas entidades — pegar o menor)
    // ------------------------------------------------------------------
    const syncStates = await db
      .select({
        locationId: syncState.locationId,
        nextRunAt:  syncState.nextRunAt,
      })
      .from(syncState)
      .where(eq(syncState.tenantId, tenantId))

    // Para cada location, pegar o próximo nextRunAt mais próximo
    const nextRunByLocation = new Map<string, Date | null>()
    for (const s of syncStates) {
      const current = nextRunByLocation.get(s.locationId)
      if (!current && s.nextRunAt) {
        nextRunByLocation.set(s.locationId, s.nextRunAt)
      } else if (s.nextRunAt && current && s.nextRunAt < current) {
        nextRunByLocation.set(s.locationId, s.nextRunAt)
      }
    }

    // ------------------------------------------------------------------
    // 4. Montar locations result
    // ------------------------------------------------------------------
    const locationsResult = locs.map(loc => {
      const job     = jobByLocation.get(loc.id)
      const nextRun = nextRunByLocation.get(loc.id) ?? null

      return {
        id:          loc.id,
        nome:        loc.name,
        status:      job ? toDisplayStatus(job.status, job.completedAt ?? null) : 'warning',
        ultima_sync: job?.completedAt?.toISOString() ?? null,
        proxima_sync: nextRun?.toISOString() ?? null,
        registros:   job?.rowsIngested ?? 0,
        duracao:     formatDuration(job?.startedAt ?? null, job?.completedAt ?? null),
        erro:        job?.errorMessage ?? null,
      }
    })

    // ------------------------------------------------------------------
    // 5. Timestamp global do sync mais recente
    // ------------------------------------------------------------------
    const ultimaSyncGlobal = latestJobs
      .map(j => j.completedAt)
      .filter((d): d is Date => d !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null

    // ------------------------------------------------------------------
    // 6. Histórico: últimos 20 jobs de qualquer location do tenant
    // ------------------------------------------------------------------
    const recentJobs = await db
      .select({
        id:          syncJobs.id,
        locationId:  syncJobs.locationId,
        status:      syncJobs.status,
        rowsIngested: syncJobs.rowsIngested,
        startedAt:   syncJobs.startedAt,
        completedAt: syncJobs.completedAt,
        errorMessage: syncJobs.errorMessage,
      })
      .from(syncJobs)
      .where(eq(syncJobs.tenantId, tenantId))
      .orderBy(desc(syncJobs.createdAt))
      .limit(20)

    const locNameById = new Map(locs.map(l => [l.id, l.name]))

    const historico = recentJobs.map(j => ({
      id:        j.id,
      location:  locNameById.get(j.locationId) ?? j.locationId,
      inicio:    j.startedAt?.toISOString() ?? null,
      fim:       j.completedAt?.toISOString() ?? null,
      duracao:   formatDuration(j.startedAt ?? null, j.completedAt ?? null),
      registros: j.rowsIngested ?? 0,
      status:    j.status === 'success' ? 'success' : j.status === 'error' ? 'failed' : 'running',
      erro:      j.errorMessage ?? null,
    }))

    return reply.send({
      ultima_sync_global: ultimaSyncGlobal?.toISOString() ?? null,
      locations: locationsResult,
      historico,
    })
  })
}
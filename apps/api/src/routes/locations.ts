import type { FastifyPluginAsync } from 'fastify'
import { and, eq, isNull, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { locations, syncJobs } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'

/**
 * Derivar status da location com base no último sync_job.
 * - 'success' recente (< 48h) → 'online'
 * - 'error'                   → 'failed'
 * - sem job ou job > 48h      → 'warning'
 */
function deriveStatus(
  jobStatus: string | null,
  completedAt: Date | null,
): string {
  if (!jobStatus || !completedAt) return 'warning'
  const ageMs = Date.now() - completedAt.getTime()
  const THRESHOLD_MS = 48 * 60 * 60 * 1000
  if (jobStatus === 'error') return 'failed'
  if (ageMs > THRESHOLD_MS) return 'warning'
  return 'online'
}

/**
 * GET /api/v1/locations
 * Lista as locations do tenant ativo para o seletor de unidades na Topbar.
 * Multitenancy: filtra sempre por req.tenantId — nunca aceita tenantId externo.
 */
export const locationsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  app.get('/', async (req, reply) => {
    const tenantId = req.tenantId!

    // Busca locations ativas do tenant
    const rows = await db
      .select({
        id:   locations.id,
        name: locations.name,
      })
      .from(locations)
      .where(and(
        eq(locations.tenantId, tenantId),
        isNull(locations.deletedAt),
      ))
      .orderBy(locations.name)

    if (rows.length === 0) {
      return reply.send({ locations: [] })
    }

    // Busca o último sync_job de cada location (subquery via JS — N locations pequeno)
    const locationIds = rows.map(r => r.id)
    const latestJobs = await db
      .selectDistinctOn([syncJobs.locationId], {
        locationId:  syncJobs.locationId,
        status:      syncJobs.status,
        completedAt: syncJobs.completedAt,
      })
      .from(syncJobs)
      .where(eq(syncJobs.tenantId, tenantId))
      .orderBy(syncJobs.locationId, desc(syncJobs.createdAt))

    // Indexa por locationId para lookup O(1)
    const jobByLocation = new Map(latestJobs.map(j => [j.locationId, j]))

    const result = rows.map(loc => {
      const job = jobByLocation.get(loc.id)
      return {
        id:     loc.id,
        nome:   loc.name,
        status: deriveStatus(job?.status ?? null, job?.completedAt ?? null),
      }
    })

    return reply.send({ locations: result })
  })
}
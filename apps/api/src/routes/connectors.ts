import type { FastifyPluginAsync } from 'fastify'
import { and, eq, isNull, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { connectors, locations, syncState } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'

/**
 * GET /api/v1/connectors
 * Retorna metadados operacionais dos connectors do tenant.
 * NUNCA expõe agentToken nem credentials — apenas status e watermark.
 * Multitenancy: filtra sempre por req.tenantId.
 */
export const connectorsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  app.get('/', async (req, reply) => {
    const tenantId = req.tenantId!

    // Busca connectors ativos com nome da location
    const rows = await db
      .select({
        id:                  connectors.id,
        locationId:          connectors.locationId,
        locationName:        locations.name,
        erpSource:           connectors.erpSource,
        active:              connectors.active,
        lastSeenAt:          connectors.lastSeenAt,
        lastSyncAttemptAt:   connectors.lastSyncAttemptAt,
        lastSyncSuccessAt:   connectors.lastSyncSuccessAt,
      })
      .from(connectors)
      .innerJoin(locations, eq(connectors.locationId, locations.id))
      .where(and(
        eq(connectors.tenantId, tenantId),
        isNull(connectors.deletedAt),
      ))
      .orderBy(locations.name)

    if (rows.length === 0) {
      return reply.send({ connectors: [] })
    }

    // Busca watermark (lastSyncedAt da entidade 'venda') por location
    const locationIds = rows.map(r => r.locationId)
    const watermarks = await db
      .select({
        locationId:   syncState.locationId,
        lastSyncedAt: syncState.lastSyncedAt,
      })
      .from(syncState)
      .where(and(
        eq(syncState.tenantId, tenantId),
        eq(syncState.entity, 'venda'),
      ))

    const watermarkByLocation = new Map(watermarks.map(w => [w.locationId, w.lastSyncedAt]))

    return reply.send({
      connectors: rows.map(r => ({
        id:                r.id,
        locationId:        r.locationId,
        locationName:      r.locationName,
        erpSource:         r.erpSource,
        active:            r.active,
        lastSeenAt:        r.lastSeenAt ?? null,
        lastSyncAttemptAt: r.lastSyncAttemptAt ?? null,
        lastSyncSuccessAt: r.lastSyncSuccessAt ?? null,
        watermark:         watermarkByLocation.get(r.locationId) ?? null,
      })),
    })
  })
}
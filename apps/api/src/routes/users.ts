import type { FastifyPluginAsync } from 'fastify'
import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db.js'
import { users, tenantUsers, locations } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'

/**
 * GET /api/v1/users
 * Lista os usuários do tenant autenticado.
 * Multitenancy: filtra sempre por req.tenantId — nunca aceita tenantId externo.
 */
export const usersRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  app.get('/', async (req, reply) => {
    const tenantId = req.tenantId!

    const rows = await db
      .select({
        id:           tenantUsers.id,
        userId:       users.id,
        name:         users.name,
        email:        users.email,
        role:         tenantUsers.role,
        active:       tenantUsers.active,
        locationId:   tenantUsers.locationId,
        locationName: locations.name,
      })
      .from(tenantUsers)
      .innerJoin(users, eq(tenantUsers.userId, users.id))
      .leftJoin(locations, eq(tenantUsers.locationId, locations.id))
      .where(and(
        eq(tenantUsers.tenantId, tenantId),
        isNull(tenantUsers.deletedAt),
      ))
      .orderBy(tenantUsers.role, users.name)

    return reply.send({
      users: rows.map(r => ({
        id:           r.id,
        userId:       r.userId,
        name:         r.name,
        email:        r.email,
        role:         r.role,
        active:       r.active,
        locationId:   r.locationId,
        locationName: r.locationName ?? null,
      })),
    })
  })
}
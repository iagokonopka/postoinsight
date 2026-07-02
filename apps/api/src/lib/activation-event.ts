import { and, eq, isNull } from 'drizzle-orm'
import { db } from '../db.js'
import { tenants, usageEvents } from '@postoinsight/db'

/**
 * Marca a primeira visualização do painel da rede (evento de ativação).
 * Idempotente e exatamente-uma-vez por tenant: o UPDATE condicional em
 * onboarding_completed_at garante que o usage_event só é inserido uma vez.
 * Não dispara para platform users (impersonação). Best-effort: nunca lança.
 * Spec: docs/specs/auth-ativacao.md §5
 */
export async function markDashboardFirstView(
  tenantId: string,
  userId: string,
  isPlatformUser: boolean,
): Promise<void> {
  if (isPlatformUser) return
  try {
    const updated = await db.update(tenants)
      .set({ onboardingCompletedAt: new Date() })
      .where(and(
        eq(tenants.id, tenantId),
        isNull(tenants.onboardingCompletedAt),
      ))
      .returning({ id: tenants.id })

    if (updated.length === 1) {
      await db.insert(usageEvents).values({
        userId,
        tenantId,
        eventType: 'dashboard_first_view',
      })
    }
  } catch {
    // Evento de telemetria nunca deve quebrar a request principal.
  }
}

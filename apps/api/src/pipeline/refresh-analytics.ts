import { sql } from 'drizzle-orm'
import { db } from '../db.js'

/**
 * Atualiza as 4 materialized views do schema `analytics` que servem
 * os dashboards. Usa REFRESH ... CONCURRENTLY (não bloqueia leituras).
 *
 * `CONCURRENTLY` exige que cada MV tenha um unique index (criados em
 * 0002_create_analytics_mvs.sql).
 *
 * Primeira execução: a MV foi criada com WITH NO DATA → o primeiro
 * REFRESH CONCURRENTLY falha. Por isso fazemos o "primeiro carregamento"
 * sem CONCURRENTLY e depois mantemos com CONCURRENTLY.
 */

const MVS = [
  'analytics.mv_vendas_diario',
  'analytics.mv_combustivel_diario',
  'analytics.mv_conveniencia_diario',
  'analytics.mv_dre_mensal',
] as const

export async function refreshAnalyticsMvs(): Promise<void> {
  for (const mv of MVS) {
    // ispopulated = false → primeira carga, sem CONCURRENTLY
    const populated = await db.execute(sql.raw(
      `SELECT ispopulated FROM pg_matviews WHERE schemaname || '.' || matviewname = '${mv}'`
    ))
    const isPopulated = (populated as unknown as Array<{ ispopulated: boolean }>)[0]?.ispopulated === true

    if (isPopulated) {
      await db.execute(sql.raw(`REFRESH MATERIALIZED VIEW CONCURRENTLY ${mv}`))
    } else {
      await db.execute(sql.raw(`REFRESH MATERIALIZED VIEW ${mv}`))
    }
  }
}

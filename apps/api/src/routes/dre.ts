import type { FastifyPluginAsync } from 'fastify'
import { and, eq, inArray, sql, sum, desc } from 'drizzle-orm'
import { db } from '../db.js'
import { mvDreMensal as mv } from '@postoinsight/db'
import { requireTenantSession } from '../lib/auth.js'
import {
  BadQueryError, parseUuidArray, parseAnoMesArray, n, pct, round2,
} from '../lib/queryParsers.js'

const SEGMENTOS = ['combustivel', 'lubrificantes', 'servicos', 'conveniencia'] as const

/**
 * Endpoints de DRE Mensal — `analytics.mv_dre_mensal`.
 * Specs: docs/specs/dre-mensal.md
 *
 * Linha consolidada (`_total`) é calculada na API — nunca armazenada.
 */
export const dreRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('preHandler', requireTenantSession)

  // ---------------------------------------------------------------------
  // GET /api/v1/dre/mensal
  // ---------------------------------------------------------------------
  app.get('/mensal', async (req, reply) => {
    const tenantId = req.tenantId!
    let meses: string[]
    let locationIds: string[] | undefined
    try {
      meses       = parseAnoMesArray((req.query as any).meses, 'meses')
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .select({
        segmento:        mv.segmento,
        ano_mes:         mv.anoMes,
        receita_bruta:   sum(mv.receitaBruta).mapWith(Number),
        descontos:       sum(mv.descontos).mapWith(Number),
        receita_liquida: sum(mv.receitaLiquida).mapWith(Number),
        cmv:             sum(mv.cmv).mapWith(Number),
        margem_bruta:    sum(mv.margemBruta).mapWith(Number),
      })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        inArray(mv.anoMes, meses),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .groupBy(mv.segmento, mv.anoMes)

    type SegLine = typeof SEGMENTOS[number] | '_total'
    type Periodo = {
      receita_bruta: number
      descontos: number
      receita_liquida: number
      cmv: number
      margem_bruta: number
      margem_pct: number
    }

    function emptyPeriodo(): Periodo {
      return { receita_bruta: 0, descontos: 0, receita_liquida: 0, cmv: 0, margem_bruta: 0, margem_pct: 0 }
    }

    // Inicializa estrutura: segmento → mês → métricas
    const linhasMap = new Map<string, Record<string, Periodo>>()
    for (const seg of SEGMENTOS) {
      const periodos: Record<string, Periodo> = {}
      for (const m of meses) periodos[m] = emptyPeriodo()
      linhasMap.set(seg, periodos)
    }
    const totalPeriodos: Record<string, Periodo> = {}
    for (const m of meses) totalPeriodos[m] = emptyPeriodo()

    for (const r of rows) {
      const seg = r.segmento as string
      const segPeriodos = linhasMap.get(seg)
      if (!segPeriodos) continue   // ignora segmentos não esperados
      const p = segPeriodos[r.ano_mes]
      const t = totalPeriodos[r.ano_mes]
      if (!p || !t) continue
      p.receita_bruta   = n(r.receita_bruta)
      p.descontos       = n(r.descontos)
      p.receita_liquida = n(r.receita_liquida)
      p.cmv             = n(r.cmv)
      p.margem_bruta    = n(r.margem_bruta)
      p.margem_pct      = pct(p.margem_bruta, p.receita_liquida)

      t.receita_bruta   += p.receita_bruta
      t.descontos       += p.descontos
      t.receita_liquida += p.receita_liquida
      t.cmv             += p.cmv
      t.margem_bruta    += p.margem_bruta
    }

    // Calcula margem_pct do total e arredonda valores monetários
    function finalizePeriodos(map: Record<string, Periodo>) {
      const out: Record<string, Periodo> = {}
      for (const m of Object.keys(map)) {
        const p = map[m]!
        out[m] = {
          receita_bruta:   round2(p.receita_bruta),
          descontos:       round2(p.descontos),
          receita_liquida: round2(p.receita_liquida),
          cmv:             round2(p.cmv),
          margem_bruta:    round2(p.margem_bruta),
          margem_pct:      pct(p.margem_bruta, p.receita_liquida),
        }
      }
      return out
    }

    const linhas: Array<{ segmento: SegLine; periodos: Record<string, Periodo> }> =
      SEGMENTOS.map(seg => ({
        segmento: seg,
        periodos: finalizePeriodos(linhasMap.get(seg)!),
      }))
    linhas.push({
      segmento: '_total',
      periodos: finalizePeriodos(totalPeriodos),
    })

    return reply.send({
      meses,
      locations: locationIds ?? 'all',
      linhas,
    })
  })

  // ---------------------------------------------------------------------
  // GET /api/v1/dre/meses-disponiveis
  // ---------------------------------------------------------------------
  app.get('/meses-disponiveis', async (req, reply) => {
    const tenantId = req.tenantId!
    let locationIds: string[] | undefined
    try {
      locationIds = parseUuidArray((req.query as any).location_id, 'location_id')
    } catch (err) {
      if (err instanceof BadQueryError) return reply.status(400).send({ error: err.message })
      throw err
    }

    const rows = await db
      .selectDistinct({ ano_mes: mv.anoMes })
      .from(mv)
      .where(and(
        eq(mv.tenantId, tenantId),
        locationIds ? inArray(mv.locationId, locationIds) : undefined,
      ))
      .orderBy(desc(mv.anoMes))
      .limit(24)

    return reply.send({ meses: rows.map(r => r.ano_mes) })
  })
}

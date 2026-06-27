import { eq } from 'drizzle-orm'
import { db } from '../db.js'
import { productClassification as pc } from '@postoinsight/db'

/**
 * Curadoria de apresentação de produto aplicada em tempo de leitura (Plano 2b).
 * Spec: docs/specs/produto-classificacao.md
 *
 * Override NÃO-DESTRUTIVO: canonical/raw nunca são reescritos. As rotas de
 * produto (fuel/convenience) carregam este mapa e fazem merge em memória.
 */

export type ProductOverride = {
  segmentOverride: string | null
  displayGroup:    string | null
  customLabel:     string | null
  visible:         boolean
  sortOrder:       number | null
}

export type ProductClassificationMap = Map<string, ProductOverride>

/** Monta a classification_key canônica ("<nível>:<código>"). */
export function classificationKey(level: 'product' | 'group' | 'subgroup' | 'category', code: string | number): string {
  return `${level}:${code}`
}

/** Carrega o mapa de classificação de produto do tenant (1 query). */
export async function loadProductClassification(tenantId: string): Promise<ProductClassificationMap> {
  const rows = await db
    .select({
      key:     pc.classificationKey,
      segment: pc.segmentOverride,
      display: pc.displayGroup,
      label:   pc.customLabel,
      visible: pc.visible,
      order:   pc.sortOrder,
    })
    .from(pc)
    .where(eq(pc.tenantId, tenantId))

  const map: ProductClassificationMap = new Map()
  for (const r of rows) {
    map.set(r.key, {
      segmentOverride: r.segment,
      displayGroup:    r.display,
      customLabel:     r.label,
      visible:         r.visible,
      sortOrder:       r.order,
    })
  }
  return map
}

// ---------------------------------------------------------------------------
// Curadoria de apresentação de produtos (Plano 2b).
// Spec: docs/specs/produto-classificacao.md
// ---------------------------------------------------------------------------

import type { Segment } from './sync.js'

/**
 * Valores válidos de `segment_override` em app.product_classification.
 * Reusa exatamente o domínio de `Segment` (valores persistidos em PT, ADR-018).
 * `null` = mantém o segmento derivado por deriveSegment (sem override).
 */
export const SEGMENT_VALUES = [
  'combustivel',
  'lubrificantes',
  'servicos',
  'conveniencia',
] as const satisfies readonly Segment[]

export function isSegment(value: unknown): value is Segment {
  return typeof value === 'string' && (SEGMENT_VALUES as readonly string[]).includes(value)
}

/** Níveis aceitos na classification_key ("<nível>:<código>"). */
export const CLASSIFICATION_LEVELS = ['product', 'group', 'subgroup', 'category'] as const
export type ClassificationLevel = (typeof CLASSIFICATION_LEVELS)[number]

/**
 * Valida o formato da classification_key ("<nível>:<código>"). O código pode ser
 * qualquer string não-vazia (ids numéricos do ERP ou códigos alfanuméricos).
 */
export function isClassificationKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  const idx = value.indexOf(':')
  if (idx <= 0 || idx === value.length - 1) return false
  const level = value.slice(0, idx)
  return (CLASSIFICATION_LEVELS as readonly string[]).includes(level)
}

/** Monta a chave canônica a partir de nível + código. */
export function makeClassificationKey(level: ClassificationLevel, code: string | number): string {
  return `${level}:${code}`
}

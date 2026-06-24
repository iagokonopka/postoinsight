// ---------------------------------------------------------------------------
// Classificação contábil de despesas (Plano 2a).
// Spec: docs/specs/admin-mapping.md
// ---------------------------------------------------------------------------

/**
 * Tipos contábeis aplicáveis a um grupo financeiro de despesa.
 * Apenas `despesa_operacional` entra no Resultado Operacional (subtrai da
 * Margem Bruta). Os demais são informativos. Grupos sem registro são tratados
 * como `nao_classificado` (default, nunca persistido) — passthrough que nunca
 * entra no resultado por engano.
 */
export const ACCOUNTING_TYPES = [
  'despesa_operacional',
  'despesa_financeira',
  'imposto',
  'investimento',
  'cmv',
  'nao_operacional',
] as const

export type AccountingType = (typeof ACCOUNTING_TYPES)[number]

/** Default lógico para grupos sem classificação (não persistido no banco). */
export const UNCLASSIFIED = 'nao_classificado' as const

/** Único tipo que entra no Resultado Operacional. */
export const OPERATIONAL_TYPE: AccountingType = 'despesa_operacional'

export function isAccountingType(value: unknown): value is AccountingType {
  return typeof value === 'string' && (ACCOUNTING_TYPES as readonly string[]).includes(value)
}

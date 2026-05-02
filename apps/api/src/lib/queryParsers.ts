/**
 * Helpers para parsear query params dos endpoints de dashboard.
 * - Datas: YYYY-MM-DD
 * - Arrays: aceitos como `?location_id=a&location_id=b` ou `?location_id=a,b`
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const ANO_MES_RE = /^\d{4}-(0[1-9]|1[0-2])$/

export function parseDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw new BadQueryError(`Parâmetro "${field}" deve estar no formato YYYY-MM-DD`)
  }
  return value
}

export function parseDateRange(qs: Record<string, unknown>): { dataInicio: string; dataFim: string } {
  const dataInicio = parseDate(qs.data_inicio, 'data_inicio')
  const dataFim    = parseDate(qs.data_fim,    'data_fim')
  if (dataInicio > dataFim) {
    throw new BadQueryError('"data_inicio" deve ser anterior ou igual a "data_fim"')
  }
  return { dataInicio, dataFim }
}

export function parseUuidArray(value: unknown, field: string): string[] | undefined {
  if (value == null || value === '') return undefined
  const raw: string[] = Array.isArray(value)
    ? value.flatMap(v => String(v).split(','))
    : String(value).split(',')
  const cleaned = raw.map(s => s.trim()).filter(Boolean)
  for (const v of cleaned) {
    if (!UUID_RE.test(v)) {
      throw new BadQueryError(`Parâmetro "${field}" contém UUID inválido: ${v}`)
    }
  }
  return cleaned.length > 0 ? cleaned : undefined
}

export function parseIntArray(value: unknown, field: string): number[] | undefined {
  if (value == null || value === '') return undefined
  const raw: string[] = Array.isArray(value)
    ? value.flatMap(v => String(v).split(','))
    : String(value).split(',')
  const cleaned = raw.map(s => s.trim()).filter(Boolean)
  const ints: number[] = []
  for (const v of cleaned) {
    const n = Number(v)
    if (!Number.isInteger(n)) {
      throw new BadQueryError(`Parâmetro "${field}" deve conter apenas inteiros`)
    }
    ints.push(n)
  }
  return ints.length > 0 ? ints : undefined
}

export function parseEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  field: string,
  fallback?: T,
): T | undefined {
  if (value == null || value === '') return fallback
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new BadQueryError(`Parâmetro "${field}" deve ser um de: ${allowed.join(', ')}`)
  }
  return value as T
}

export function parseAnoMesArray(value: unknown, field: string): string[] {
  if (value == null || value === '') {
    throw new BadQueryError(`Parâmetro "${field}" é obrigatório`)
  }
  const raw: string[] = Array.isArray(value)
    ? value.flatMap(v => String(v).split(','))
    : String(value).split(',')
  const cleaned = raw.map(s => s.trim()).filter(Boolean)
  if (cleaned.length === 0) {
    throw new BadQueryError(`Parâmetro "${field}" deve conter ao menos um mês`)
  }
  if (cleaned.length > 12) {
    throw new BadQueryError(`Parâmetro "${field}" suporta no máximo 12 meses`)
  }
  for (const v of cleaned) {
    if (!ANO_MES_RE.test(v)) {
      throw new BadQueryError(`Parâmetro "${field}" deve estar no formato YYYY-MM: ${v}`)
    }
  }
  return cleaned
}

export class BadQueryError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BadQueryError'
  }
}

export function n(value: string | number | null | undefined): number {
  if (value == null) return 0
  const x = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(x) ? x : 0
}

export function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 10000) / 100
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100
}

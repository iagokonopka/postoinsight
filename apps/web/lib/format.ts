const brl = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const num = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 2,
})

const pct = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 2,
})

export function formatCurrency(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return brl.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return '—'
  return num.format(value)
}

export function formatPercent(value: number | null | undefined): string {
  // Spec retorna percentuais como número (ex: 35.87). Convertemos para fração.
  if (value == null || Number.isNaN(value)) return '—'
  return pct.format(value / 100)
}

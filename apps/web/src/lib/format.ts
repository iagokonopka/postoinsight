// Number and date formatting utilities — all locale pt-BR

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })
const NUM  = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
const DEC2 = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** R$ 1.234,56 */
export function fCurrency(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return BRL.format(v)
}

/** 1.234 (sem decimais) */
export function fInt(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return NUM.format(v)
}

/** 1.234,56 */
export function fDec(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return DEC2.format(v)
}

/** 12,3% */
export function fPct(v: number | null | undefined, decimals = 1): string {
  if (v == null || isNaN(v)) return '—'
  return v.toFixed(decimals).replace('.', ',') + '%'
}

/** 1.234 L (volumes) */
export function fLiters(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return fInt(v) + ' L'
}

/** Compact BRL: R$ 1,2 mi | R$ 234k | R$ 1.234 */
export function fCompact(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  if (Math.abs(v) >= 1_000_000) return 'R$ ' + (v / 1_000_000).toFixed(2).replace('.', ',') + ' mi'
  if (Math.abs(v) >= 1_000)     return 'R$ ' + Math.round(v / 1_000).toLocaleString('pt-BR') + 'k'
  return 'R$ ' + Math.round(v).toLocaleString('pt-BR')
}

const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_LONG  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

/** "Mai/25" from "2025-05-01" or "2025-05" */
export function fMonthShort(dateStr: string): string {
  const normalized = dateStr.length === 7 ? dateStr + '-01' : dateStr
  const d = new Date(normalized + 'T00:00:00')
  return `${MONTHS_SHORT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`
}

/** "Maio de 2025" */
export function fMonthLong(year: number, monthIdx: number): string {
  return `${MONTHS_LONG[monthIdx]} de ${year}`
}

/** "01/05" from "2025-05-01" */
export function fDayMonth(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
}

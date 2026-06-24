// Date range helpers — converts Period → { start_date, end_date } strings
import type { Period } from '@/context/AppContext'

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function periodToRange(period: Period): { start_date: string; end_date: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === 'hoje') {
    const s = fmt(today)
    return { start_date: s, end_date: s }
  }

  if (period === 'semana') {
    const dow = today.getDay() // 0=Sun
    const mon = new Date(today)
    mon.setDate(today.getDate() - ((dow + 6) % 7)) // Monday
    return { start_date: fmt(mon), end_date: fmt(today) }
  }

  if (period === 'mes') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return { start_date: fmt(first), end_date: fmt(today) }
  }

  // mes-ant
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const last  = new Date(today.getFullYear(), today.getMonth(), 0)
  return { start_date: fmt(first), end_date: fmt(last) }
}

/** Range imediatamente anterior, com a mesma quantidade de dias (para comparação de KPIs). */
export function previousRange(period: Period): { start_date: string; end_date: string } {
  const { start_date, end_date } = periodToRange(period)
  const start = new Date(start_date + 'T00:00:00')
  const end   = new Date(end_date + 'T00:00:00')
  const days  = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const prevEnd   = new Date(start); prevEnd.setDate(start.getDate() - 1)
  const prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - (days - 1))
  return { start_date: fmt(prevStart), end_date: fmt(prevEnd) }
}

export function periodLabel(period: Period): string {
  const labels: Record<Period, string> = {
    hoje:    'Hoje',
    semana:  'Esta semana',
    mes:     'Este mês',
    'mes-ant': 'Mês anterior',
  }
  return labels[period]
}

// Build URL query string for API calls
export function buildQS(params: Record<string, string | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '')
  if (!entries.length) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&')
}

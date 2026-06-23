// Date range helpers — converts Period → { data_inicio, data_fim } strings
import type { Period } from '@/context/AppContext'

function fmt(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function periodToRange(period: Period): { data_inicio: string; data_fim: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (period === 'hoje') {
    const s = fmt(today)
    return { data_inicio: s, data_fim: s }
  }

  if (period === 'semana') {
    const dow = today.getDay() // 0=Sun
    const mon = new Date(today)
    mon.setDate(today.getDate() - ((dow + 6) % 7)) // Monday
    return { data_inicio: fmt(mon), data_fim: fmt(today) }
  }

  if (period === 'mes') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    return { data_inicio: fmt(first), data_fim: fmt(today) }
  }

  // mes-ant
  const first = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const last  = new Date(today.getFullYear(), today.getMonth(), 0)
  return { data_inicio: fmt(first), data_fim: fmt(last) }
}

/** Range imediatamente anterior, com a mesma quantidade de dias (para comparação de KPIs). */
export function previousRange(period: Period): { data_inicio: string; data_fim: string } {
  const { data_inicio, data_fim } = periodToRange(period)
  const start = new Date(data_inicio + 'T00:00:00')
  const end   = new Date(data_fim + 'T00:00:00')
  const days  = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1
  const prevEnd   = new Date(start); prevEnd.setDate(start.getDate() - 1)
  const prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - (days - 1))
  return { data_inicio: fmt(prevStart), data_fim: fmt(prevEnd) }
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

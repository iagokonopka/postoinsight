import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, ChevronRight, ChevronLeft, Sun, Moon, AlignJustify } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useApp, type Period } from '@/context/AppContext'
import { apiUrl } from '@/lib/api'
import { useToast } from '@/components/ui/Toast'
import { getInitials } from '@/lib/auth'
import { useLocations } from '@/hooks/useLocations'
import { applyTheme, applyDensity, getStoredTheme, getStoredDensity, type Theme, type Density } from '@/lib/theme'

// Pages that hide period tabs and location select
const PAGES_NO_FILTER = ['/dre', '/sincronizacao', '/configuracoes']
// Pages that hide ONLY location select (but show period tabs)
const PAGES_NO_LOCATION: string[] = []

const PAGE_LABELS: Record<string, string> = {
  '/':              'Visão Geral',
  '/combustivel':   'Combustível',
  '/arla':          'Arla 32',
  '/lubrificantes': 'Lubrificantes',
  '/conveniencia':  'Conveniência',
  '/dre':           'DRE Mensal',
  '/sincronizacao': 'Sincronização',
  '/configuracoes': 'Configurações',
}

// Pages that hide period/location filters
const PAGES_EXTRA_NO_FILTER = ['/arla', '/lubrificantes']

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'hoje',    label: 'Hoje' },
  { value: 'semana',  label: 'Semana' },
  { value: 'mes',     label: 'Mês' },
  { value: 'mes-ant', label: 'Mês ant.' },
]

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

export function Topbar() {
  const { user } = useAuth()
  const { period, setPeriod, locationId, setLocationId, dreYear, dreMonthIdx, setDreYear, setDreMonthIdx, dreShift } = useApp()
  const { data: locations } = useLocations()
  const { pathname } = useLocation()
  const toast = useToast()
  const [theme,   setThemeState]   = useState<Theme>(getStoredTheme)
  const [density, setDensityState] = useState<Density>(getStoredDensity)

  function toggleTheme() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    applyTheme(next)
    setThemeState(next)
  }

  function toggleDensity() {
    const next: Density = density === 'comfortable' ? 'compact' : 'comfortable'
    applyDensity(next)
    setDensityState(next)
  }

  const pageName = PAGE_LABELS[pathname] ?? 'PostoInsight'
  const noFilter = PAGES_NO_FILTER.includes(pathname) || PAGES_EXTRA_NO_FILTER.includes(pathname)
  const showPeriodTabs    = !noFilter
  const showLocationSelect = !noFilter && !PAGES_NO_LOCATION.includes(pathname)
  const showDreToolbar = pathname === '/dre'

  const locationLabel = locationId
    ? locations?.find(l => l.id === locationId)?.name ?? 'Unidade'
    : 'Todas as unidades'
  const periodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label ?? 'Mês'
  const crumbContext = showPeriodTabs ? `${locationLabel} · ${periodLabel}` : undefined

  const initials = user ? getInitials(user) : '??'

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 24px',
      background: 'hsl(var(--card))',
      borderBottom: '1px solid hsl(var(--border))',
      flexShrink: 0,
    }}>
      {/* Crumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: 'hsl(var(--muted-foreground))',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        <b style={{ color: 'hsl(var(--foreground))', fontWeight: 600 }}>{pageName}</b>
        {crumbContext && (
          <>
            <ChevronRight size={12} style={{ opacity: 0.5 }} />
            <span>{crumbContext}</span>
          </>
        )}
      </div>

      {/* Right side */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>

        {/* Period tabs */}
        {showPeriodTabs && (
          <div style={{
            display: 'inline-flex',
            padding: '3px',
            background: 'hsl(var(--muted))',
            borderRadius: '7px',
            gap: '2px',
          }}>
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                style={{
                  height: '28px',
                  padding: '0 12px',
                  border: 'none',
                  background: period === opt.value ? 'hsl(var(--card))' : 'transparent',
                  fontFamily: 'inherit',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: period === opt.value ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  boxShadow: period === opt.value ? 'var(--shadow-sm)' : 'none',
                  transition: 'background 0.12s, color 0.12s',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* DRE toolbar */}
        {showDreToolbar && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => dreShift(-1)} style={dreMonthBtnStyle}>
              <ChevronLeft size={14} />
            </button>
            <select
              value={dreMonthIdx}
              onChange={e => setDreMonthIdx(Number(e.target.value))}
              style={{ ...selectStyle, minWidth: '130px' }}
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={dreYear}
              onChange={e => setDreYear(Number(e.target.value))}
              style={{ ...selectStyle, minWidth: '90px' }}
            >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={() => dreShift(1)} style={dreMonthBtnStyle}>
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Location select */}
        {showLocationSelect && (
          <select
            value={locationId ?? ''}
            onChange={e => setLocationId(e.target.value || null)}
            style={{ ...selectStyle, minWidth: '170px' }}
          >
            <option value="">Todas as unidades</option>
            {locations?.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
        )}

        {/* Sync button */}
        <SyncButton toast={toast} />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
          style={{ ...iconBtnStyle }}
          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {theme === 'dark' ? <Sun size={15} strokeWidth={1.8} /> : <Moon size={15} strokeWidth={1.8} />}
        </button>

        {/* Density toggle */}
        <button
          onClick={toggleDensity}
          title={density === 'compact' ? 'Densidade confortável' : 'Densidade compacta'}
          style={{ ...iconBtnStyle }}
          onMouseEnter={e => (e.currentTarget.style.background = 'hsl(var(--muted))')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <AlignJustify size={15} strokeWidth={1.8} />
        </button>

        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '999px',
          background: 'linear-gradient(135deg, #0073BB, #6B40C4)',
          color: 'white',
          fontSize: '11px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {initials}
        </div>
      </div>
    </header>
  )
}

// ─── Sync Button ─────────────────────────────────────────────────────────────

function SyncButton({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    if (syncing) return
    setSyncing(true)
    try {
      const res = await fetch(apiUrl('/api/v1/sync/trigger'), { method: 'POST', credentials: 'include' })
      if (res.ok) {
        toast.success('Sincronização iniciada com sucesso.')
      } else {
        toast.info('Não foi possível disparar a sincronização.')
      }
    } catch {
      toast.info('Erro de conexão ao sincronizar.')
    } finally {
      setTimeout(() => setSyncing(false), 2000)
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        height: '34px',
        padding: '0 12px',
        borderRadius: '6px',
        fontFamily: 'inherit',
        fontSize: '13px',
        fontWeight: 500,
        cursor: syncing ? 'not-allowed' : 'pointer',
        border: '1px solid hsl(var(--border))',
        background: 'hsl(var(--card))',
        color: 'hsl(var(--foreground))',
        opacity: syncing ? 0.6 : 1,
        transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (!syncing) e.currentTarget.style.background = 'hsl(var(--muted))' }}
      onMouseLeave={e => (e.currentTarget.style.background = 'hsl(var(--card))')}
    >
      <RefreshCw size={14} strokeWidth={1.8} style={{ animation: syncing ? 'spin 0.7s linear infinite' : 'none' }} />
      {syncing ? 'Sincronizando…' : 'Sincronizar'}
    </button>
  )
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const iconBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: 'none',
  background: 'transparent',
  color: 'hsl(var(--muted-foreground))',
  borderRadius: '6px',
  cursor: 'pointer',
  flexShrink: 0,
  transition: 'background 0.12s, color 0.12s',
}

const selectStyle: React.CSSProperties = {
  height: '34px',
  padding: '0 28px 0 12px',
  borderRadius: '6px',
  border: '1px solid hsl(var(--input))',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--foreground))',
  fontFamily: 'inherit',
  fontSize: '13px',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
}

const dreMonthBtnStyle: React.CSSProperties = {
  width: '34px',
  height: '34px',
  border: '1px solid hsl(var(--border))',
  borderRadius: '6px',
  background: 'hsl(var(--card))',
  color: 'hsl(var(--muted-foreground))',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

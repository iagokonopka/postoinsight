// Global app state — period, location filter, sync badge
import { createContext, useContext, useState, type ReactNode } from 'react'

export type Period = 'hoje' | 'semana' | 'mes' | 'mes-ant'

interface AppContextValue {
  period: Period
  setPeriod: (p: Period) => void
  locationId: string | null  // null = todas as unidades
  setLocationId: (id: string | null) => void
  // DRE specific
  dreYear: number
  dreMonthIdx: number  // 0-11
  setDreYear: (y: number) => void
  setDreMonthIdx: (m: number) => void
  dreShift: (delta: number) => void
}

const now = new Date()

const AppContext = createContext<AppContextValue>({
  period: 'mes',
  setPeriod: () => {},
  locationId: null,
  setLocationId: () => {},
  dreYear: now.getFullYear(),
  dreMonthIdx: now.getMonth(),
  setDreYear: () => {},
  setDreMonthIdx: () => {},
  dreShift: () => {},
})

export function AppProvider({ children }: { children: ReactNode }) {
  const [period, setPeriod] = useState<Period>('mes')
  const [locationId, setLocationId] = useState<string | null>(null)
  const [dreYear, setDreYear] = useState(now.getFullYear())
  const [dreMonthIdx, setDreMonthIdx] = useState(now.getMonth())

  const dreShift = (delta: number) => {
    let m = dreMonthIdx + delta
    let y = dreYear
    if (m > 11) { m = 0; y++ }
    if (m < 0) { m = 11; y-- }
    setDreMonthIdx(m)
    setDreYear(y)
  }

  return (
    <AppContext.Provider value={{
      period, setPeriod,
      locationId, setLocationId,
      dreYear, dreMonthIdx,
      setDreYear, setDreMonthIdx,
      dreShift,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  return useContext(AppContext)
}

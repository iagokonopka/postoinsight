import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { fetchMe, type AuthUser } from '@/lib/auth'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  refetch: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refetch: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refetch = async () => {
    const me = await fetchMe()
    setUser(me)
  }

  useEffect(() => {
    fetchMe()
      .then(setUser)
      .finally(() => setLoading(false))
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

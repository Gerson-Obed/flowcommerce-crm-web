import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService } from '@/services'
import { UNAUTHORIZED_EVENT } from '@/services/http'
import { tokenStorage } from '@/lib/token-storage'
import type { LoginPayload, ProfileInput, User } from '@/types/domain'

interface AuthState {
  user: User | null
  loading: boolean
  login: (p: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (p: ProfileInput) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(() => !!tokenStorage.get())

  useEffect(() => {
    if (!tokenStorage.get()) return
    authService
      .me()
      .then(setUser)
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => setUser(null)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload)
    tokenStorage.set(res.token)
    setUser(res.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      tokenStorage.clear()
      setUser(null)
    }
  }, [])

  const updateProfile = useCallback(async (input: ProfileInput) => {
    setUser(await authService.updateProfile(input))
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout, updateProfile }), [user, loading, login, logout, updateProfile])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

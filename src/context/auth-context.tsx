import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { TOKEN_REFRESH_THRESHOLD_MS } from '@/lib/constants'
import { setTokenGetter } from '@/api/client'
import type { AuthTokens } from '@/lib/types'

interface AuthContextValue {
  user: { email: string } | null
  idToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (tokens: AuthTokens) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEYS = {
  idToken: 'auth_id_token',
  accessToken: 'auth_access_token',
  refreshToken: 'auth_refresh_token',
  expiresAt: 'auth_expires_at',
} as const

function decodeEmail(idToken: string): string | null {
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]))
    return payload.email || null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [idToken, setIdToken] = useState<string | null>(null)
  const [user, setUser] = useState<{ email: string } | null>(null)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearAuth = useCallback(() => {
    setIdToken(null)
    setUser(null)
    localStorage.removeItem(STORAGE_KEYS.idToken)
    localStorage.removeItem(STORAGE_KEYS.accessToken)
    localStorage.removeItem(STORAGE_KEYS.refreshToken)
    localStorage.removeItem(STORAGE_KEYS.expiresAt)
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const scheduleRefresh = useCallback((expiresAt: number) => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
    }
    const timeUntilRefresh = expiresAt - Date.now() - TOKEN_REFRESH_THRESHOLD_MS
    if (timeUntilRefresh <= 0) {
      // Token already near expiry — for now, just clear auth
      // Full refresh flow would call Cognito here
      clearAuth()
      return
    }
    refreshTimerRef.current = setTimeout(() => {
      // TODO: Implement token refresh via backend/Cognito
      clearAuth()
    }, timeUntilRefresh)
  }, [clearAuth])

  const login = useCallback((tokens: AuthTokens) => {
    const expiresAt = Date.now() + tokens.expires_in * 1000
    localStorage.setItem(STORAGE_KEYS.idToken, tokens.id_token)
    localStorage.setItem(STORAGE_KEYS.accessToken, tokens.access_token)
    localStorage.setItem(STORAGE_KEYS.refreshToken, tokens.refresh_token)
    localStorage.setItem(STORAGE_KEYS.expiresAt, String(expiresAt))

    setIdToken(tokens.id_token)
    const email = decodeEmail(tokens.id_token)
    setUser(email ? { email } : null)
    scheduleRefresh(expiresAt)
  }, [scheduleRefresh])

  const logout = useCallback(() => {
    clearAuth()
  }, [clearAuth])

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_KEYS.idToken)
    const storedExpiresAt = localStorage.getItem(STORAGE_KEYS.expiresAt)

    if (storedToken && storedExpiresAt) {
      const expiresAt = Number(storedExpiresAt)
      if (expiresAt > Date.now()) {
        setIdToken(storedToken)
        const email = decodeEmail(storedToken)
        setUser(email ? { email } : null)
        scheduleRefresh(expiresAt)
      } else {
        clearAuth()
      }
    }
    setIsLoading(false)
  }, [clearAuth, scheduleRefresh])

  // Wire up the API client token getter
  useEffect(() => {
    setTokenGetter(() => idToken)
  }, [idToken])

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        isAuthenticated: idToken !== null,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

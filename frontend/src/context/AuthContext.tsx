import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  clearAuthSession,
  fetchRemoteUserData,
  getStoredToken,
  getStoredUser,
  loginAccount,
  pushRemoteUserData,
  registerAccount,
  saveAuthSession,
} from '../lib/api/client'
import {
  applyUserDataSnapshot,
  collectUserDataSnapshot,
  isUserDataSnapshot,
  scheduleUserDataPush,
} from '../lib/userDataSync'

import type { AuthUser } from '../types/userData'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  syncing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, verificationCode: string, displayName?: string) => Promise<void>
  logout: () => void
  pushNow: () => Promise<void>
  refreshFromServer: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [loading, setLoading] = useState(Boolean(getStoredToken()))
  const [syncing, setSyncing] = useState(false)

  const pushNow = useCallback(async () => {
    if (!token) return
    setSyncing(true)
    try {
      await pushRemoteUserData(token, collectUserDataSnapshot())
    } catch (error) {
      console.warn('[BurnPal] Background sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }, [token])

  const refreshFromServer = useCallback(async () => {
    if (!token) return
    setSyncing(true)
    try {
      const remote = await fetchRemoteUserData(token)
      if (remote.data && isUserDataSnapshot(remote.data)) {
        applyUserDataSnapshot(remote.data)
        window.dispatchEvent(new CustomEvent('burnpal:user-data-applied'))
      }
    } catch (error) {
      console.warn('[BurnPal] Cloud pull skipped:', error)
    } finally {
      setSyncing(false)
    }
  }, [token])

  const afterAuth = useCallback(
    async (nextToken: string, nextUser: AuthUser, isNewAccount: boolean) => {
      saveAuthSession(nextToken, nextUser)
      setToken(nextToken)
      setUser(nextUser)

      if (isNewAccount) {
        await pushRemoteUserData(nextToken, collectUserDataSnapshot())
      } else {
        const remote = await fetchRemoteUserData(nextToken)
        if (remote.data && isUserDataSnapshot(remote.data)) {
          applyUserDataSnapshot(remote.data)
          window.dispatchEvent(new CustomEvent('burnpal:user-data-applied'))
        } else {
          await pushRemoteUserData(nextToken, collectUserDataSnapshot())
        }
      }
    },
    [],
  )

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginAccount({ email, password })
      await afterAuth(result.token, result.user, false)
    },
    [afterAuth],
  )

  const register = useCallback(
    async (email: string, password: string, verificationCode: string, displayName?: string) => {
      const result = await registerAccount({ email, password, verificationCode, displayName })
      await afterAuth(result.token, result.user, true)
    },
    [afterAuth],
  )

  const logout = useCallback(() => {
    clearAuthSession()
    setToken(null)
    setUser(null)
  }, [])

  useEffect(() => {
    if (!token) {
      setLoading(false)
      return
    }

    let cancelled = false
    void refreshFromServer().finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
    }
    // Pull once when session is restored — not on every refreshFromServer identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  useEffect(() => {
    if (!token) return

    const schedule = () => {
      scheduleUserDataPush(() => pushNow())
    }

    window.addEventListener('burnpal:user-data-changed', schedule)
    return () => window.removeEventListener('burnpal:user-data-changed', schedule)
  }, [token, pushNow])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      syncing,
      login,
      register,
      logout,
      pushNow,
      refreshFromServer,
    }),
    [user, token, loading, syncing, login, register, logout, pushNow, refreshFromServer],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

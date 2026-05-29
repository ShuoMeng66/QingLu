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
  ApiError,
  changeAccountPassword,
  fetchMe,
  fetchRemoteUserData,
  getStoredToken,
  getStoredUser,
  loginAccount,
  pushRemoteUserData,
  registerAccount,
  saveAuthSession,
  updateAccountProfile,
} from '../lib/api/client'
import {
  applyUserDataSnapshot,
  collectUserDataSnapshot,
  isUserDataSnapshot,
  reconcileUserDataSnapshots,
  scheduleUserDataPush,
} from '../lib/userDataSync'
import { migrateLegacyConversationsForCurrentUser } from '../types/conversation'

import type { AuthUser } from '../types/userData'

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  syncing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (
    email: string,
    password: string,
    verificationCode: string,
    displayName?: string,
  ) => Promise<{ created: boolean }>
  logout: () => void
  updateDisplayName: (displayName: string) => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  pushNow: () => Promise<void>
  refreshFromServer: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function syncCloudData(token: string, isNewAccount: boolean) {
  try {
    migrateLegacyConversationsForCurrentUser()
    const local = collectUserDataSnapshot()

    if (isNewAccount) {
      await pushRemoteUserData(token, local)
      return
    }

    const remote = await fetchRemoteUserData(token)
    if (remote.data && isUserDataSnapshot(remote.data)) {
      const merged = reconcileUserDataSnapshots(local, remote.data)
      applyUserDataSnapshot(merged)
      await pushRemoteUserData(token, merged)
      window.dispatchEvent(new CustomEvent('burnpal:user-data-applied'))
    } else {
      await pushRemoteUserData(token, local)
    }
  } catch (error) {
    console.warn('[BurnPal] Cloud sync skipped:', error)
  }
}

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
      migrateLegacyConversationsForCurrentUser()
      const local = collectUserDataSnapshot()
      const remote = await fetchRemoteUserData(token)
      if (remote.data && isUserDataSnapshot(remote.data)) {
        const merged = reconcileUserDataSnapshots(local, remote.data)
        applyUserDataSnapshot(merged)
        await pushRemoteUserData(token, merged)
        window.dispatchEvent(new CustomEvent('burnpal:user-data-applied'))
      }
    } catch (error) {
      console.warn('[BurnPal] Cloud pull skipped:', error)
    } finally {
      setSyncing(false)
    }
  }, [token])

  const afterAuth = useCallback(async (nextToken: string, nextUser: AuthUser, isNewAccount: boolean) => {
    if (!nextToken || !nextUser?.id || !nextUser.email) {
      throw new Error('Invalid auth response from server')
    }
    saveAuthSession(nextToken, nextUser)
    setToken(nextToken)
    setUser(nextUser)
    setLoading(false)
    setSyncing(true)
    try {
      await syncCloudData(nextToken, isNewAccount)
    } finally {
      setSyncing(false)
    }
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await loginAccount({ email, password })
      await afterAuth(result.token, result.user, false)
    },
    [afterAuth],
  )

  const register = useCallback(
    async (email: string, password: string, verificationCode: string, displayName?: string) => {
      const result = await registerAccount({
        email,
        password,
        verificationCode,
        displayName,
      })
      const created = result.created !== false
      await afterAuth(result.token, result.user, created)
      return { created }
    },
    [afterAuth],
  )

  const logout = useCallback(() => {
    clearAuthSession()
    setToken(null)
    setUser(null)
  }, [])

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!token || !user) return
      const trimmed = displayName.trim()
      const result = await updateAccountProfile(token, { displayName: trimmed || null })
      const nextUser = result.user
      saveAuthSession(token, nextUser)
      setUser(nextUser)
    },
    [token, user],
  )

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!token) return
      await changeAccountPassword(token, { currentPassword, newPassword })
    },
    [token],
  )

  useEffect(() => {
    const storedToken = getStoredToken()
    if (!storedToken) {
      setLoading(false)
      if (!token) {
        setUser(null)
      }
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const me = await fetchMe(storedToken)
        if (cancelled || getStoredToken() !== storedToken) return
        saveAuthSession(storedToken, me.user)
        setToken(storedToken)
        setUser(me.user)
        await refreshFromServer()
      } catch (error) {
        if (cancelled || getStoredToken() !== storedToken) return

        const status = error instanceof ApiError ? error.status : 0
        if (status === 401 || status === 403) {
          console.warn('[BurnPal] Session invalid, cleared local login')
          clearAuthSession()
          setToken(null)
          setUser(null)
        } else {
          // Backend offline / 502 — keep cached session so user stays logged in
          const cached = getStoredUser()
          if (cached) {
            setToken(storedToken)
            setUser(cached)
          }
          console.warn('[BurnPal] Could not verify session with server:', error)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token, refreshFromServer])

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
      updateDisplayName,
      changePassword,
      pushNow,
      refreshFromServer,
    }),
    [
      user,
      token,
      loading,
      syncing,
      login,
      register,
      logout,
      updateDisplayName,
      changePassword,
      pushNow,
      refreshFromServer,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

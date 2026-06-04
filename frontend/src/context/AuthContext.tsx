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
import { agentLog } from '../lib/debugLog'

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
  const syncStarted = Date.now()
  agentLog('AuthContext.tsx:syncCloudData', 'start', { isNewAccount }, 'B')
  try {
    migrateLegacyConversationsForCurrentUser()
    const local = collectUserDataSnapshot()

    if (isNewAccount) {
      agentLog('AuthContext.tsx:syncCloudData', 'push only (new account)', {}, 'B')
      await pushRemoteUserData(token, local)
      agentLog('AuthContext.tsx:syncCloudData', 'done', { ms: Date.now() - syncStarted }, 'B')
      return
    }

    agentLog('AuthContext.tsx:syncCloudData', 'fetch remote', {}, 'B')
    const remote = await fetchRemoteUserData(token)
    if (remote.data && isUserDataSnapshot(remote.data)) {
      const merged = reconcileUserDataSnapshots(local, remote.data)
      applyUserDataSnapshot(merged)
      await pushRemoteUserData(token, merged)
      window.dispatchEvent(new CustomEvent('qinglu:user-data-applied'))
    } else {
      await pushRemoteUserData(token, local)
    }
  } catch (error) {
    agentLog('AuthContext.tsx:syncCloudData', 'error', {
      ms: Date.now() - syncStarted,
      err: error instanceof Error ? error.message : 'unknown',
    }, 'B')
    console.warn('[QingLu] Cloud sync skipped:', error)
  }
  agentLog('AuthContext.tsx:syncCloudData', 'finished', { ms: Date.now() - syncStarted }, 'B')
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
      console.warn('[QingLu] Background sync failed:', error)
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
        window.dispatchEvent(new CustomEvent('qinglu:user-data-applied'))
      }
    } catch (error) {
      console.warn('[QingLu] Cloud pull skipped:', error)
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
    // Do not block login/register UI on cloud sync (can hang if /user/data is slow)
    void (async () => {
      try {
        await syncCloudData(nextToken, isNewAccount)
      } finally {
        setSyncing(false)
      }
    })()
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      agentLog('AuthContext.tsx:login', 'start', {}, 'A')
      const loginStarted = Date.now()
      const result = await loginAccount({ email, password })
      agentLog('AuthContext.tsx:login', 'loginAccount done', { ms: Date.now() - loginStarted }, 'A')
      await afterAuth(result.token, result.user, false)
      agentLog('AuthContext.tsx:login', 'complete', { ms: Date.now() - loginStarted }, 'A')
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
          console.warn('[QingLu] Session invalid, cleared local login')
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
          console.warn('[QingLu] Could not verify session with server:', error)
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

    window.addEventListener('qinglu:user-data-changed', schedule)
    return () => window.removeEventListener('qinglu:user-data-changed', schedule)
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

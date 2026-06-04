import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { loadUserProfile, type UserProfile } from '../lib/userProfile'

export interface ProfileContextValue {
  userProfile: UserProfile
  refreshUserProfile: () => void
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) {
    throw new Error('useProfileContext must be used within ProfileProvider')
  }
  return ctx
}

export function useOptionalProfileContext(): ProfileContextValue | null {
  return useContext(ProfileContext)
}

interface ProfileProviderProps {
  children: ReactNode
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [userProfile, setUserProfile] = useState<UserProfile>(() => loadUserProfile())

  const refreshUserProfile = useCallback(() => {
    setUserProfile(loadUserProfile())
  }, [])

  useEffect(() => {
    const onUserDataApplied = () => refreshUserProfile()
    window.addEventListener('qinglu:user-data-applied', onUserDataApplied)
    return () => window.removeEventListener('qinglu:user-data-applied', onUserDataApplied)
  }, [refreshUserProfile])

  const value = useMemo(
    () => ({ userProfile, refreshUserProfile }),
    [refreshUserProfile, userProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

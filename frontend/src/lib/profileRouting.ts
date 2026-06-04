import { isProfileComplete, loadUserProfile } from './userProfile'

/** After login or splash: onboard if profile incomplete, else chat. */
export function resolvePostAuthPath(): '/onboard' | '/chat' {
  return isProfileComplete(loadUserProfile()) ? '/chat' : '/onboard'
}

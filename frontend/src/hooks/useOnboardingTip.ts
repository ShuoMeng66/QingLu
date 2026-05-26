import { useState } from 'react'
import { dismissTip, isTipDismissed, type OnboardingTipId } from '../lib/onboarding'

export function useOnboardingTip(id: OnboardingTipId) {
  const [visible, setVisible] = useState(() => !isTipDismissed(id))

  const dismiss = () => {
    dismissTip(id)
    setVisible(false)
  }

  return { visible, dismiss }
}

import type { ReactNode } from 'react'
import { useOnboardingTip } from '../hooks/useOnboardingTip'
import type { OnboardingTipId } from '../lib/onboarding'

interface OnboardingTipProps {
  id: OnboardingTipId
  title?: string
  children: ReactNode
  className?: string
}

export function OnboardingTip({ id, title, children, className = '' }: OnboardingTipProps) {
  const { visible, dismiss } = useOnboardingTip(id)

  if (!visible) return null

  return (
    <div className={`onboarding-tip ${className}`.trim()} role="status">
      <div className="onboarding-tip__body">
        {title ? <strong className="onboarding-tip__title">{title}</strong> : null}
        <div className="onboarding-tip__content">{children}</div>
      </div>
      <button type="button" className="onboarding-tip__action pressable" onClick={dismiss}>
        知道了
      </button>
    </div>
  )
}

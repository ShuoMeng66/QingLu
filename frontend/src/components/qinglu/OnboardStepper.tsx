import { useI18n } from '../../hooks/useI18n'

export type OnboardStep = 1 | 2 | 3

const STEPS: OnboardStep[] = [1, 2, 3]

const STEP_KEYS = {
  1: 'onboard.step1',
  2: 'onboard.step2',
  3: 'onboard.step3',
} as const

interface OnboardStepperProps {
  currentStep: OnboardStep
}

export function OnboardStepper({ currentStep }: OnboardStepperProps) {
  const { t } = useI18n()

  return (
    <nav className="onboard-stepper" aria-label={t('onboard.stepperAria')}>
      <ol className="onboard-stepper__list">
        {STEPS.map((step, index) => {
          const active = step === currentStep
          const done = step < currentStep
          return (
            <li key={step} className="onboard-stepper__item">
              <div className="onboard-stepper__node-wrap">
                <span
                  className={`onboard-stepper__node ${
                    active
                      ? 'onboard-stepper__node--active'
                      : done
                        ? 'onboard-stepper__node--done'
                        : 'onboard-stepper__node--idle'
                  }`}
                  aria-current={active ? 'step' : undefined}
                >
                  {step}
                </span>
                <span
                  className={`onboard-stepper__label ${
                    active ? 'onboard-stepper__label--active' : ''
                  }`}
                >
                  {active && <span className="onboard-stepper__step-prefix">STEP {step} / </span>}
                  {t(STEP_KEYS[step])}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <span
                  className={`onboard-stepper__connector ${
                    done || active ? 'onboard-stepper__connector--active' : ''
                  }`}
                  aria-hidden="true"
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

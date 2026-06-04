import { useI18n } from '../../hooks/useI18n'
import type { ClusterPhase, TaskPlan, TaskScore } from '../../types/agentCluster'

import './AgentPhaseRail.css'

interface AgentPhaseRailProps {
  phase: ClusterPhase

  plan: TaskPlan | null

  score: TaskScore | null
}



export function AgentPhaseRail({ phase, plan, score }: AgentPhaseRailProps) {
  const { t } = useI18n()

  if (phase === 'idle' && !plan && !score) return null

  const evalReport = score?.evalReport
  const evalBadge =
    score?.note?.includes('AI 质量') ||
    score?.note?.includes('AI 测评') ||
    score?.note?.includes('AI quality') ||
    score?.note?.includes('AI eval')
      ? t('eval.badgeLlm')
      : t('eval.badgeLocal')



  return (

    <div className="agent-rail">

      {plan && (

        <section className="agent-rail__card agent-rail__card--plan">

          <header className="agent-rail__head">

            <span className="agent-rail__badge">{t('rail.badgePlan')}</span>

            <span className="agent-rail__focus">{plan.focus}</span>

          </header>

          <ol className="agent-rail__steps">

            {plan.steps.map((step) => (

              <li key={step}>{step}</li>

            ))}

          </ol>

        </section>

      )}



      {(phase === 'executing' || phase === 'reviewing' || phase === 'scoring') && (

        <section className="agent-rail__card agent-rail__card--exec">

          <span className="agent-rail__badge">{t('rail.badgeReply')}</span>

          <span className="agent-rail__hint">

            {phase === 'executing'
              ? t('rail.hintExecuting')
              : phase === 'reviewing'
                ? t('rail.hintReviewing')
                : t('rail.hintScoring')}

          </span>

        </section>

      )}



      {evalReport && (

        <section className="agent-rail__card agent-rail__card--route">

          <header className="agent-rail__head">

            <span className="agent-rail__badge">{t('rail.badgeScene')}</span>

            <span className="agent-rail__focus">{evalReport.routing.sceneLabel}</span>

          </header>

          <p className="agent-rail__hint">

            {t('rail.confidence')} {Math.round(evalReport.routing.confidence * 100)}% ·{' '}

            {evalReport.routing.matchedSignals.join('、')}

          </p>

        </section>

      )}



      {score && (

        <section className="agent-rail__card agent-rail__card--score">

          <header className="agent-rail__head">

            <span className="agent-rail__badge">{evalBadge}</span>

            <strong className="agent-rail__score">{score.total}</strong>

          </header>

          <div className="agent-rail__bars">

            {score.dimensions.map((dim) => (

              <div key={dim.label} className="agent-rail__bar">

                <span>{dim.label}</span>

                <div className="agent-rail__track">

                  <div className="agent-rail__fill" style={{ width: `${dim.value}%` }} />

                </div>

              </div>

            ))}

          </div>

          {evalReport && (

            <ul className="agent-rail__rules">

              {evalReport.globalRules.checks.map((check) => (

                <li

                  key={check.id}

                  className={check.pass ? 'agent-rail__rule--pass' : 'agent-rail__rule--fail'}

                >

                  {check.pass ? '✓' : '○'} {check.label}

                </li>

              ))}

            </ul>

          )}

          <p className="agent-rail__note">{score.note}</p>

        </section>

      )}

    </div>

  )

}



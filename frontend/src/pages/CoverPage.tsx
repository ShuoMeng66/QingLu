import { BlobBackground } from '../components/ui/BlobBackground'

import { GrainOverlay } from '../components/ui/GrainOverlay'

import { CoverMotionDecor } from '../components/cover/CoverMotionDecor'

import { SquadAvatarStrip } from '../components/layout/SquadAvatarStrip'

import { BRAND, FOCUS_PILLARS } from '../copy/ui'

import { QINGLU } from '../data/qingluAssets'

import { useAppContext } from '../context/AppContext'

import '../styles/cover.css'



const MOTION_CHIPS = [

  { id: 'eat', label: '吃什么', hint: '附近轻食' },

  { id: 'train', label: '去哪练', hint: '健身房推荐' },

  { id: 'recover', label: '恢复一下', hint: '拉伸放松' },

] as const



export function CoverPage() {

  const { clusterTurn } = useAppContext()



  return (

    <div className="cover-page">

      <BlobBackground />

      <GrainOverlay />

      <CoverMotionDecor />



      <main className="cover-page__main">

        <section className="cover-hero">

          <div className="cover-hero__skyline" aria-hidden="true" />



          <div className="cover-hero__row">

            <div className="cover-hero__copy-block">

              <p className="cover-hero__eyebrow">OpenClaw · 本地生活减脂</p>

              <h1 className="cover-hero__title">{BRAND.name}</h1>

              <p className="cover-hero__tagline">{BRAND.tagline}</p>

              <p className="cover-hero__lead">{BRAND.description}</p>

            </div>

            <div className="cover-hero__character-wrap">

              <img

                src={QINGLU.hero}

                alt={QINGLU.name}

                className="cover-hero__character"

                width={220}

                height={320}

              />

            </div>

          </div>



          <ul className="cover-motion-chips" aria-label="快捷入口">

            {MOTION_CHIPS.map((chip) => (

              <li key={chip.id} className="cover-motion-chip">

                <strong>{chip.label}</strong>

                <span>{chip.hint}</span>

              </li>

            ))}

          </ul>



          <a href="/chat" className="cover-cta">

            进入对话

          </a>

          <p className="cover-hero__hint">和轻鹭聊聊饮食、热量与运动计划</p>

        </section>



        <ul className="cover-pillars">

          {FOCUS_PILLARS.map((pillar, index) => (

            <li

              key={pillar.id}

              className={`cover-pillar ${index === 1 ? 'cover-pillar--stagger' : ''}`}

            >

              <span className="cover-pillar__icon">{pillar.icon}</span>

              <div>

                <strong>{pillar.label}</strong>

                <span>{pillar.hint}</span>

              </div>

            </li>

          ))}

        </ul>



        <section className="cover-squad" aria-label="轻鹭">

          <p className="cover-squad__label">轻鹭已就绪，随时陪你开练</p>

          <SquadAvatarStrip clusterTurn={clusterTurn} compact />

        </section>

      </main>

    </div>

  )

}


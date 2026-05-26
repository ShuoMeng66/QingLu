import { YiqidongIntroTip } from '../components/YiqidongIntroTip'
import { YiqidongSettingsForm } from '../components/YiqidongSettingsForm'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { YIQIDONG } from '../copy/ui'
import { useAppContext } from '../context/AppContext'

export function QuestsPage() {
  const { handleYiqidongApply, openYiqidongModal, yiqidongUnread } = useAppContext()

  return (
    <div className="page page--quests">
      <header className="page-header">
        <div>
          <p className="eyebrow">{YIQIDONG.eyebrow}</p>
          <h1 className="page-header__title">{YIQIDONG.title}</h1>
        </div>
        <Button variant="secondary" onClick={() => openYiqidongModal('inbox')}>
          ✉ 信箱
          {yiqidongUnread > 0 && ` (${yiqidongUnread})`}
        </Button>
      </header>

      <Card className="quests-intro">
        <YiqidongIntroTip />
      </Card>

      <Card className="quests-form">
        <YiqidongSettingsForm onApply={handleYiqidongApply} />
      </Card>
    </div>
  )
}

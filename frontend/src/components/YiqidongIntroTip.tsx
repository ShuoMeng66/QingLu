import { OnboardingTip } from '../components/OnboardingTip'
import { ONBOARDING_TIPS } from '../lib/onboarding'

export function YiqidongIntroTip() {
  return (
    <OnboardingTip
      id={ONBOARDING_TIPS.yiqidongIntro}
      title="欢迎使用一起动"
      className="onboarding-tip--rich"
    >
      <p>
        「一起动」是轻鹭的运动陪伴功能：会根据天气、空气质量和你的作息，在合适的时候提醒你该动一动，并推荐适合当下的运动方式或附近活动。
      </p>
      <p className="onboarding-tip__note">
        这里的设置只保存在你的设备上，保存时不会自动发起对话；左侧栏会显示当前提醒方式摘要。
      </p>

      <h3 className="onboarding-tip__subtitle">三种提醒方式</h3>
      <ul>
        <li>
          <strong>随心推</strong>：不想被固定闹钟打扰时选它。条件合适才偶尔提醒，建议每日最多 1 次。
        </li>
        <li>
          <strong>固定提醒</strong>：想规律运动时选它。可设每天、每周或指定星期，搭配 1～2 个时间点。
        </li>
        <li>
          <strong>关闭</strong>：暂时不需要任何运动提醒。
        </li>
      </ul>

      <h3 className="onboarding-tip__subtitle">推荐设置</h3>
      <ul>
        <li>第一次使用：先试「随心推 + 每日 1 次」，感受频率是否舒适。</li>
        <li>想养成习惯：选「固定提醒」，工作日设 18:30 或 21:00 往往更容易坚持。</li>
        <li>固定提醒不宜设太多时间点，1～2 个就够；确认后点「保存」即可生效。</li>
      </ul>
    </OnboardingTip>
  )
}

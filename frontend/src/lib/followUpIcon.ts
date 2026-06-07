import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  ChevronRight,
  Dumbbell,
  Flame,
  RefreshCw,
  Utensils,
} from 'lucide-react'
import type { FollowUpActionMeta } from '../types/openclaw'

export function pickFollowUpIcon(action: FollowUpActionMeta): LucideIcon {
  const text = `${action.label} ${action.message ?? ''} ${action.action_type ?? ''}`.toLowerCase()

  if (/对比|比较|compare/.test(text)) return ArrowLeftRight
  if (/kcal|热量|控制|卡/.test(text)) return Flame
  if (/练|训练|健身|gym|venue/.test(text)) return Dumbbell
  if (/口味|换|换个/.test(text)) return RefreshCw
  if (/聚餐|晚饭|晚餐|安排|吃/.test(text)) return Utensils

  return ChevronRight
}

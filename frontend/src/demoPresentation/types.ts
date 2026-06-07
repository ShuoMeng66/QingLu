export interface DemoFollowUpChip {
  label: string
  message?: string
}

export interface DemoPlatformCard {
  title?: string
  subtitle?: string
  meta?: string
  tags?: string[]
  cta?: string
  url?: string
  search_keyword?: string
}

export interface DemoRecommendation {
  store_name?: string
  combo_name?: string
  kcal_range?: string
  avg_price_yuan?: string | number
  recommendation_reason?: string
  warnings?: string
  image?: string
  gallery_images?: string[]
  platform_card?: DemoPlatformCard
  [key: string]: unknown
}

export interface DemoScene {
  id: string
  profileId?: string
  title?: string
  match: {
    exact?: string[]
    keywords?: string[]
    keywordGroups?: string[][]
  }
  assistant: {
    displayText: string
    followUpChips?: DemoFollowUpChip[]
  }
  stream?: {
    charsPerTick?: number
    tickMs?: number
  }
  payload: Record<string, unknown>
}

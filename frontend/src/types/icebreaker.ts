export type DiversityAxis = 'numeric' | 'meal' | 'workout' | 'habit'

export interface TriggerInterest {
  id: string
  label: string
  weight: number
  evidence: string[]
}

export interface ConversationStarter {
  id: string
  tag: string
  title: string
  subtitle: string
  prompt: string
  interestId: string
  diversityAxis: DiversityAxis
  image: string
  imageAlt: string
}

export interface IcebreakerTelemetryEvent {
  type: 'starter_impression' | 'starter_click' | 'starter_to_reply'
  starterId: string
  interestId: string
  at: number
}

export interface InterestWeightState {
  weights: Record<string, number>
  impressions: number
  updatedAt: number
}

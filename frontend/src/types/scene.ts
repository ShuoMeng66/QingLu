export type SceneId = 'office' | 'gym' | 'hotpot'

export interface SceneContext {
  sceneId: SceneId
  petPose: 'idle' | 'work' | 'exercise' | 'eat'
}

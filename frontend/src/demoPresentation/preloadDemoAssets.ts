import { DEMO_SCENES } from './scenes.generated'

function collectDemoImagePaths(): string[] {
  const paths = new Set<string>()
  for (const scene of DEMO_SCENES) {
    const recommendations = scene.payload.recommendations
    if (!Array.isArray(recommendations)) continue
    for (const rec of recommendations) {
      if (!rec || typeof rec !== 'object') continue
      const row = rec as Record<string, unknown>
      if (typeof row.image === 'string' && row.image.trim()) {
        paths.add(row.image.trim())
      }
      if (Array.isArray(row.gallery_images)) {
        for (const src of row.gallery_images) {
          if (typeof src === 'string' && src.trim()) paths.add(src.trim())
        }
      }
    }
  }
  return [...paths]
}

export function preloadDemoAssets(): void {
  if (typeof window === 'undefined') return
  for (const src of collectDemoImagePaths()) {
    const img = new Image()
    img.src = src
  }
}

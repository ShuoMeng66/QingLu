export interface PlatformLinkTarget {
  title: string
  listingUrl?: string
  city?: string
  cuisine?: string
}

const DEMO_MESSAGE =
  '当前为 Demo 模拟门店。真实上线后将跳转至美团/大众点评门店页，查看菜单、评价、团购、预约或下单。'

export function showDemoPlatformNotice(): void {
  window.alert(DEMO_MESSAGE)
}

function buildSearchUrl(title: string, city?: string): string {
  const q = encodeURIComponent(`${title} ${city ?? ''}`.trim())
  return `https://www.dianping.com/search/keyword/1/0_${q}`
}

export function openPlatformListing(target: PlatformLinkTarget): void {
  const url = target.listingUrl?.trim()
  if (url && /^https?:\/\//i.test(url)) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }
  const fallback = buildSearchUrl(target.title, target.city)
  if (import.meta.env.DEV) {
    const useSearch = window.confirm(`${DEMO_MESSAGE}\n\n开发环境：是否在点评搜索页打开「${target.title}」？`)
    if (useSearch) window.open(fallback, '_blank', 'noopener,noreferrer')
    return
  }
  showDemoPlatformNotice()
}

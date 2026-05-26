/** 城市 → 清晰天际线背景（本地优先，无人物） */

const LOCAL_GUANGZHOU = '/images/cities/guangzhou-banner.jpg'
const LOCAL_FALLBACK = '/images/cities/guangzhou-default.jpg'

/** 城市名 → 可识别的城市外景图 */
const CITY_SKYLINE: Record<string, string> = {
  广州: LOCAL_GUANGZHOU,
  深圳市: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shenzhen_skyline_2018.jpg/1280px-Shenzhen_skyline_2018.jpg',
  深圳: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Shenzhen_skyline_2018.jpg/1280px-Shenzhen_skyline_2018.jpg',
  北京: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Beijing_CBD_from_the_air.jpg/1280px-Beijing_CBD_from_the_air.jpg',
  上海: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/df/Pudong_Shanghai_November_2017_panorama.jpg/1280px-Pudong_Shanghai_November_2017_panorama.jpg',
  杭州: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Hangzhou_Skyline_from_West_Lake.jpg/1280px-Hangzhou_Skyline_from_West_Lake.jpg',
  成都: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Chengdu_skyline.jpg/1280px-Chengdu_skyline.jpg',
  武汉: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Wuhan_Yangtze_River_Bridge_and_Skyline.jpg/1280px-Wuhan_Yangtze_River_Bridge_and_Skyline.jpg',
  南京: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Nanjing_Zifeng_Tower_Skyline.jpg/1280px-Nanjing_Zifeng_Tower_Skyline.jpg',
  重庆: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Chongqing_Night.jpg/1280px-Chongqing_Night.jpg',
}

export function getCitySkylineUrl(city: string): string {
  if (CITY_SKYLINE[city]) return CITY_SKYLINE[city]
  for (const [key, url] of Object.entries(CITY_SKYLINE)) {
    if (city.includes(key) || key.includes(city)) return url
  }
  return LOCAL_GUANGZHOU
}

export function getCitySkylineFallback(): string {
  return LOCAL_FALLBACK
}

export function formatLocationLabel(city: string, region?: string): string {
  if (region && !city.includes(region.replace(/省|市/g, ''))) {
    return `${city} · ${region}`
  }
  return city
}

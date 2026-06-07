/**
 * 空状态场景与示例问题
 */

export interface EmptyScene {
  id: string
  tag: string
  title: string
  subtitle: string
  prompt: string
  image: string
  imageAlt: string
}

export { EMPTY_STATE as EMPTY_HERO } from '../copy/ui'

export const EMPTY_SCENES: EmptyScene[] = [
  {
    id: 'calorie',
    tag: '热量',
    title: '算热量缺口',
    subtitle: '目标体重与每日摄入',
    prompt: '我 165cm、62kg，想减到 58kg，帮我估算每天大概吃多少热量合适？',
    image: '/images/scene-fastfood.jpg',
    imageAlt: '热量与饮食',
  },
  {
    id: 'meal',
    tag: '饮食',
    title: '减脂餐搭配',
    subtitle: '三餐怎么吃得均衡',
    prompt: '帮我设计一份适合上班族的减脂三餐，尽量简单好做。',
    image: '/images/scene-dining.jpg',
    imageAlt: '均衡饮食',
  },
  {
    id: 'workout',
    tag: '运动',
    title: '运动计划',
    subtitle: '有氧与力量怎么安排',
    prompt: '每周能运动 3 次，每次 40 分钟，帮我安排一个入门减脂运动计划。',
    image: '/images/scene-workout.jpg',
    imageAlt: '运动训练',
  },
]

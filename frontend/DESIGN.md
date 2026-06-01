# 小爪 · Vitality Youth System

晨光活力系 UI — 面向年轻减脂用户的青春、健康、运动感。参考 Keep / 薄荷健康 / 轻刻健身 / Nike NTC 的首屏能量感，融合为 **青绿主色 + 橙色 CTA + 晨光渐变背景**。

## 原则

- **晨光画布**：`--canvas-morning` 渐变（`#F0FDF9 → #ECFEFF → #FFF7ED`），非暖灰文档风
- **能量绿主色** `#00C17C`：品牌、在线状态、发送按钮
- **橙色 CTA** `#FF8A4C`：热量 chip、未读 badge、Quest 委托条
- **高白卡片**：`--surface-card` + 轻投影，圆角 16px
- **对话优先**：单列居中 max 960px，顶栏集成品牌 + 一起动 + 信箱

## 布局

| 区域 | 组件 | 样式要点 |
|------|------|----------|
| 全局底 | `VitalityBackground` | 晨光渐变 + 绿/蓝/橙光斑 |
| 顶栏 | `ChatView` topbar | 半透明白 + 绿爪标 + 绿状态 pill |
| 空对话 Hero | `ChatEmptyState` | 大标题 + slogan 绿字 |
| 今日条 | TodayStrip | 饮食/热量/运动三 chip，左色条 lemon/orange/green |
| 开场 | StarterRail ×3 | Keep 风横向卡片，斜切色块 + icon |
| 对话中 | `AgentPhaseRail` + 消息 | 用户泡浅绿底，助手白底细边 |

## 令牌（`App.css` `:root`）

| Token | 值 | 用途 |
|-------|-----|------|
| `--vitality-green` | `#00C17C` | 主色 |
| `--vitality-green-deep` | `#00965F` | hover / 强调 |
| `--vitality-sky` | `#38BDF8` | 次要 accent |
| `--vitality-orange` | `#FF8A4C` | CTA / badge |
| `--vitality-lemon` | `#FFD166` | 饮食 chip |
| `--ink` | `#0F172A` | 标题 |
| `--body` | `#475569` | 正文 |

旧 Clay/PostHog 珊瑚主色 `#fc7981` 与 `#faf9f7` 画布已弃用。

## Reference board

参考截图与色板笔记见 `output/playwright/references/`。

| 站点 | 借鉴点 |
|------|--------|
| Keep | 课程卡片、高对比 hero、能量绿 |
| 薄荷健康 | 薄荷绿识别、圆润清爽卡片 |
| 轻刻健身 | 分区标题、科学训练文案 |
| Nike NTC | 强标题、训练日程能量感 |

## 已剪枝

- `AuroraBackground`（Pastel blob + grain）→ `VitalityBackground`
- 左侧双栏 `FatLossPanel`（未挂载）
- 像素宠物场景
- starter 外链 hero 图 → CSS 斜切色块

## 业务逻辑（未改）

IceBreaker 动态开场、Trace2Skill、一起动 Quest/信封 — 仅视觉层与 copy 更新。

## 测评 Agent（Skill 1 · 飞书测评框架）

小爪 scorer 小队 = **测评 Agent**，三模块结构：

| 模块 | 内容 |
|------|------|
| 场景路由 | A1/A2/B/C/D/E 六场景 + 置信度 |
| 场景执行 | 信息提取、方案质量、数据依据、可执行性、场景贴合 |
| 全局规则 | Skill 1 五条调性（数据先行、温和、有据、简洁、情绪） |

实现：`frontend/src/lib/evalAgent.ts` · 场景定义对齐：`Agent/burnpal_skill/skills/skill1-diet/`（见 `Agent/burnpal_skill/EVAL.md`）

通过条件：总分 ≥75 且全局规则 ≥4/5。结果写入轨迹供 Trace2Skill 进化。

> **Vendor 拷贝**（BurnPal 主仓库）：上游 [CCLYX/burnpal.skill](https://github.com/CCLYX/burnpal.skill) @ `3e504c6fd4d322164f3c788fb629e22db79c749e`；`skills/` 四模块已于 2026-05 同步 `burnpal-skills-v2/burnpal-modified` 并合并 QingLu 外卖卡片字段（`item_id` / `takeout.json` 对齐）。根目录 `SKILL.md`、`assets/user-profiles.json`、`references/evolved-lessons.md` 仍由本仓库维护。

# 🔥 BurnPal — 健身人群本地生活全天候私人管家

> 美团黑客松大赛 · 赛道一：本地生活「全天候私人管家」
> 基于 OpenClaw 框架，为有减脂目标的都市健身人群设计。

## 核心理念

**基于你的减脂目标，在任何生活场景下给你最优推荐——让减脂融入生活，而不是让生活服从减脂。**

## 产品架构

```
用户消息
  │
  ▼
┌──────────────────────┐
│   Router (路由层)      │  ← 意图识别，分发到对应 Skill
│   SKILL.md            │
└──────┬───────────────┘
       │
  ┌────┴────┬──────────┬──────────┐
  ▼         ▼          ▼          ▼
Skill 1   Skill 2    Skill 3    Skill 4
吃什么    去哪练     恢复放松    一起动
饮食管家  场地管家   恢复管家   社交运动
```

## 目录结构

```
burnpal/
├── SKILL.md                           # 路由层
├── README.md
├── assets/
│   └── user-profiles.json             # 预设用户档案（共享）
├── docs/                              # 项目文档
├── skills/
│   ├── skill1-diet/                   # Skill 1：吃什么
│   │   ├── SKILL.md
│   │   ├── assets/                    # 餐厅、外卖数据
│   │   └── references/                # 热量表、吃法指南、连锁点单
│   ├── skill2-venue/                  # Skill 2：去哪练
│   │   ├── SKILL.md
│   │   ├── assets/                    # 健身房、场馆、团课数据
│   │   └── references/                # 器械对照表、场地选择指南
│   ├── skill3-recovery/               # Skill 3：恢复放松
│   │   ├── SKILL.md
│   │   ├── assets/                    # 恢复服务门店数据
│   │   └── references/                # 恢复评估、酸痛判断指南
│   └── skill4-social/                 # Skill 4：一起动
│       ├── SKILL.md
│       ├── assets/                    # 活动、场地、天气数据
│       └── references/                # 社交运动参与指南
```

## Demo 用户

| 档案 | 人设 | 城市 | 适合演示 |
|------|------|------|---------|
| 小明 | 男/180cm/82kg/力量训练 | 北京·国贸 | 聚餐点菜、找健身房、运动推拿、找活动 |
| 小红 | 女/163cm/55kg/轻运动 | 北京·海淀 | 外卖智选、团课推荐、拉伸服务 |
| 王总 | 男/175cm/76kg/出差中 | 上海·陆家嘴 | 异地全场景（餐厅/健身房/恢复/活动） |

## 对话示例

```
用户：今晚朋友约吃饭，4个人，国贸附近
→ Skill 1 聚餐选餐厅

用户：今天练背，附近哪个健身房器械好
→ Skill 2 日常场地推荐

用户：练完腿好酸，附近有没有好的推拿
→ Skill 3 恢复服务推荐

用户：周末附近有什么运动活动
→ Skill 4 发现活动
```

## 数据覆盖

| 数据 | 北京 | 上海 | 总计 |
|------|------|------|------|
| 餐厅 | 12 | 4 | 16 |
| 外卖 | 10 | 4 | 14 |
| 健身房 | 5 | 3 | 8 |
| 运动场馆 | 5 | 2 | 7 |
| 团课 | 9 | 3+4私教 | 16 |
| 恢复门店 | 5 | 2 | 7 |
| 运动活动 | 25 | 5 | 30 |
| 活动场地 | 12 | 4 | 16 |
| 天气 | 7天 | 7天+广州7天 | 21 |

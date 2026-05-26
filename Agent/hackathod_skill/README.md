# hackathod_skill

小爪（健身减脂本地生活管家）OpenClaw Skill 包，供美团黑客松比赛提交。**仅使用 mock 数据，不接真实美团/活动平台 API。**

## 四个产品 Skill（PRD）

| # | Skill | 场景 | 完整文档 |
|---|-------|------|----------|
| 1 | `gathering-meal-advisor` | 聚餐 / 火锅 / 饭局 | `skills/gathering-meal-advisor/references/full-guide.md` |
| 2 | `takeout-meal-advisor` | 外卖 / 快餐 | `skills/takeout-meal-advisor/references/full-guide.md` |
| 3 | `workout-recovery-advisor` | 练后恢复餐 | `skills/workout-recovery-advisor/references/full-guide.md` |
| 4 | `yiqidong-social-sports` | **一起动** · 社交运动管家 | `skills/yiqidong-social-sports/references/full-guide.md` |

每个产品 Skill 的 `references/full-guide.md` **不少于 10000 字**。

### Skill 4：一起动

- **活动推送 / 发现 / 组局** — 见各脚本
- **用户可选推送**：定时（每天 9 点）、一次性（周末组局）、**随心推**（天气好偶尔推）
- 配置：`push_settings.py` · 自动化：`push_workflow.py` · 详见 `skills/yiqidong-social-sports/references/push-automation.md`

## 辅助 Skill

| Skill | 作用 |
|-------|------|
| `scene-orchestrator` | 意图路由（含一起动关键词） |
| `mock-data-access` | 读取 mock JSON |
| `nutrition-engine` | 饮食宏量评分 |
| `context-hub` | 城市/目标/天气 |

## 目录结构

```
hackathod_skill/
├── protocol/inter-skill-call.md
├── mock/
│   ├── activities/          # 附近活动、运动类型、用户创建的活动
│   ├── environment/         # AQI mock
│   ├── menus/ poi/ profiles/
├── base/
└── skills/
    ├── gathering-meal-advisor/
    ├── takeout-meal-advisor/
    ├── workout-recovery-advisor/
    ├── yiqidong-social-sports/   ← Skill 4
    └── scene-orchestrator/       ← 路由辅助
```

## 接入 OpenClaw

```json
"skills": {
  "load": {
    "extraDirs": [
      "D:/Hackathod/Agent/hackathod_skill/base",
      "D:/Hackathod/Agent/hackathod_skill/skills"
    ]
  }
}
```

## 本地验证

```powershell
cd D:\Hackathod\Agent
python hackathod_skill/skills/yiqidong-social-sports/scripts/discover_activities.py --limit 3
python hackathod_skill/skills/yiqidong-social-sports/scripts/recommend_today.py --skip-weather
python hackathod_skill/skills/yiqidong-social-sports/scripts/create_activity.py --sport 飞盘 --venue 朝阳公园 --time 2026-05-24T15:00 --max-participants 8
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_scan.py
python hackathod_skill/scripts/generate_references.py
```

## 互调

见 `protocol/inter-skill-call.md`。一起动可联动 `workout-recovery-advisor`（「跑完吃什么」）。

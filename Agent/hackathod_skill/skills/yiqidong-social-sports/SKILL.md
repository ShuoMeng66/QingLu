---
name: yiqidong-social-sports
description: "Social sports hub for 小爪 一起动: configurable push (scheduled/one-shot/casual), discover activities, create events. Use for 飞盘/组局/运动提醒/随心推/开启关闭推送."
metadata:
  {
    "openclaw":
      {
        "emoji": "🏃",
        "requires": { "bins": ["python"] }
      }
  }
---

# 一起动 · 社交运动管家

产品 Skill 4：发现、组织本地运动，**用户可选开启**的自动化推送（定时 / 一次性 / 随心推）。

## 推送模式（用户可选）

| 模式 | 示例 | 配置 |
|------|------|------|
| 关闭 | 「别提醒了」 | `push_settings.py disable` |
| **定时** | 「每天 9 点提醒我今日运动」 | `set-schedule --times 09:00` |
| **一次性** | 「这周末帮我组个飞盘局」 | `add-task --type organize_event ...` |
| **随心推** | 「天气好偶尔推一下」 | `set-casual` |

配置存储：`mock/profiles/yiqidong_push_settings.json`

## 用户设置（Agent 必调脚本）

```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py get
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py set-schedule --times 09:00
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py set-casual
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py add-task --type organize_event --at 2026-05-24T09:00:00+08:00 --sport 飞盘 --venue 朝阳公园 --max-participants 8
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py disable
```

解析用户自然语言后写入配置，并**口头确认**已开启的模式与时间。

## 自动化工作流（Heartbeat / Cron）

```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_workflow.py
```

- `should_push: true` → 发送 `notification_text`
- 尊重静默时段 23:00–08:00
- 详见 `references/push-automation.md` 与 workspace `HEARTBEAT.md`

## 即时能力

| 能力 | 脚本 |
|------|------|
| 今日运动推荐 | `recommend_today.py` |
| 发现附近活动 | `discover_activities.py` |
| 发起活动 | `create_activity.py` |
| 主动扫描（需已开启推送） | `push_scan.py` |

## 互调

- `context-hub` / `weather` — 天气
- `mock-data-access` — 活动、AQI、推送配置
- `workout-recovery-advisor` — 「跑完吃什么」

## 完整文档

- `references/full-guide.md` — 场景与算法
- `references/push-automation.md` — 推送模式、Cron、NL 解析

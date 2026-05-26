# 一起动 · 推送自动化

用户可**选择开启**推送，并配置三种模式。配置持久化在 `mock/profiles/yiqidong_push_settings.json`（比赛阶段 mock；正式版可迁到用户 DB）。

## 三种推送模式

| 模式 | 用户说法 | 行为 |
|------|----------|------|
| **off** | 「关闭一起动提醒」 | 不推送 |
| **scheduled** | 「每天 9 点提醒我今日适合什么运动」 | 到点执行 `recommend_today`，发定时提醒 |
| **one_shot** | 「这周末帮我组个飞盘局」 | 写入一次性任务，到点组局或提醒 |
| **casual（随心推）** | 「天气好就偶尔推一下，别太多」 | AQI/天气分数达标 + 频控，偶尔推送 |

## 设置命令

```bash
# 查看当前配置
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py get

# 关闭
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py disable

# 每天 9 点定时提醒
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py set-schedule --times 09:00 --label "每日运动提醒"

# 随心推（默认每天最多 1 条，天气分≥70）
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py set-casual

# 一次性：这周末组局
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py add-task \
  --type organize_event --at 2026-05-24T09:00:00+08:00 \
  --intent "这周末帮我组个飞盘局" --sport 飞盘 --venue 朝阳公园 --max-participants 8

# 一次性：某天提醒
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_settings.py add-task \
  --type remind --at 2026-05-22T09:00:00+08:00 --intent "提醒我看今日运动推荐"
```

## 自动化工作流入口

Heartbeat / Cron 调用：

```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_workflow.py
```

输出字段：

- `should_push` — 是否应发给用户
- `workflow` — `scheduled` | `casual` | `one_shot_organize` | `one_shot_remind`
- `notification_text` — 推送正文

静默时段默认 **23:00–08:00**（可在 settings 修改 `quiet_hours`）。

## Agent 对话流程

1. 用户表达推送意图 → 解析 mode / 时间 / 运动类型
2. 调用 `push_settings.py` 写入配置
3. 回复确认：「已开启每天 9 点提醒」或「已记下周六组局，到时会帮你发起」
4. **不要**声称已接入真实 App 推送；说明由小爪在对话/Heartbeat 中触达

## 与 OpenClaw Cron 对接（可选）

在 `openclaw.json` 为 `hackathon-dev` 增加 cron（保留原有配置）：

```json
"cron": {
  "jobs": [
    {
      "name": "yiqidong-morning",
      "schedule": "0 9 * * *",
      "agentId": "hackathon-dev",
      "message": "执行：python hackathod_skill/skills/yiqidong-social-sports/scripts/push_workflow.py；若 should_push 为 true 则将 notification_text 发给用户。"
    }
  ]
}
```

更轻量的方式：依赖 `HEARTBEAT.md` + `agents.defaults.heartbeat.every`（如 30m），由 Agent 周期性跑 `push_workflow.py`。

## 随心推频控

- `max_per_day`: 默认 1
- `min_weather_score`: 默认 70（来自 recommend_today Top1 score）
- `cooldown_hours`: 默认 24

避免刷屏；用户可说「随心推一天最多 2 次」→ `--max-per-day 2`。

## NL 解析示例

| 用户原话 | Agent 动作 |
|----------|------------|
| 每天9点要提醒我运动 | `set-schedule --times 09:00` |
| 关闭一起动推送 | `disable` |
| 天气好再叫我 | `set-casual` |
| 这周末帮我组个局，朝阳公园飞盘 | `add-task --type organize_event ...` |
| 周六上午提醒我看附近活动 | `add-task --type remind --at ...` |

---
name: context-hub
description: "Resolve hackathod user city, meal targets, and optional weather via wttr.in. Use at start of meal workflows."
metadata:
  {
    "openclaw":
      {
        "emoji": "🌤",
        "requires": { "bins": ["python", "curl"] }
      }
  }
---

# Context Hub

聚合 mock 位置、用户 `daily_kcal_target`，并**可选**委托 OpenClaw 内置 `weather`（wttr.in）。

## 命令

```bash
python hackathod_skill/base/context-hub/scripts/resolve_context.py
python hackathod_skill/base/context-hub/scripts/resolve_context.py --skip-weather
python hackathod_skill/base/context-hub/scripts/resolve_context.py --city 北京 --district 朝阳区
```

## 与 weather Skill 关系

- 首选：本脚本内 `curl wttr.in/{alias}?format=j1`
- 失败：返回 `mock_fallback`，不阻断对话
- 也可直接 `@skill-invoke: weather` 用 `curl "wttr.in/Beijing?format=3"`

## 被谁调用

- `scene-orchestrator`：每轮首次路由前
- 各领域 Skill：需要餐次预算或天气话术时

## 参考

- `references/weather-delegation.md`
- 协议：`hackathod_skill/protocol/inter-skill-call.md`

# HEARTBEAT.md · 小爪

Heartbeat 时按顺序快速检查（无事项则 `HEARTBEAT_OK`）：

## 一起动自动化推送

若用户已开启一起动推送，执行：

```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_workflow.py
```

- 返回 `should_push: true` → 将 `notification_text` 发给用户（勿在静默时段推送）
- 返回 `should_push: false` → 不打扰

用户设置推送请用 `push_settings.py`（见 `yiqidong-social-sports` Skill）。

## 其他

- 无新事项时回复 `HEARTBEAT_OK`

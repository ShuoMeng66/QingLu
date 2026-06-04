# OpenClaw Agent 工作区

此目录是 OpenClaw 的**唯一活动范围**。

| 项目 | 路径 |
|------|------|
| 配置文件 | `D:\OpenClaw\.openclaw\openclaw.json` |
| Agent ID | `hackathon-dev`（workspace → `D:\Hackathod\Agent`） |
| **主 Skill 包** | [`burnpal_skill/`](burnpal_skill/)（vendor 自 [CCLYX/burnpal.skill](https://github.com/CCLYX/burnpal.skill)） |
| 模拟数据 | `burnpal_skill/**/assets/`、`assets/user-profiles.json` |
| 遗留脚本 | [`_legacy/hackathod_skill/`](_legacy/hackathod_skill/)（不加载，仅 Heartbeat 推送等） |

项目其他代码（如 frontend）请放在 `D:\Hackathod\` 下其他文件夹，Agent 无法访问。

## 四模块 Skill（burnpal_skill）

| # | 目录 | OpenClaw name | 场景 |
|---|------|---------------|------|
| 路由 | `burnpal_skill/SKILL.md` | `burnpal-router` | 意图分发 |
| 1 | `skills/skill1-diet/` | `diet-butler` | 吃什么 / 外卖 / 聚餐 |
| 2 | `skills/skill2-venue/` | — | 去哪练 / 健身房 / 团课 |
| 3 | `skills/skill3-recovery/` | — | 恢复放松 / 推拿 |
| 4 | `skills/skill4-social/` | — | 一起动 / 活动组局 |

Demo 用户见 `burnpal_skill/assets/user-profiles.json`（小明 / 小红 / 王总）。

### 验收对话（抽测）

- 「今晚朋友约吃饭，4 个人，国贸附近」→ Skill 1
- 「今天练背，附近哪个健身房器械好」→ Skill 2
- 「练完腿好酸，附近有没有好的推拿」→ Skill 3
- 「周末附近有什么运动活动」→ Skill 4

## 接入 OpenClaw

在 `D:\OpenClaw\.openclaw\openclaw.json` 中设置（**勿再加载** `_legacy/hackathod_skill`，避免与 `burnpal-router` 双路由）：

```json
"skills": {
  "load": {
    "extraDirs": [
      "D:/Hackathod/Agent/burnpal_skill",
      "D:/Hackathod/Agent/burnpal_skill/skills"
    ]
  }
}
```

修改后重启 OpenClaw Gateway，前端 Agent 指向 `openclaw/hackathon-dev`。

## Web 端门面检索（Venue Scout）

Vercel 生产环境不经过 OpenClaw Gateway：匹配到 `burnpal_skill` 店名后，前端调用 `POST /api/venue/enrich`（`qwen3.5-omni-plus-2026-03-15` + 联网搜索），与主聊天模型（`deepseek-v4-pro`）分离。详见根目录 `README.md` 环境变量表。

## Trace2Skill

离线进化补丁写入 `burnpal_skill/references/evolved-lessons.md`。运行方式见 [`trace2skill/README.md`](trace2skill/README.md)。

## 遗留：一起动 Heartbeat

若用户开启一起动推送，Heartbeat 仍执行（数据待二期迁至 skill4 assets）：

```bash
python _legacy/hackathod_skill/skills/yiqidong-social-sports/scripts/push_workflow.py
```

详见 [`HEARTBEAT.md`](HEARTBEAT.md)。

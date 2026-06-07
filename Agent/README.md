# OpenClaw Agent 工作区

此目录是 OpenClaw 的**活动 Skill 工作区**（可选本地开发路径；生产前端经百炼直连）。

| 项目 | 说明 |
|------|------|
| **主 Skill 包** | [`burnpal_skill/`](burnpal_skill/)（vendor 自 [CCLYX/burnpal.skill](https://github.com/CCLYX/burnpal.skill)） |
| 参考数据 | `burnpal_skill/**/assets/`、`assets/user-profiles.json` |

## 四模块 Skill（burnpal_skill）

| # | 目录 | OpenClaw name | 场景 |
|---|------|---------------|------|
| 路由 | `burnpal_skill/SKILL.md` | `burnpal-router` | 意图分发 |
| 1 | `skills/skill1-diet/` | `diet-butler` | 吃什么 / 外卖 / 聚餐 |
| 2 | `skills/skill2-venue/` | — | 去哪练 / 健身房 / 团课 |
| 3 | `skills/skill3-recovery/` | — | 恢复放松 / 推拿 |
| 4 | `skills/skill4-social/` | — | 一起动 / 活动组局 |

### 验收对话（抽测）

- 「今晚朋友约吃饭，4 个人，国贸附近」→ Skill 1
- 「今天练背，附近哪个健身房器械好」→ Skill 2
- 「练完腿好酸，附近有没有好的推拿」→ Skill 3
- 「周末附近有什么运动活动」→ Skill 4

## 接入 OpenClaw（本地可选）

在 OpenClaw 配置 `openclaw.json` 中设置：

```json
"skills": {
  "load": {
    "extraDirs": [
      "./Agent/burnpal_skill",
      "./Agent/burnpal_skill/skills"
    ]
  }
}
```

路径请替换为你的仓库绝对路径或相对 OpenClaw 工作目录的路径。修改后重启 OpenClaw Gateway，前端 Agent 可指向 `openclaw/qinglu-dev`。

## trace2skill

[`trace2skill/`](trace2skill/) — 离线 skill 进化管线（Python）。见 [`trace2skill/README.md`](trace2skill/README.md)。

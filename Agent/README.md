# OpenClaw Agent 工作区

此目录是 OpenClaw 的**唯一活动范围**。

| 项目 | 路径 |
|------|------|
| 配置文件 | `D:\OpenClaw\.openclaw\openclaw.json` |
| Agent ID | `hackathon-dev`（workspace → `D:\Hackathod\Agent`） |
| Skill 包（提交用） | `D:\Hackathod\Agent\hackathod_skill\` |
| OpenClaw Skill 加载 | 已在 `openclaw.json` 的 `skills.load.extraDirs` 追加，**保留全部内置 Skill** |
| Mock 数据 | `D:\Hackathod\Agent\hackathod_skill\mock\` |

项目其他代码（如 frontend）请放在 `D:\Hackathod\` 下其他文件夹，Agent 无法访问。

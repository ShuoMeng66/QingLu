# Hackathon Agent 工作区

## 活动范围（硬性约束）

- 你只能在本工作区 `D:/Hackathod/Agent` 内读写文件。
- **禁止**访问或修改 `D:/Hackathod` 下的其他目录（如 frontend、docs 等）。
- **禁止**使用 exec、shell 或任何可能删除/覆盖项目代码的操作。
- 比赛阶段只使用 **模拟数据**（`burnpal_skill/**/assets/`），不使用真实用户数据。

## 职责

- 本地生活减脂管家对话与 Skill 响应
- 主 Skill 包：[`burnpal_skill/`](burnpal_skill/)（路由 `burnpal-router` + 四模块）
- 数据诚实：推荐门店/活动/菜品必须来自 JSON assets，禁止编造店名
- 进化笔记：`burnpal_skill/references/evolved-lessons.md`（Trace2Skill 追加）

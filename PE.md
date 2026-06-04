# QingLu Router · PE 说明（简版）

## 1. Skill 是怎么加载的？

**不是**运行时读 `Agent/burnpal_skill/` 文件，**也不是**调 Skill 相关 API。

流程是：

1. **构建时**：`npm run bundle:skill` 执行 `frontend/scripts/bundle-qinglu-skill-modules.mjs`，从磁盘读取 Skill 目录下的 `.md` / `.json`，打成字符串常量，写入 `frontend/src/generated/qingluSkillModules.ts`（相当于 **hardcode 进前端代码**）。
2. **发消息时**：前端 `skillRouter.ts` 根据用户话（或今日任务 `sceneType`）选一个模块 ID，再调用 `getQingluSkillModuleContext(moduleId)`，从上述常量里取出 **「共享路由层 + 该模块」** 文本，拼进 System Prompt。
3. **请求百炼**：整条 `messages` 由浏览器经 Vercel OpenClaw 代理转发，代理**不改** prompt 内容。

共享层（每轮都有）：根 `SKILL.md`、`user-profiles.json`、`evolved-lessons.md`。  
模块层（四选一）：`skill1-diet` / `skill2-venue` / `skill3-recovery` / `skill4-social`，或 `general`（仅路由层、无子模块正文）。

---

## 2. System Prompt 现在长什么样？

一条 `role: system`，由 `buildClusterSystemPrompt()` 拼成，结构如下：

```text
【产品规则】轻鹭人设、IM 格式（无 Markdown 标题/表）、店名须来自 Skill JSON 等

【用户实况】位置、今日热量/剩余 kcal、档案与行为约束（App 已采集）

【本轮编排】本轮重点 + 1/2/3 步骤（由 decomposeTask 生成）

【路由声明】已加载：Skill X · xxx（命中原因）；仅用本模块与共享 JSON

【偏好/守门】输出守门开关、cluster 约束、进化笔记摘要等（若有）

--- 以下为路由层 + 当前模块 Skill ---

（共享）=== burnpal_skill/SKILL.md ===
（共享）=== burnpal_skill/assets/user-profiles.json ===
（共享）=== burnpal_skill/references/evolved-lessons.md ===

--- Active Skill module: skill1-diet ---   ← 示例，实际随路由变化

（模块）=== burnpal_skill/skills/skill1-diet/SKILL.md ===
（模块）=== burnpal_skill/skills/skill1-diet/assets/takeout.json ===
（模块）… 该模块下其余 .md / .json …
```

**草稿示例**（用户：「中午想点外卖，还剩 600 大卡」→ 路由到 `skill1-diet`）：

```text
你是「轻鹭」(QingLu)，用户的本地生活减脂 AI 管家。…
IM 输出：先一句结论（含 kcal），再 2–4 条短建议；禁止编造店名。…

【用户实况 · App 已采集】
配送/生活圈：朝阳区 · 国贸（…）
今日热量：已摄入约 1600 kcal；每日目标 2200 kcal；剩余额度约 600 kcal
…

本轮重点：外卖
本轮步骤：
1. 使用已知配送区域与今日剩余热量额度
2. 筛选 2–3 套外卖组合（含店名或品类）
3. 标注热量与替换建议

【Skill 路由 · 方案 B】已加载：Skill 1 · 吃什么（饮食 / 外卖 / 聚餐）。仅使用本模块与共享 JSON；勿引用未加载模块数据。
…

--- 以下为路由层 + 当前模块 Skill（非四模块全量）---
（此处接上共享 SKILL.md + user-profiles + skill1-diet 目录内全部文件正文，体积约 三十余 KB 文本）
```

发给模型的消息形态：

```json
{
  "messages": [
    { "role": "system", "content": "<上列整段字符串>" },
    { "role": "user", "content": "中午想点外卖，还剩 600 大卡" }
  ]
}
```

---
name: scene-orchestrator
description: "Route 小爪 user intent to gathering, takeout, or workout meal skills. Use for ambiguous meal questions or as default entry for 聚餐/外卖/练后."
metadata:
  {
    "openclaw":
      {
        "emoji": "🧭",
        "requires": { "bins": ["python"] }
      }
  }
---

# 小爪场景编排器

用户第一句话进入小爪时，**优先使用本 Skill**。职责：意图分类 → `@skill-invoke` 委托 → 合并 SOUL 风格回复。

## 何时触发

- 用户问题涉及「吃」但未明确场景
- 前端三卡片规范 prompt（聚餐 / 快餐 / 锻炼饮食）
- 多轮对话中场景切换（「算了还是点外卖」）

## 工作流

1. **读协议**（首次）：`hackathod_skill/protocol/inter-skill-call.md`
2. **拉上下文**：
   ```bash
   python hackathod_skill/base/context-hub/scripts/resolve_context.py --skip-weather
   ```
3. **意图打分**（见 `references/full-guide.md` 置信度表）
4. **路由**：
   - gathering ≥0.7 → `@skill-invoke: gathering-meal-advisor`
   - takeout ≥0.7 → `@skill-invoke: takeout-meal-advisor`
   - workout ≥0.7 → `@skill-invoke: workout-recovery-advisor`
   - yiqidong ≥0.7 → `@skill-invoke: yiqidong-social-sports`
   - else → 一句澄清（聚餐 / 外卖 / 练后 / 一起动 四选一）
5. **合并输出**：结论 + 方案 + 数据依据（≤220 字可见正文）

## 下游 Skill

| Skill | 路径 |
|-------|------|
| 聚餐 | `hackathod_skill/skills/gathering-meal-advisor` |
| 外卖 | `hackathod_skill/skills/takeout-meal-advisor` |
| 练后 | `hackathod_skill/skills/workout-recovery-advisor` |
| 一起动 | `hackathod_skill/skills/yiqidong-social-sports` |

## 基础 Skill（必须先于或并行委托）

- `mock-data-access` — profile
- `context-hub` — 餐次预算
- `nutrition-engine` — 由下游执行，编排器不重复计算

## 禁止

- 不编造 POI / 菜单
- 不代替下游写完整点菜方案（低置信度除外可给 1 条临时原则）
- 比赛阶段不接美团真实下单

## 完整文档

**必读**：`references/full-guide.md`（≥10000 字，含词典、状态机、测试用例、失败降级）

---
name: diet-eval-agent
description: "Skill 1 测评 Agent。对用户输入做场景路由（A1/A2/B/C/D/E），对助手回答做五维执行评分 + 全局调性规则校验。供 scorer 小队、Trace2Skill 与离线评测使用。"
metadata:
  {
    "openclaw":
      {
        "emoji": "📋",
        "requires": { "bins": [] }
      }
  }
---

# Skill 1 测评 Agent

对齐飞书文档 **「智能饮食管家 · 测评框架与指标体系」** 与 PRD **本地生活减脂管家** 目标。

## 职责

| 模块 | 测评目标 | 输出 |
|------|----------|------|
| **1. 场景路由** | 用户一句话 → 6 场景之一 | A1 聚餐选餐厅 / A2 到店点单 / B 外卖 / C 异地 / D 餐后补救 / E 热量查询 |
| **2. 场景执行** | 进入场景后流程是否正确 | 五维：信息提取、方案质量、数据依据、可执行性、场景贴合 |
| **3. 全局规则** | Skill 1 调性底线 | 数据先行、温和引导、有理有据、简洁、情绪回应 |

路由是入口，执行是主体，全局规则是约束层。

## 路由优先级（Decision Guide）

1. **E** 热量查询 — 热量/kcal/还能吃多少
2. **D** 餐后补救 — 吃多了/超标/补救
3. **A2** 到店点单 — 具体门店/菜单/怎么点
4. **A1** 聚餐选餐厅 — 聚餐/约饭/推荐餐厅
5. **B** 外卖智选 — 外卖/配送
6. **C** 异地探索 — 出差/旅游/当地健康餐

## 全局规则（与 Skill 1 一致）

- ✓ 数据先行：kcal/克数/剩余额度
- ✓ 温和：「可以/建议」，禁止「必须/严重超标」
- ✓ 有理有据：烹饪方式、蛋白、少油
- ✓ 简洁：无长开场白
- ✓ 情绪：用户懊恼时先安抚

## 前端实现

- `frontend/src/lib/evalAgent.ts` — `runEvalAgent()` / `routeDietScene()`
- `frontend/src/lib/agentCluster.ts` — scorer 调用 `scoreResponse` → 测评报告
- `AgentPhaseRail` — 展示路由 + 五维 + 调性 checklist
- 轨迹 `labels.success` — 总分 ≥75 且全局规则 ≥4/5 通过

## Trace2Skill 衔接

- 成功轨迹：`evalReport.pass === true` + 👍
- 失败轨迹：`global_rule_miss` / `weak_route` / `low_score` 标签 → error analyst

## 禁止

- 不用「结构/可执行/健身贴合」等泛化三维代替飞书五维
- 不将测评结果绑定单条 mock POI
- 医学营养建议不在本 Agent 评分范围内（应拒绝并转医生）

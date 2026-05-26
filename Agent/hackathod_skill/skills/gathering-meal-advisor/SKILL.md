---
name: gathering-meal-advisor
description: "Offline gathering meal advice for 小爪: hotpot, BBQ, Sichuan. Mock POI/menus, fat-loss ordering. Use for 火锅/朋友约/聚餐/点菜."
metadata:
  {
    "openclaw":
      {
        "emoji": "🍲",
        "requires": { "bins": ["python"] }
      }
  }
---

# 小爪聚餐顾问

线下多人就餐（火锅、烧烤、川菜等）的减脂友好点菜策略。数据来自 mock，输出具体 kcal 与蛋白质克数。

## 何时触发

- 关键词：火锅、聚餐、朋友约、饭局、点菜、烧烤、川菜馆
- 由 `scene-orchestrator` 委托

## 工作流

1. `@skill-invoke: context-hub`（餐次 budget）
2. 读取 mock：
   ```bash
   python hackathod_skill/base/mock-data-access/scripts/load_mock.py gathering_pois --pretty
   python hackathod_skill/base/mock-data-access/scripts/load_mock.py hotpot_menu --pretty
   ```
3. 按 `references/full-guide.md` 决策树组餐
4. `@skill-invoke: nutrition-engine` 算 health_score（**Windows 请用** `--totals` 或 `--menu hotpot_menu --skus ...`，勿用内联 JSON 引号）
5. SOUL 输出：先结论（650kcal / 35g+ 蛋白量级），再 3–5 条可执行步骤

## 场景要点

- **火锅**：番茄/菌汤底、瘦牛+虾滑+毛肚、绿叶菜、醋蒜蘸料
- **烧烤**：虾/鸡胸/蔬菜串，少酱少酒
- **川菜**：少油、去皮、半份饭

## 互调

- 上游：`scene-orchestrator`
- 基础：`mock-data-access`, `nutrition-engine`, `context-hub`
- 可选：`weather`（天冷推荐热汤底，非必须）

## 完整文档

`references/full-guide.md`（≥10000 字：SKU 组合示例、社交话术、多人分工、Q&A）

---
name: workout-recovery-advisor
description: "Post-workout recovery meals for 小爪: protein window, mock templates pwr/cardio. Use for 练后/训练后/恢复餐/蛋白."
metadata:
  {
    "openclaw":
      {
        "emoji": "💪",
        "requires": { "bins": ["python"] }
      }
  }
---

# 小爪练后恢复顾问

力量/有氧训练后的补餐方案，对齐蛋白缺口与 45–90 分钟窗口期。

## 何时触发

- 关键词：练后、训练后、健身完、恢复餐、蛋白、窗口期
- 由 `scene-orchestrator` 委托

## 工作流

1. `@skill-invoke: context-hub` + `mock-data-access profile`
2. 读取模板：
   ```bash
   python hackathod_skill/base/mock-data-access/scripts/load_mock.py recovery_menu --pretty
   ```
3. 判断训练类型与时间 → 选 `pwr_001` / `pwr_002` / `cardio_001`（见 full-guide）
4. `@skill-invoke: nutrition-engine`（Windows 用 `--totals` 或 `--menu recovery_menu --skus ...`）
5. 若用户要点外卖：`@skill-invoke: takeout-meal-advisor` 并约束蛋白

## 输出要点

- 必须给出蛋白克数（≥30g 练后餐）
- 说明是否在窗口期内
- 语气轻松，不说教

## 互调

- 上游：`scene-orchestrator`
- 下游：`takeout-meal-advisor`（练后+外卖）
- 基础：`mock-data-access`, `nutrition-engine`, `context-hub`

## 完整文档

`references/full-guide.md`（≥10000 字：窗口期、蛋白缺口、模板详解、Q&A）

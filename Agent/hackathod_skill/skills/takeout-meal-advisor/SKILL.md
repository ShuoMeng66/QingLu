---
name: takeout-meal-advisor
description: "Delivery and fast-food meal picks for 小爪 with mock POI/combos, protein and kcal scoring. Use for 外卖/快餐/配送/加班餐."
metadata:
  {
    "openclaw":
      {
        "emoji": "🛵",
        "requires": { "bins": ["python"] }
      }
  }
---

# 小爪外卖顾问

外卖、快餐、轻食的选店与组合建议。比赛阶段仅用 mock，不对接美团 BEP。

## 何时触发

- 关键词：外卖、快餐、配送、轻食、汉堡、沙拉、美团、饿了么
- 练后用户要点外卖：由 `workout-recovery-advisor` 委托并传入 `min_protein`

## 工作流

1. `@skill-invoke: context-hub`
2. 读取 mock：
   ```bash
   python hackathod_skill/base/mock-data-access/scripts/load_mock.py takeout_pois --pretty
   python hackathod_skill/base/mock-data-access/scripts/load_mock.py fastfood_menu --pretty
   ```
3. 按 health_score 与 `references/full-guide.md` 选店算法排序 combo
4. `@skill-invoke: nutrition-engine` 验证 kcal/蛋白（Windows 用 `--totals` 或 `--menu fastfood_menu --skus ...`）
5. 输出带 `combo_id` / `poi_id` 的建议，**不**声称已下单

## 改良规则

- 去酱、换玉米杯、零度/美式
- 备注栏写清「去酱」「半份饭」

## 互调

- 上游：`scene-orchestrator`, `workout-recovery-advisor`
- 基础：`mock-data-access`, `nutrition-engine`, `context-hub`

## 完整文档

`references/full-guide.md`（≥10000 字：选店公式、combo 解读、时段策略、Q&A）

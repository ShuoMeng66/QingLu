---
name: nutrition-engine
description: "Sum meal kcal/protein and score fat-loss fit for hackathod. Use after loading mock menu items; outputs health_score and verdict."
metadata:
  {
    "openclaw":
      {
        "emoji": "🥗",
        "requires": { "bins": ["python"] }
      }
  }
---

# Nutrition Engine

对 mock 菜单项或用户确认的组合做宏量求和与减脂评分。**所有数字建议来自本脚本，而非心算。**

## 命令

```bash
# 推荐：Windows 安全，无需 JSON 引号
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner --totals 620,38,58,22
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner --menu hotpot_menu --skus lean_beef,shrimp_paste,leafy_mix

# 从文件读取（跨平台）
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal lunch --items-file hackathod_skill/mock/samples/lunch_items.json

# stdin / 内联 JSON（Linux/macOS bash 可用；Windows PowerShell 请优先用上面三种）
echo '[{"kcal":620,"protein_g":38,"carb_g":58,"fat_g":22}]' | python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner
```

## 输出字段

- `total`: kcal, protein_g, carb_g, fat_g
- `health_score`: 0–100
- `verdict`: 优秀 / 可用 / 需调整
- `protein_gap_g`, `kcal_gap`: 相对 profile 餐次预算

## 被谁调用

所有领域 Skill 在给出「结论」前必须委托本 Skill（或等价执行上述命令）。

## 互调

```
@skill-invoke: hackathod_skill/base/nutrition-engine
```

## 参考

- `references/formulas.md`

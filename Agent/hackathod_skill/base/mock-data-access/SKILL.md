---
name: mock-data-access
description: "Load hackathod mock JSON (POI, menus, user profile). Use before any xiaozhua meal skill; never invent store data."
metadata:
  {
    "openclaw":
      {
        "emoji": "📂",
        "requires": { "bins": ["python"] }
      }
  }
---

# Mock Data Access

比赛阶段唯一数据源：`hackathod_skill/mock/`。本 Skill 提供确定性读取，禁止 Agent 编造门店/ SKU。

## 命令

```bash
python hackathod_skill/base/mock-data-access/scripts/load_mock.py list
python hackathod_skill/base/mock-data-access/scripts/load_mock.py profile --pretty
python hackathod_skill/base/mock-data-access/scripts/load_mock.py gathering_pois --pretty
python hackathod_skill/base/mock-data-access/scripts/load_mock.py hotpot_menu --pretty
```

## 键名

| key | 文件 | 用途 |
|-----|------|------|
| profile | profiles/default_user.json | 用户减脂目标与餐次预算 |
| locations | locations.json | 城市/区县 mock 位置 |
| gathering_pois | poi/gathering_pois.json | 聚餐门店 |
| takeout_pois | poi/takeout_pois.json | 外卖门店 |
| hotpot_menu | menus/hotpot_menu.json | 火锅 SKU |
| fastfood_menu | menus/fastfood_menu.json | 快餐 combo |
| recovery_menu | menus/recovery_menu.json | 练后模板 |
| nearby_activities | activities/nearby_activities.json | 周末附近活动 |
| sports_types | activities/sports_types.json | 运动类型与 AQI/天气规则 |
| air_quality | environment/air_quality.json | 城市 AQI mock |
| user_created_events | activities/user_created_events.json | 用户发起的活动 |

## 被谁调用

- `scene-orchestrator`：预加载 profile
- `gathering-meal-advisor`：gathering_pois + hotpot_menu
- `takeout-meal-advisor`：takeout_pois + fastfood_menu
- `workout-recovery-advisor`：recovery_menu + profile

## 互调

下游 Skill 通过 `@skill-invoke: hackathod_skill/base/mock-data-access` 调用；协议见 `hackathod_skill/protocol/inter-skill-call.md`。

## 参考

- `references/catalog.md` — 完整目录与字段说明

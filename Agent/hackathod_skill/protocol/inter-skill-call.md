# Hackathod Skill 互调协议

本协议定义 `hackathod_skill` 包内 Skill 之间、以及与 OpenClaw 内置 Skill（如 `weather`）之间的协作方式。

## 设计原则

1. **单一职责**：基础 Skill 提供数据/计算/上下文；领域 Skill 负责场景话术与决策。
2. **显式委托**：每次跨 Skill 调用必须写出 `@skill-invoke` 块，便于审计与调试。
3. **Mock 优先**：比赛阶段禁止调用真实美团 API；所有 POI/菜单来自 `hackathod_skill/mock/`。
4. **可组合**：领域 Skill 不得重复实现营养计算或 mock 读取，必须委托基础 Skill。

## 调用语法

```markdown
@skill-invoke: hackathod_skill/base/mock-data-access
Purpose: 读取聚餐 POI 列表
Command: python hackathod_skill/base/mock-data-access/scripts/load_mock.py gathering_pois --pretty
Expected: JSON with pois[]
OnFailure: 告知用户 mock 数据缺失，勿编造门店
```

```markdown
@skill-invoke: hackathod_skill/base/nutrition-engine
Purpose: 计算火锅点菜组合宏量
Command: python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner --menu hotpot_menu --skus lean_beef,shrimp_paste,leafy_mix
Expected: health_score, verdict, protein_gap_g
```

```markdown
@skill-invoke: hackathod_skill/base/context-hub
Purpose: 获取城市天气与减脂目标上下文
Command: python hackathod_skill/base/context-hub/scripts/resolve_context.py
Expected: city, weather, daily_kcal_target
Fallback: 使用 `--skip-weather` 仅返回 mock 位置
```

```markdown
@skill-invoke: weather
Purpose: 官方 wttr.in 天气（context-hub 已封装时可跳过）
Command: curl "wttr.in/Beijing?format=3"
```

```markdown
@skill-invoke: hackathod_skill/skills/yiqidong-social-sports
Purpose: 发现/发起/推送运动活动
Command: python hackathod_skill/skills/yiqidong-social-sports/scripts/discover_activities.py --limit 5
Expected: activities[] with activity_id, share_text (create 模式)
```

## 领域 Skill 路由表

| 用户意图关键词 | 目标 Skill | 置信度规则 |
|----------------|------------|------------|
| 火锅、聚餐、朋友约、饭局、点菜 | gathering-meal-advisor | ≥0.7 直接路由 |
| 外卖、快餐、配送、美团、饿了么 | takeout-meal-advisor | ≥0.7 直接路由 |
| 练后、训练后、恢复餐、蛋白 | workout-recovery-advisor | ≥0.7 直接路由 |
| 飞盘、骑行、跑团、徒步、组局、周末活动、今天适合什么运动 | yiqidong-social-sports | ≥0.7 直接路由 |
| 混合/不确定/多场景 | scene-orchestrator | 默认入口 |

`scene-orchestrator` 识别场景后，按相同 `@skill-invoke` 协议委托下游 Skill，并在最终回复中合并结论（先结论后方案，符合 SOUL.md）。

## 返回合并格式

下游 Skill 返回给编排器或用户时，使用统一结构：

```markdown
## 结论
一句话可执行建议（含 kcal / 蛋白质克数）

## 方案
- 步骤 1 …
- 步骤 2 …

## 数据依据
- mock: `poi_id` / `combo_id` / `template_id` / `activity_id` / `event_id`
- health_score: XX（饮食类）| aqi: XX（一起动）
```

## 错误码

| Code | 含义 | Agent 行为 |
|------|------|------------|
| MOCK_404 | mock 文件不存在 | 停止编造，提示检查 hackathod_skill/mock |
| NUTRITION_EMPTY | items 为空 | 追问用户已点/计划点的菜 |
| SCENE_LOW_CONF | 场景置信度 <0.5 | 用一句澄清问句，勿强行路由 |
| WEATHER_OFFLINE | wttr.in 不可用 | 使用 context-hub mock_fallback，继续服务 |

## 与 OpenClaw 配置

在 `openclaw.json` 中加载本包：

```json
"skills": {
  "load": {
    "extraDirs": [
      "D:/Hackathod/Agent/hackathod_skill/base",
      "D:/Hackathod/Agent/hackathod_skill/skills"
    ]
  }
}
```

工作区 `AGENTS.md` 要求仅使用 mock；本协议与之对齐。

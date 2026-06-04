# QingLu System Prompt（PE）说明

> 运行时由 `frontend/src/lib/qingluSystemPrompt.ts` 拼装，变量从用户档案 / 今日状态 / 路由 / session_context 读取，**不再使用** `demo_user_id`、Lisa/Mia 等模拟档案。

## Skill 加载方式

构建时：`npm run bundle:skill` 将 `Agent/burnpal_skill/` 打成 `qingluSkillModules.ts`（hardcode 字符串）。  
运行时：`skillRouter` 选一个模块 → `getQingluSkillModuleContext(moduleId)` 拼入 prompt 末尾。

## 运行时变量对照（原模板 `{{变量}}`）

| 模板变量 | 代码来源 |
|----------|----------|
| `user_profile.name` | `UserProfile.nickname` |
| `user_profile.goal` | 减脂/增肌/维持 |
| `user_profile.goal_intensity` | 由 goal 推导 |
| `user_profile.diet_strategy` | `preferences.favorite_cuisines` |
| `user_profile.food_restrictions` | `preferences.avoid` |
| `user_profile.taste_preference` | 同上 |
| `user_profile.takeout_budget` | 默认 `30–50元`（可后续接档案字段） |
| `user_profile.dining_budget` | 默认 `100–200元` |
| `user_profile.workout_preferences` | `training.typical_session` 等 |
| `user_profile.fitness_level` | 档案 tier / experience |
| `user_profile.common_locations` | GPS/IP 或 `location_city` |
| `user_profile.risk_notes` | `training_profile.limitations` |
| `daily_state.*` | `todaySnapshot` + 实时 kcal |
| `today_intake_kcal` / `daily_target_kcal` | `mealLog` + `daily_targets` |
| `task_focus` | `decomposeTask().focus` |
| `decomposed_steps` | `decomposeTask().steps` |
| `active_skill_name` / `active_skill_id` | `routeQingluSkillModule()` |
| `route_reason` | `matchedSignals` |
| `session_context.*` | `localStorage` `qinglu.session-context-v1` |

## 建档信号

`[SYSTEM_ONBOARDING]`（常量 `SYSTEM_ONBOARDING_SIGNAL`）：前端可发此用户消息触发 PE 内建档引导语；用户通过 **设置/建档页** 填写档案后走 `/ready`，不依赖模拟人设。

## System Prompt 结构（摘要）

1. 角色 + 全局行为规则  
2. 结构化 JSON 规则（`---JSON_START---` / `---JSON_END---`）  
3. 用户实况（user_profile + daily_state + session_context JSON）  
4. 本轮编排（decomposeTask）  
5. Skill 路由（当前模块 id + 命中原因）  
6. 偏好与守门  
7. 路由层 + 当前模块 Skill 全文（bundle 注入）

## session_context 更新

- 每轮发送前：`seedSessionContextForTurn` 写入 `current_skill`、`scene_type`、`current_area`  
- 助手回复后：`updateSessionFromAssistantReply` 解析完整 `---JSON_START---` 块更新 `last_recommendations` / `scene_type`  
- 用户点选 follow-up 按钮：`setSessionSelection` + `runUserTurn` 自动发第二轮消息（`AppProvider.handleFollowUpAction`）

## 结构化卡片（前端）

- `assistantStructured.ts`：`splitAssistantStructured` 剥离 JSON，`getMessageRecommendationCards` 优先 JSON → Skill 店名 → OSM  
- `useChatStream` 落库时只存 prose，`assistantMeta` 存 follow-up / 推荐名  
- `ChatView`：`FollowUpActions` + `RichCard` 列表

## 验收测试

仍可按原 Test 1–6、8 执行；**Test 7（demo_user_id）已废弃**，改为：完成 `/onboard` 自建档案后，用户实况应显示本人昵称、城市、剩余 kcal 与训练计划。

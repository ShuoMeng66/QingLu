# 小爪一起动社交运动管家完整指南
本文档为 hackathod_skill 比赛阶段 mock 实现参考，Agent 按需加载。

## 产品定位

「一起动」是小爪的 Skill 4，社交运动管家。与 Skill 1–3（聚餐/外卖/练后）组成完整「减脂 + 本地生活 + 社交运动」闭环。

核心价值链：
- **发现**：降低「周末不知道干嘛」的决策成本
- **组织**：一句话发起活动，生成可分享文案（传播引擎）
- **推送**：结合天气/AQI 的少数主动触达场景，提升 DAU 与留存

比赛阶段全部基于 `mock/activities/` 与 `mock/environment/`，不对接 Meetup/豆瓣/美团到店真实 API。

## 四大能力与 PRD 对齐

| PRD 能力 | 实现 | mock/脚本 |
|----------|------|-----------|
| 活动推送 | recommend_today.py | sports_types + air_quality + weather |
| 发现活动 | discover_activities.py | nearby_activities.json |
| 发起活动 | create_activity.py | user_created_events.json |
| 主动推送 | push_scan.py | push_enabled + 附近高 match 活动 |

用户原话映射：
- 「这周末附近有什么运动活动」→ discover，默认返回飞盘/骑行/跑团/徒步 Top N
- 「帮我发个周六下午的飞盘局，朝阳公园，限 8 人」→ create，解析 sport/venue/time/max
- 会话开场或定时任务 → push_scan，输出 notification_text

## Mock 数据模型

**nearby_activities.json**
- activity_id, type_id, title, sport, venue, start_time
- participants / max_participants — 用于「还差 X 人」传播话术
- distance_km, match_score — 发现排序

**sports_types.json**
- 各运动的 aqi_max, weather_bad, kcal_per_hour, outdoor_required
- 雨天自动抬升 indoor 项目（羽毛球）

**air_quality.json**
- 按 city/district 的 aqi, outdoor_sports_ok
- thresholds.outdoor_block_aqi = 150

**user_created_events.json**
- create_activity.py 追加 events[]
- share_text 字段用于一键复制邀请

## 今日运动推荐算法

`recommend_today.py` 对每个 sport_type 计算 score：

```
base = 50
+ 户外且 AQI <= aqi_max → +15
+ AQI 超标 → -40
+ 室内项目 → +20（不受 AQI）
+ 天气适宜 → +10；降水/恶劣 → -30~-35
+ kcal_per_hour 加成（上限 +15）
+ 用户 favorite_sports 命中 → +12
```

取得分 Top 3 作为「今日推荐」。若 Top1 score ≥ 65，生成 push_message：
「今天{区}空气AQI {n}，适合{运动}，预计消耗约{kcal}kcal/小时。」

Agent 回复时必须带具体数字，符合 SOUL.md。

## 发现活动算法

`discover_activities.py` 过滤与排序：

1. 可选 `--sport 飞盘` 过滤
2. `distance_km <= max_distance_km`（默认 15km）
3. `final_score = match_score + (sport in favorite_sports ? 10 : 0)`
4. 降序取 `--limit` 条

输出字段供 Agent 组织话术：
- 标题、时间、地点、距离、名额、费用
- 示例：「周六 15:00 朝阳公园飞盘新手局，2.3km，免费，还差 7 人」

## 发起活动·自然语言解析

Agent 从用户句中提取槽位后调用 CLI：

| 槽位 | 示例 | 默认值 |
|------|------|--------|
| sport | 飞盘/骑行/跑团/徒步 | 必填 |
| venue | 朝阳公园 | 必填 |
| time | 周六下午 / ISO | 下一周六 15:00 |
| max_participants | 限 8 人 | 8 |
| title | 可选 | {venue}{sport}局 |

命令：
```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/create_activity.py \
  --sport 飞盘 --venue 朝阳公园 --time 2026-05-24T15:00 --max-participants 8
```

成功返回 event_id + share_text。Agent 回复：
「已帮你建好局！转发这句：{share_text}」

**禁止**声称已同步到真实 App；说明为 mock 演示，正式版将接入活动平台。

## 主动推送策略

`push_scan.py` 是小爪**少数主动推送**入口之一。

触发条件（同时考虑）：
1. `profile.sports.push_enabled == true`
2. 非 `push_quiet_hours`（23:00–08:00）
3. `recommend_today` 的 push_message 非空 **或** nearby 存在 match_score≥85 活动

合并文案示例：
「今天朝阳 AQI 68，适合飞盘，约 350kcal/小时。附近有个『朝阳公园飞盘新手局』，2.3km，还差 7 人满员。」

Agent 在会话**首次连接**或用户**打开小爪**时可主动执行 push_scan；勿在同一会话重复推送。

## 与 context-hub / weather 协作

- 委托：context-hub 提供 city/district/weather（要点 1）
- 委托：air_quality.json 提供 AQI（mock，非真实环保 API）（要点 2）
- 委托：weather Skill 可选 curl wttr.in 增强降水判断（要点 3）
- 委托：AQI>150 仅推荐室内羽毛球（要点 4）
- 委托：雨天 outdoor_required 项目降权（要点 5）
- 委托：极热天气 hiking 降权（要点 6）
- 委托：context-hub 提供 city/district/weather（要点 1）
- 委托：air_quality.json 提供 AQI（mock，非真实环保 API）（要点 2）
- 委托：weather Skill 可选 curl wttr.in 增强降水判断（要点 3）
- 委托：AQI>150 仅推荐室内羽毛球（要点 4）
- 委托：雨天 outdoor_required 项目降权（要点 5）
- 委托：极热天气 hiking 降权（要点 6）
- 委托：context-hub 提供 city/district/weather（要点 1）
- 委托：air_quality.json 提供 AQI（mock，非真实环保 API）（要点 2）
- 委托：weather Skill 可选 curl wttr.in 增强降水判断（要点 3）
- 委托：AQI>150 仅推荐室内羽毛球（要点 4）
- 委托：雨天 outdoor_required 项目降权（要点 5）
- 委托：极热天气 hiking 降权（要点 6）
- 委托：context-hub 提供 city/district/weather（要点 1）
- 委托：air_quality.json 提供 AQI（mock，非真实环保 API）（要点 2）
- 委托：weather Skill 可选 curl wttr.in 增强降水判断（要点 3）
- 委托：AQI>150 仅推荐室内羽毛球（要点 4）
- 委托：雨天 outdoor_required 项目降权（要点 5）
- 委托：极热天气 hiking 降权（要点 6）

## 与 workout-recovery 联动

用户路径：「明天跑团，跑完吃什么？」

1. yiqidong discover 推荐 act_run_001
2. `@skill-invoke: workout-recovery-advisor`，training_type=running
3. 合并：「周六 7:00 奥森 5K，跑完 45 分钟内 pwr_001 酸奶+香蕉+鸡胸」

yiqidong 不计算餐食宏量，必须委托 workout + nutrition-engine。

## 运动类型百科

- 飞盘：6-14 人社交型（要点 1）
- 飞盘：90 分钟（要点 2）
- 飞盘：350kcal/h（要点 3）
- 飞盘：新手友好（要点 4）
- 飞盘：需开阔草地（要点 5）
- 飞盘：朝阳公园为 mock 默认场地（要点 6）
- 飞盘：限 8 人局适合熟人扩散（要点 7）
- 飞盘：避免大风天（要点 8）
- 飞盘：6-14 人社交型（要点 1）
- 飞盘：90 分钟（要点 2）
- 飞盘：350kcal/h（要点 3）
- 飞盘：新手友好（要点 4）
- 飞盘：需开阔草地（要点 5）
- 飞盘：朝阳公园为 mock 默认场地（要点 6）
- 飞盘：限 8 人局适合熟人扩散（要点 7）
- 飞盘：避免大风天（要点 8）
- 飞盘：6-14 人社交型（要点 1）
- 飞盘：90 分钟（要点 2）
- 飞盘：350kcal/h（要点 3）
- 飞盘：新手友好（要点 4）
- 飞盘：需开阔草地（要点 5）
- 飞盘：朝阳公园为 mock 默认场地（要点 6）
- 飞盘：限 8 人局适合熟人扩散（要点 7）
- 飞盘：避免大风天（要点 8）

## 运动类型百科·骑行/跑团/徒步

- 骑行/跑团/徒步：骑行亮马河夜骑休闲 1.8km（要点 1）
- 骑行/跑团/徒步：跑团奥森 5K 减脂向（要点 2）
- 骑行/跑团/徒步：徒步温榆河半日轻强度（要点 3）
- 骑行/跑团/徒步：室内羽毛球雨天 fallback（要点 4）
- 骑行/跑团/徒步：各类型 kcal/h 见 sports_types（要点 5）
- 骑行/跑团/徒步：骑行亮马河夜骑休闲 1.8km（要点 1）
- 骑行/跑团/徒步：跑团奥森 5K 减脂向（要点 2）
- 骑行/跑团/徒步：徒步温榆河半日轻强度（要点 3）
- 骑行/跑团/徒步：室内羽毛球雨天 fallback（要点 4）
- 骑行/跑团/徒步：各类型 kcal/h 见 sports_types（要点 5）
- 骑行/跑团/徒步：骑行亮马河夜骑休闲 1.8km（要点 1）
- 骑行/跑团/徒步：跑团奥森 5K 减脂向（要点 2）
- 骑行/跑团/徒步：徒步温榆河半日轻强度（要点 3）
- 骑行/跑团/徒步：室内羽毛球雨天 fallback（要点 4）
- 骑行/跑团/徒步：各类型 kcal/h 见 sports_types（要点 5）
- 骑行/跑团/徒步：骑行亮马河夜骑休闲 1.8km（要点 1）
- 骑行/跑团/徒步：跑团奥森 5K 减脂向（要点 2）
- 骑行/跑团/徒步：徒步温榆河半日轻强度（要点 3）
- 骑行/跑团/徒步：室内羽毛球雨天 fallback（要点 4）
- 骑行/跑团/徒步：各类型 kcal/h 见 sports_types（要点 5）
- 骑行/跑团/徒步：骑行亮马河夜骑休闲 1.8km（要点 1）
- 骑行/跑团/徒步：跑团奥森 5K 减脂向（要点 2）
- 骑行/跑团/徒步：徒步温榆河半日轻强度（要点 3）
- 骑行/跑团/徒步：室内羽毛球雨天 fallback（要点 4）
- 骑行/跑团/徒步：各类型 kcal/h 见 sports_types（要点 5）

## 对话示例

- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）
- Q/A：Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。（要点 1）
- Q/A：Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。（要点 2）
- Q/A：Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。（要点 3）
- Q/A：Q: 空气不好？ A: AQI>100 改推室内羽毛球。（要点 4）
- Q/A：Q: 跑完吃啥？ A: 委托 workout-recovery。（要点 5）

## 错误与边界

| 情况 | 行为 |
|------|------|
| mock 活动为空 | 引导用户 create_activity 自己组局 |
| 用户关闭 push | push_scan 返回 should_push:false |
| 未识别运动类型 | 澄清：飞盘/骑行/跑团/徒步/羽毛球 |
| 真实平台 API | 比赛阶段拒绝，指向 mock |

不做医疗建议；有伤病用户建议咨询医生后再参加高强度活动。

## 命令速查

```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/recommend_today.py --skip-weather
python hackathod_skill/skills/yiqidong-social-sports/scripts/discover_activities.py --limit 5
python hackathod_skill/skills/yiqidong-social-sports/scripts/create_activity.py --sport 飞盘 --venue 朝阳公园 --time 2026-05-24T15:00 --max-participants 8
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_scan.py
python hackathod_skill/base/mock-data-access/scripts/load_mock.py nearby_activities --pretty
```

## 小爪一起动社交运动管家完整指南·扩展条目 1

- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）
- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）

## 小爪一起动社交运动管家完整指南·扩展条目 2

- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）
- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）

## 小爪一起动社交运动管家完整指南·扩展条目 3

- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）
- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）

## 小爪一起动社交运动管家完整指南·扩展条目 4

- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）
- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）

## 小爪一起动社交运动管家完整指南·扩展条目 5

- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）
- 补充：保持结论先行（要点 1）
- 补充：使用 mock 数据（要点 2）
- 补充：委托 nutrition-engine（要点 3）
- 补充：避免说教（要点 4）
- 补充：给出 kcal 与蛋白克数（要点 5）
- 补充：场景切换交 orchestrator（要点 6）
- 补充：不调用真实美团 API（要点 7）
- 补充：失败时诚实降级（要点 8）
- 补充：对齐 SOUL 人设（要点 9）
- 补充：合并输出不超过 220 字（要点 10）

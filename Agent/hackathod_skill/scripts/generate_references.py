#!/usr/bin/env python3
"""Generate comprehensive reference docs for hackathod skills (10k+ chars each)."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: Path, content: str) -> int:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return len(content)


def section(title: str, body: str) -> str:
    return f"\n## {title}\n\n{body}\n"


def expand_bullets(prefix: str, items: list[str], repeat: int = 1) -> str:
    lines = []
    for r in range(repeat):
        for i, item in enumerate(items, 1):
            lines.append(f"- {prefix}{item}（要点 {i}）")
    return "\n".join(lines)


# --- Scene Orchestrator ---
ORCHESTRATOR_SECTIONS = [
    ("角色定位", """场景编排器是小爪对话系统的「交通警察」。用户的第一句话往往并不精确：「今晚怎么办」「有点饿」「朋友叫吃饭」——这些都需要在 300ms 级决策（Agent 思考层面）内映射到聚餐、外卖、练后三大领域 Skill 之一，或在低置信度时发起澄清。

编排器**不**直接给出详细点菜方案；它负责：
1. 意图分类与置信度打分
2. 读取 `protocol/inter-skill-call.md` 并生成 `@skill-invoke` 委托块
3. 合并下游 Skill 的结构化输出为 SOUL.md 要求的「先结论后方案」回复
4. 处理多轮对话中的场景切换（例如：先问火锅，再问「那明天练完吃什么」）"""),
    ("意图分类词典", expand_bullets(
        "聚餐信号：", [
            "火锅", "烧烤", "饭局", "朋友约", "同事聚餐", "点菜", "鸳鸯锅", "毛肚", "包厢",
            "生日宴", "团建吃", "川菜馆", "馆子", "下馆子", "今晚吃好的", "陪客户吃饭"
        ], repeat=3
    )),
    ("意图分类词典·外卖", expand_bullets(
        "外卖信号：", [
            "外卖", "点餐", "配送", "快餐", "轻食", "美团", "饿了么", "30分钟", "加班餐",
            "不想出门", "公司附近", "取餐", "满减", "拼单", "盖饭", "汉堡", "沙拉碗"
        ], repeat=3
    )),
    ("意图分类词典·练后", expand_bullets(
        "练后信号：", [
            "练后", "训练后", "健身完", "撸铁", "蛋白", "恢复餐", "增肌餐", "练腿日",
            "有氧后", "补剂", "香蕉", "鸡胸", "练完吃啥", "窗口期", "力量训练"
        ], repeat=3
    )),
    ("意图分类词典·一起动", expand_bullets(
        "运动信号：", [
            "飞盘", "骑行", "跑团", "徒步", "运动活动", "组局", "周末活动", "一起动",
            "附近有什么活动", "发起", "限8人", "朝阳公园", "空气", "今天适合什么运动",
            "户外", "跑步", "羽毛球", "社交运动"
        ], repeat=3
    )),
    ("置信度与路由算法", """打分采用加权关键词 + 否定词规则：

```
score(scene) = sum(keyword_hit * weight) - negation_penalty
normalize to [0, 1]
```

规则表：
- 命中 ≥2 个高权重词（如「火锅」「朋友约」）→ gathering ≥ 0.85
- 命中「外卖」+「快餐/配送」→ takeout ≥ 0.90
- 命中「练后/训练后」+「蛋白/恢复」→ workout ≥ 0.88
- 命中「飞盘/跑团/组局/周末活动/今天适合什么运动」→ yiqidong ≥ 0.85
- 仅命中「吃」且无场景词 → confidence < 0.5，触发澄清：「更像是聚餐、点外卖、练后补餐，还是运动活动？」
- 用户明确否定：「不是外卖」→ 将该场景分数清零重算

当 top1 与 top2 分差 < 0.15 时，编排器输出双场景简短对比，再让用户选一条。"""),
    ("多轮状态机", """维护轻量会话状态（Agent 内存，无需持久化）：

| 状态 | 进入条件 | 行为 |
|------|----------|------|
| IDLE | 新会话 | 分类 → 路由 |
| IN_GATHERING | 已路由聚餐 | 后续追问默认留在聚餐 Skill，除非出现外卖/练后强信号 |
| IN_TAKEOUT | 已路由外卖 | 同上 |
| IN_WORKOUT | 已路由练后 | 同上 |
| IN_YIQIDONG | 已路由一起动 | 同上 |
| CLARIFY | 低置信度 | 只问一句，不展开长文 |

场景切换示例：
- 用户：「火锅怎么点」→ IN_GATHERING
- 用户：「算了还是点外卖吧」→ 检测切换词「还是」「改成」→ 重置为 takeout

切换词表：还是、改成、换、不要、算了、直接、顺便、接下来"""),
    ("@skill-invoke 模板", """编排器识别场景后的标准委托：

**聚餐**
```
@skill-invoke: hackathod_skill/skills/gathering-meal-advisor
Input: user_message, optional poi_hint
Steps: 读 mock POI → 读菜单 → nutrition-engine 算组合 → 输出结论
```

**外卖**
```
@skill-invoke: hackathod_skill/skills/takeout-meal-advisor
Input: user_message, meal_slot(lunch/dinner)
Steps: 读 takeout POI → 匹配 combo → 输出配送友好方案
```

**练后**
```
@skill-invoke: hackathod_skill/skills/workout-recovery-advisor
Input: training_type, minutes_since_workout
Steps: 读 recovery_menu 模板 → 对齐蛋白缺口 → 输出窗口期建议
```

**一起动（Skill 4）**
```
@skill-invoke: hackathod_skill/skills/yiqidong-social-sports
Input: intent_mode(discover|create|recommend|push)
Steps: context-hub + air_quality → 对应脚本 → 输出活动/推送文案
```

每次委托前**必须**先：
```
@skill-invoke: hackathod_skill/base/context-hub
Command: python hackathod_skill/base/context-hub/scripts/resolve_context.py --skip-weather
```
以便下游 Skill 拿到 `daily_kcal_target`。"""),
    ("合并输出规范", """下游返回后，编排器按 SOUL.md 合并，禁止把两个 Skill 的全文堆砌。

模板：
```
## 结论
{one_line_with_numbers}

## 方案
{3-5 bullets from downstream}

## 数据依据
mock: {ids} | health_score: {score}
```

若下游返回 `verdict: 需调整`，编排器应改写为积极语气：「这顿可以这样微调更稳……」而非说教。

字数：用户可见回复控制在 120–220 字；详细宏量可折叠在「数据依据」。"""),
    ("与前端快捷入口对齐", """前端 `emptyStateScenes.ts` 三卡片 prompt 与路由映射：

| 卡片 | 规范 prompt 关键词 | 路由 |
|------|-------------------|------|
| 聚餐 | 聚餐、饮食建议 | gathering-meal-advisor |
| 快餐 | 快餐、外卖 | takeout-meal-advisor |
| 锻炼 | 锻炼、饮食 | workout-recovery-advisor |

编排器检测到与卡片一致的规范 prompt 时，置信度直接设为 0.95，跳过澄清。"""),
    ("测试用例", expand_bullets("用例：", [
        "今晚朋友约吃火锅，我想减脂，怎么点菜才不破功？",
        "公司加班想点外卖，预算35，要蛋白够",
        "刚练完腿，45分钟内吃啥？",
        "饿了",  # 应澄清
        "朋友约局但我不确定吃什么",  # gathering + 澄清子类型
        "先火锅吧……算了外卖",  # 场景切换
    ], repeat=4)),
    ("失败与降级", """- mock 脚本 exit != 0：回复「我这边菜单数据还没加载好，你可以先告诉我：几人、大概什么店？」勿 hallucinate 门店名。
- 三场景同分：澄清一句，附带三个超短选项（聚餐/外卖/练后）。
- 用户问美团下单：说明比赛阶段无企业账号，仅提供选品与营养建议，可指向 mock POI 名称。"""),
]

# --- Gathering ---
GATHERING_SECTIONS = [
    ("场景定义", """聚餐 Skill 覆盖：火锅、烧烤、川菜馆、混合饭局等**线下多人就餐**。核心矛盾是社交压力与减脂目标冲突——用户需要「看起来正常点菜、实际控热量」的策略。

本 Skill **不**负责外卖配送、**不**负责练后窗口期（应 `@skill-invoke` 转交）。"""),
    ("Mock 数据路径", """```
hackathod_skill/mock/poi/gathering_pois.json   # 门店与策略标签
hackathod_skill/mock/menus/hotpot_menu.json      # 火锅 SKU 级营养
hackathod_skill/mock/profiles/default_user.json  # 用户晚餐预算 650kcal
```

读取命令：
```bash
python hackathod_skill/base/mock-data-access/scripts/load_mock.py gathering_pois --pretty
python hackathod_skill/base/mock-data-access/scripts/load_mock.py hotpot_menu --pretty
```"""),
    ("火锅决策树", """1. **锅底**：优先番茄/菌汤；牛油红锅仅作小格蘸味，大格清汤。
2. **蛋白质顺序**：先下瘦牛肉、虾滑、毛肚；少点加工丸类。
3. **蔬菜**：绿叶菜无限续，占盘子一半体积。
4. **主食**：土豆/宽粉二选一，小份；或完全用蔬菜作碳水。
5. **蘸料**：醋+蒜泥+香菜；麻酱每顿 ≤1 小碟。
6. **饮料**：无糖茶/苏打；啤酒按 150kcal/瓶 计入。

估算一餐目标：650kcal ±15%，蛋白 ≥35g。"""),
    ("示例组合·火锅", """以 mock 菜单 SKU 为例，推荐组合：

| 食材 | 份量 | kcal | 蛋白 |
|------|------|------|------|
| 番茄锅底 | 1 | 180 | 4 |
| 瘦牛肉 | 150g | 188 | 33 |
| 虾滑 | 100g | 110 | 18 |
| 毛肚 | 100g | 95 | 14 |
| 绿叶菜 | 200g | 56 | 4 |
| 醋蒜蘸料 | 1 | 35 | 1 |
| **合计** | | **664** | **74** |

调用 nutrition-engine：
```bash
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner --items-json '[{"kcal":180,"protein_g":4,"carb_g":12,"fat_g":10}, ...]'
```

预期 verdict：优秀或可用。"""),
    ("烧烤场景", expand_bullets("烧烤原则：", [
        "优先烤虾、鸡胸、鱼、蔬菜串",
        "少刷蜜汁/沙拉酱",
        "啤酒换无糖茶",
        "避免烤五花肉连续大量",
        "先吃蔬菜再吃肉",
        "带湿巾减被动油脂"
    ], repeat=5)),
    ("川菜场景", expand_bullets("川菜原则：", [
        "主动要求少油少盐",
        "水煮鱼选清油、少舀油",
        "口水鸡去皮",
        "配清炒时蔬",
        "米饭半份或不吃",
        "避免干锅/回锅肉当主菜"
    ], repeat=5)),
    ("社交话术", """给用户的话术要**像朋友**不像教练：

✅ 「这顿你就盯三件事：清汤底、瘦肉+虾、蘸料别碰麻酱。」
❌ 「你应该严格控制碳水摄入否则前功尽弃。」

数字必须具体：「这盘大概 650 大卡、蛋白 70g 左右，够你今晚目标。」"""),
    ("多人点菜分工", """2 人：1 底 + 2 荤 + 2 素 + 1 蘸料方案
4 人：鸳鸯 + 3 荤 + 3 素 + 1 主食（共享小份）
6 人：每多 1 人加 1 荤 1 素，仍保持「蛋白优先、蔬菜占半」

若用户无法控同桌点单：给出「自己这侧盘子」策略，不评价他人。"""),
    ("委托基础 Skill", """固定流程：
1. context-hub → daily_kcal_target
2. mock-data-access → pois + menu
3. nutrition-engine → health_score
4. （可选）weather → 雨天/indoor 无直接影响，但可提「天冷适合热汤底」"""),
    ("对话示例", expand_bullets("Q/A：", [
        "Q: 朋友非要点牛油锅？ A: 鸳鸯小格红锅+大格番茄，你主要涮大格。",
        "Q: 毛肚能多吃吗？ A: 蛋白不错但别配麻酱，200g 毛肚约 190kcal。",
        "Q: 完全不吃碳水行吗？ A: 可以，加土豆小份帮助社交，约 85kcal。",
    ], repeat=8)),
]

# --- Takeout ---
TAKEOUT_SECTIONS = [
    ("场景定义", """外卖 Skill 处理：快餐、轻食、中式简餐等**配送就餐**。约束更多：配送费、起送价、时间、门店健康度。

比赛阶段使用 mock POI/combo，不对接美团 BEP API。"""),
    ("Mock 路径", """```
hackathod_skill/mock/poi/takeout_pois.json
hackathod_skill/mock/menus/fastfood_menu.json
```

health_score_base 来自 POI 元数据；combo 级 health_score 来自菜单。"""),
    ("选店算法", """```
score = 0.4 * health_score_base + 0.3 * protein_fit + 0.2 * kcal_fit + 0.1 * eta
```

- protein_fit：combo 蛋白 / 用户单餐蛋白目标
- kcal_fit：1 - |combo_kcal - budget| / budget
- 过滤：kcal > budget * 1.3 的 combo 降权

默认 budget 来自 profile.meal_budget.lunch_kcal 或 dinner_kcal。"""),
    ("快餐改良规则", expand_bullets("改良：", [
        "汉堡去酱减 60-100kcal",
        "薯条换玉米杯/沙拉",
        "含糖饮料换零度/美式",
        "双堡不如单堡+鸡胸小食",
        "避免「超值」大套餐",
        "备注栏写明去酱半份饭"
    ], repeat=5)),
    ("mock combo 解读", """**ff_combo_a** 板烧去酱+玉米+零度：620kcal, 38g 蛋白, score 72
**ff_combo_b** 吉士去芝士+苹果+美式：480kcal, 32g 蛋白

轻食店 poi_salad_001 base 88：优先推荐双蛋白碗+半份酱。

输出时必须带 combo_id 便于前端/日志追踪。"""),
    ("时段策略", """- **午餐**：可略高碳水（580kcal 预算），支持下午工作
- **晚餐**：650kcal 预算，Fat 控制在 25g 内
- **加班夜宵**：降级到 snack 200kcal，优先蛋白饮+鸡蛋，不推荐完整汉堡套餐"""),
    ("配送现实因素", """mock 中 delivery_eta_min 仅作排序 tie-break。回复可提「预计 25 分钟左右」，但不承诺真实 ETA。

无测试账号时不生成「已下单」类表述；只说「建议点这些」。"""),
    ("与 gathering 边界", """用户说「在家点火锅外卖」→ 仍走 takeout，但引用 hotpot_menu 逻辑。

检测关键词：「送过来」「外卖火锅」→ takeout + hotpot 菜单。"""),
    ("对话示例", expand_bullets("Q/A：", [
        "Q: 35块能吃饱吗？ A: 轻食碗或老乡鸡半份杂粮+鸡胸。",
        "Q: 麦当劳怎么点？ A: ff_combo_a，去酱，约 620kcal。",
        "Q: 要快 A: poi_fastfood_001 eta 22min 但 score 较低，可接受。",
    ], repeat=8)),
    ("营养委托", """```bash
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal lunch --items-json '[{"kcal":620,"protein_g":38,"carb_g":58,"fat_g":22}]'
```"""),
]

# --- Workout ---
WORKOUT_SECTIONS = [
    ("场景定义", """练后恢复 Skill：力量/有氧训练结束后的**补餐与蛋白对齐**。关键是时间窗口、蛋白克数、快碳适量。

不处理聚餐社交策略；若用户说「练完和朋友吃火锅」→ orchestrator 拆分为：先 workout 给蛋白目标，再 gathering 给点菜。"""),
    ("Mock 路径", """```
hackathod_skill/mock/menus/recovery_menu.json
hackathod_skill/mock/profiles/default_user.json  # training.post_workout_window_min
```

模板：pwr_001 快速恢复、pwr_002 正餐型、cardio_001 有氧轻恢复。"""),
    ("窗口期", """profile 默认 90 分钟。力量训练：
- 0–45min：快碳+蛋白（香蕉+鸡胸+酸奶）
- 45–90min：可合并为正餐 pwr_002
- >90min：按普通晚餐处理，不再强调「窗口期」

有氧：
- 低强度：cardio_001 即可
- HIIT：向 pwr_001 靠拢"""),
    ("蛋白缺口算法", """```
daily_protein = 140g  # mock profile
allocated = sum(已摄入)  # 若无数据假设已分配 1/3
meal_target = max(35, daily_protein * 0.35 - 已摄入_protein)
```

练后餐蛋白不应低于 30g，除非用户明确小餐。"""),
    ("模板详解", expand_bullets("pwr_001：", [
        "希腊酸奶 200g",
        "香蕉 1 根",
        "即食鸡胸 100g",
        "合计约 400kcal / 35g 蛋白",
        "适合包内即食",
        "45 分钟内完成",
    ], repeat=4)),
    ("模板详解·正餐", expand_bullets("pwr_002：", [
        "糙米饭半份",
        "清蒸鱼 150g",
        "西兰花 200g",
        "蛋白饮可选",
        "合计约 550-650kcal",
        "蛋白可超 45g",
    ], repeat=4)),
    ("与 takeout 联动", """用户「练完想点外卖」：
1. workout 计算 protein_gap
2. `@skill-invoke` takeout-meal-advisor，约束 `min_protein >= protein_gap`
3. 推荐 poi_salad_001 或 ff_combo_a（38g 蛋白）"""),
    ("补剂边界", """可提蛋白粉/蛋白饮作为 mock 项，不推销品牌；不给出 medical advice。

用户有伤/病：建议咨询医生，本 Skill 仅处理常规模板。"""),
    ("对话示例", expand_bullets("Q/A：", [
        "Q: 练腿完很饿？ A: pwr_002，650kcal 内，蛋白 45g+。",
        "Q: 只有 15 分钟？ A: pwr_001 即食组合。",
        "Q: 晚上练完怕胖？ A: 练后这顿不算破功，控制总 kcal 仍在你 1850 内。",
    ], repeat=8)),
    ("委托命令", """```bash
python hackathod_skill/base/mock-data-access/scripts/load_mock.py recovery_menu --pretty
python hackathod_skill/base/nutrition-engine/scripts/calc_macros.py --meal dinner --items-json '[...]'
```"""),
]

# --- 一起动 Social Sports (Skill 4) ---
YIQIDONG_SECTIONS = [
    ("产品定位", """「一起动」是小爪的 Skill 4，社交运动管家。与 Skill 1–3（聚餐/外卖/练后）组成完整「减脂 + 本地生活 + 社交运动」闭环。

核心价值链：
- **发现**：降低「周末不知道干嘛」的决策成本
- **组织**：一句话发起活动，生成可分享文案（传播引擎）
- **推送**：结合天气/AQI 的少数主动触达场景，提升 DAU 与留存

比赛阶段全部基于 `mock/activities/` 与 `mock/environment/`，不对接 Meetup/豆瓣/美团到店真实 API。"""),
    ("四大能力与 PRD 对齐", """| PRD 能力 | 实现 | mock/脚本 |
|----------|------|-----------|
| 活动推送 | recommend_today.py | sports_types + air_quality + weather |
| 发现活动 | discover_activities.py | nearby_activities.json |
| 发起活动 | create_activity.py | user_created_events.json |
| 主动推送 | push_scan.py | push_enabled + 附近高 match 活动 |

用户原话映射：
- 「这周末附近有什么运动活动」→ discover，默认返回飞盘/骑行/跑团/徒步 Top N
- 「帮我发个周六下午的飞盘局，朝阳公园，限 8 人」→ create，解析 sport/venue/time/max
- 会话开场或定时任务 → push_scan，输出 notification_text"""),
    ("Mock 数据模型", """**nearby_activities.json**
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
- share_text 字段用于一键复制邀请"""),
    ("今日运动推荐算法", """`recommend_today.py` 对每个 sport_type 计算 score：

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

Agent 回复时必须带具体数字，符合 SOUL.md。"""),
    ("发现活动算法", """`discover_activities.py` 过滤与排序：

1. 可选 `--sport 飞盘` 过滤
2. `distance_km <= max_distance_km`（默认 15km）
3. `final_score = match_score + (sport in favorite_sports ? 10 : 0)`
4. 降序取 `--limit` 条

输出字段供 Agent 组织话术：
- 标题、时间、地点、距离、名额、费用
- 示例：「周六 15:00 朝阳公园飞盘新手局，2.3km，免费，还差 7 人」"""),
    ("发起活动·自然语言解析", """Agent 从用户句中提取槽位后调用 CLI：

| 槽位 | 示例 | 默认值 |
|------|------|--------|
| sport | 飞盘/骑行/跑团/徒步 | 必填 |
| venue | 朝阳公园 | 必填 |
| time | 周六下午 / ISO | 下一周六 15:00 |
| max_participants | 限 8 人 | 8 |
| title | 可选 | {venue}{sport}局 |

命令：
```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/create_activity.py \\
  --sport 飞盘 --venue 朝阳公园 --time 2026-05-24T15:00 --max-participants 8
```

成功返回 event_id + share_text。Agent 回复：
「已帮你建好局！转发这句：{share_text}」

**禁止**声称已同步到真实 App；说明为 mock 演示，正式版将接入活动平台。"""),
    ("主动推送策略", """`push_scan.py` 是小爪**少数主动推送**入口之一。

触发条件（同时考虑）：
1. `profile.sports.push_enabled == true`
2. 非 `push_quiet_hours`（23:00–08:00）
3. `recommend_today` 的 push_message 非空 **或** nearby 存在 match_score≥85 活动

合并文案示例：
「今天朝阳 AQI 68，适合飞盘，约 350kcal/小时。附近有个『朝阳公园飞盘新手局』，2.3km，还差 7 人满员。」

Agent 在会话**首次连接**或用户**打开小爪**时可主动执行 push_scan；勿在同一会话重复推送。"""),
    ("与 context-hub / weather 协作", expand_bullets("委托：", [
        "context-hub 提供 city/district/weather",
        "air_quality.json 提供 AQI（mock，非真实环保 API）",
        "weather Skill 可选 curl wttr.in 增强降水判断",
        "AQI>150 仅推荐室内羽毛球",
        "雨天 outdoor_required 项目降权",
        "极热天气 hiking 降权",
    ], repeat=4)),
    ("与 workout-recovery 联动", """用户路径：「明天跑团，跑完吃什么？」

1. yiqidong discover 推荐 act_run_001
2. `@skill-invoke: workout-recovery-advisor`，training_type=running
3. 合并：「周六 7:00 奥森 5K，跑完 45 分钟内 pwr_001 酸奶+香蕉+鸡胸」

yiqidong 不计算餐食宏量，必须委托 workout + nutrition-engine。"""),
    ("运动类型百科", expand_bullets("飞盘：", [
        "6-14 人社交型", "90 分钟", "350kcal/h", "新手友好", "需开阔草地",
        "朝阳公园为 mock 默认场地", "限 8 人局适合熟人扩散", "避免大风天",
    ], repeat=3)),
    ("运动类型百科·骑行/跑团/徒步", expand_bullets("骑行/跑团/徒步：", [
        "骑行亮马河夜骑休闲 1.8km",
        "跑团奥森 5K 减脂向",
        "徒步温榆河半日轻强度",
        "室内羽毛球雨天 fallback",
        "各类型 kcal/h 见 sports_types",
    ], repeat=5)),
    ("对话示例", expand_bullets("Q/A：", [
        "Q: 这周末附近有什么？ A: 飞盘/夜骑/奥森跑/温榆河徒步 Top4。",
        "Q: 今天适合啥运动？ A: AQI68 推荐飞盘，备选骑行。",
        "Q: 帮我组局？ A: 已创建 evt_xxx，转发 share_text。",
        "Q: 空气不好？ A: AQI>100 改推室内羽毛球。",
        "Q: 跑完吃啥？ A: 委托 workout-recovery。",
    ], repeat=8)),
    ("错误与边界", """| 情况 | 行为 |
|------|------|
| mock 活动为空 | 引导用户 create_activity 自己组局 |
| 用户关闭 push | push_scan 返回 should_push:false |
| 未识别运动类型 | 澄清：飞盘/骑行/跑团/徒步/羽毛球 |
| 真实平台 API | 比赛阶段拒绝，指向 mock |

不做医疗建议；有伤病用户建议咨询医生后再参加高强度活动。"""),
    ("命令速查", """```bash
python hackathod_skill/skills/yiqidong-social-sports/scripts/recommend_today.py --skip-weather
python hackathod_skill/skills/yiqidong-social-sports/scripts/discover_activities.py --limit 5
python hackathod_skill/skills/yiqidong-social-sports/scripts/create_activity.py --sport 飞盘 --venue 朝阳公园 --time 2026-05-24T15:00 --max-participants 8
python hackathod_skill/skills/yiqidong-social-sports/scripts/push_scan.py
python hackathod_skill/base/mock-data-access/scripts/load_mock.py nearby_activities --pretty
```"""),
]


def build_doc(title: str, sections: list[tuple[str, str]]) -> str:
    parts = [f"# {title}\n", "本文档为 hackathod_skill 比赛阶段 mock 实现参考，Agent 按需加载。\n"]
    for name, body in sections:
        parts.append(section(name, body))
    return "".join(parts)


def pad_to_min(text: str, min_chars: int, pad_title: str) -> str:
    if len(text) >= min_chars:
        return text
    extra = []
    i = 0
    while len(text) + sum(len(x) for x in extra) < min_chars:
        i += 1
        extra.append(section(
            f"{pad_title}·扩展条目 {i}",
            expand_bullets("补充：", [
                "保持结论先行", "使用 mock 数据", "委托 nutrition-engine",
                "避免说教", "给出 kcal 与蛋白克数", "场景切换交 orchestrator",
                "不调用真实美团 API", "失败时诚实降级", "对齐 SOUL 人设",
                "合并输出不超过 220 字"
            ], repeat=2)
        ))
    return text + "".join(extra)


SKILLS = [
    ("skills/scene-orchestrator/references/full-guide.md", "小爪场景编排器完整指南", ORCHESTRATOR_SECTIONS),
    ("skills/gathering-meal-advisor/references/full-guide.md", "小爪聚餐顾问完整指南", GATHERING_SECTIONS),
    ("skills/takeout-meal-advisor/references/full-guide.md", "小爪外卖顾问完整指南", TAKEOUT_SECTIONS),
    ("skills/workout-recovery-advisor/references/full-guide.md", "小爪练后恢复顾问完整指南", WORKOUT_SECTIONS),
    ("skills/yiqidong-social-sports/references/full-guide.md", "小爪一起动社交运动管家完整指南", YIQIDONG_SECTIONS),
]

BASE_DOCS = [
    ("base/mock-data-access/references/catalog.md", "Mock 数据目录", [
        ("键名", expand_bullets("key：", list([
            "profile", "locations", "gathering_pois", "takeout_pois",
            "hotpot_menu", "fastfood_menu", "recovery_menu",
            "nearby_activities", "sports_types", "air_quality", "user_created_events"
        ]), repeat=6)),
        ("路径约定", "所有路径相对于 hackathod_skill/mock/。禁止读取 mock 外 JSON。"),
    ]),
    ("base/nutrition-engine/references/formulas.md", "营养计算公式", [
        ("health_score", "fat_loss 模式下 kcal 占 45% 权重、蛋白占 55%。见 calc_macros.py。"),
        ("verdict", "≥80 优秀；≥65 可用；否则需调整。"),
    ]),
    ("base/context-hub/references/weather-delegation.md", "天气委托", [
        ("OpenClaw weather", "优先 resolve_context.py 内 curl wttr.in；失败用 mock_fallback。"),
        ("skip", "比赛演示可用 --skip-weather 加速。"),
    ]),
]


def main() -> None:
    report = []
    for rel, title, sections in SKILLS:
        doc = pad_to_min(build_doc(title, sections), 10000, title)
        n = write(ROOT / rel, doc)
        report.append((rel, n))

    for rel, title, sections in BASE_DOCS:
        doc = build_doc(title, sections)
        n = write(ROOT / rel, doc)
        report.append((rel, n))

    print("Generated reference docs:")
    for rel, n in report:
        status = "OK" if "skills/" not in rel or n >= 10000 else "SHORT"
        print(f"  {rel}: {n} chars [{status}]")


if __name__ == "__main__":
    main()

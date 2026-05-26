# Trace2Skill — 小爪技能进化

离线三阶段 pipeline（对齐 Qwen Trace2Skill）：

1. **Trajectory** — `logs/trajectories.jsonl`（前端导出或 sample）
2. **Parallel Analyst** — success / error patch 提案 → `patches/`
3. **Consolidation** — 分层合并 → `output/consolidated_patch.json` + `prompt_patch.json`
4. **Apply** — 追加 `evolved-lessons.md`，同步 `frontend/public/evolved/prompt_patch.json`

## 运行

```bash
cd Agent/trace2skill
python run_pipeline.py
```

使用 sample 轨迹：

```bash
python analysis/run_success_analysis.py --input logs/trajectories.sample.jsonl
python analysis/run_error_analysis.py --input logs/trajectories.sample.jsonl
python consolidate/merge_patches.py
python consolidate/apply_patches.py
```

## 前端导出轨迹

浏览器 localStorage 可在开发者控制台：

```js
JSON.parse(localStorage.getItem('xiaozhua.trajectories-v1'))
```

或使用应用内 `downloadTrajectoriesExport()`。

将 JSON 数组转为 JSONL 写入 `logs/trajectories.jsonl` 后跑 pipeline。

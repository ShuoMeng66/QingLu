# Evolved lessons (Trace2Skill)

本文件由 `Agent/trace2skill` 离线 pipeline 追加补丁，用于沉淀对话轨迹中的成功/失败经验。

- 路由与四模块 Skill 以根目录 `SKILL.md`（burnpal-router）及 `skills/skill*-*/` 为准。
- 勿在此写入与上游 [burnpal.skill](https://github.com/CCLYX/burnpal.skill) 冲突的永久规则；可合并的改进应同步回上游仓库后再 vendor。

<!-- trace2skill patches append below this line -->


## Trace2Skill 进化记录 (2026-06-01 10:21 UTC)

merged 2 patches, withheld 0

## 失败模式
- 评分偏低：回答可能过短或缺少可执行细节
- 用户点踩：需先给结论、举例更具体、避免空泛鼓励
- 缺少具体数字：补充 kcal、蛋白质克数或组数/次数

- 成功模式：回答含具体数字（kcal/克/次），用户更易采纳

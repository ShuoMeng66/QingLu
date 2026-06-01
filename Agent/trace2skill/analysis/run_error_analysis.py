"""Rule-based error analyst (MVP)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from trace2skill_common import LOGS, PATCHES, ensure_dirs, is_failure, load_trajectories, slugify


def propose_error_patch(traj: dict) -> dict | None:
    reply = (traj.get("execution") or {}).get("assistantReply") or ""
    score = (traj.get("outcome") or {}).get("score") or {}
    feedback = (traj.get("outcome") or {}).get("feedback")
    tags = (traj.get("labels") or {}).get("errorTags") or []

    if not reply.strip() and feedback != "down":
        return {"reject": True, "source_trajectory": traj.get("id")}

    issues: list[str] = []
    if score.get("total", 100) < 75:
        issues.append("评分偏低：回答可能过短或缺少可执行细节")
    if feedback == "down":
        issues.append("用户点踩：需先给结论、举例更具体、避免空泛鼓励")
    if "low_score" in tags and not any(c.isdigit() for c in reply):
        issues.append("缺少具体数字：补充 kcal、蛋白质克数或组数/次数")

    if not issues:
        return {"reject": True, "source_trajectory": traj.get("id")}

    return {
        "patch_id": f"p_error_{slugify(traj.get('id', 'x'))}",
        "source_trajectory": traj.get("id"),
        "target": "burnpal_skill/references/evolved-lessons.md",
        "type": "append_section",
        "rationale": issues[0],
        "generalizability": "high",
        "reject": False,
        "content": "## 失败模式\n" + "\n".join(f"- {i}" for i in issues),
        "prompt_patch": {
            "clusterConstraints": ["先给结论和具体数字，再展开细节"],
            "preferenceHints": issues[:2],
            "starterStyle": "conclusion_first",
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Trace2Skill error analyst")
    parser.add_argument("--input", type=Path, default=None)
    args = parser.parse_args()
    ensure_dirs()
    trajectories = load_trajectories(args.input)
    if args.input is None and not trajectories:
        trajectories = load_trajectories(LOGS / "trajectories.sample.jsonl")
    count = 0
    for traj in trajectories:
        if not is_failure(traj):
            continue
        patch = propose_error_patch(traj)
        if not patch or patch.get("reject"):
            continue
        count += 1
        out = PATCHES / f"{patch['patch_id']}.json"
        out.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"error patches: {count}")


if __name__ == "__main__":
    main()

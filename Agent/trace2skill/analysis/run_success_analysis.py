"""Rule-based success analyst (MVP — no LLM required)."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from trace2skill_common import LOGS, PATCHES, ensure_dirs, is_success, load_trajectories, slugify


def propose_success_patch(traj: dict) -> dict | None:
    reply = (traj.get("execution") or {}).get("assistantReply") or ""
    if not reply.strip():
        return None

    hints: list[str] = []
    if re_has_numbers(reply):
        hints.append("成功模式：回答含具体数字（kcal/克/次），用户更易采纳")
    if "步骤" in reply or "首先" in reply:
        hints.append("成功模式：分步骤组织，结构清晰")

    if not hints:
        hints.append("成功模式：紧扣用户 focus 给出可执行建议")

    return {
        "patch_id": f"p_success_{slugify(traj.get('id', 'x'))}",
        "source_trajectory": traj.get("id"),
        "target": "hackathod_skill/skills/scene-orchestrator/references/evolved-lessons.md",
        "type": "append_section",
        "rationale": hints[0],
        "generalizability": "high" if re_has_numbers(reply) else "medium",
        "content": "\n".join(f"- {h}" for h in hints),
        "prompt_patch": {
            "preferenceHints": hints[:1],
            "starterStyle": "detailed_steps" if re_has_numbers(reply) else "balanced",
        },
    }


def re_has_numbers(text: str) -> bool:
    import re

    return bool(re.search(r"\d", text))


def main() -> None:
    parser = argparse.ArgumentParser(description="Trace2Skill success analyst")
    parser.add_argument("--input", type=Path, default=None)
    args = parser.parse_args()
    ensure_dirs()
    trajectories = load_trajectories(args.input)
    if args.input is None and not trajectories:
        trajectories = load_trajectories(LOGS / "trajectories.sample.jsonl")
    patches = []
    for traj in trajectories:
        if not is_success(traj):
            continue
        patch = propose_success_patch(traj)
        if patch:
            patches.append(patch)
            out = PATCHES / f"{patch['patch_id']}.json"
            out.write_text(json.dumps(patch, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"success patches: {len(patches)}")


if __name__ == "__main__":
    main()

"""Hierarchical merge of patch pool (MVP single-level batch merge)."""
from __future__ import annotations

import json
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from analysis.parse_patches import load_patches
from consolidate.conflict_check import detect_line_conflicts, filter_by_prevalence
from trace2skill_common import OUTPUT, ensure_dirs


def merge_patches(batch_size: int = 32) -> dict:
    patches = filter_by_prevalence(load_patches())
    withheld = detect_line_conflicts(patches)
    active = [p for p in patches if p.get("patch_id") not in withheld]

    sections: list[str] = []
    constraints: list[str] = []
    hints: list[str] = []
    starter_style = "balanced"

    for patch in active[:batch_size]:
        content = (patch.get("content") or "").strip()
        if content:
            sections.append(content)
        pp = patch.get("prompt_patch") or {}
        for c in pp.get("clusterConstraints") or []:
            if c not in constraints:
                constraints.append(c)
        for h in pp.get("preferenceHints") or []:
            if h not in hints:
                hints.append(h)
        if pp.get("starterStyle") == "conclusion_first":
            starter_style = "conclusion_first"
        elif pp.get("starterStyle") == "detailed_steps" and starter_style != "conclusion_first":
            starter_style = "detailed_steps"

    consolidated = {
        "consolidated_id": "p_star",
        "targets": [
            "burnpal_skill/references/evolved-lessons.md"
        ],
        "prevalence_notes": f"merged {len(active)} patches, withheld {len(withheld)}",
        "content": "\n\n".join(sections) if sections else "- （暂无轨迹 patch，使用默认指南）",
        "prompt_patch": {
            "clusterConstraints": constraints
            or ["分步骤、给出可执行数字或具体动作", "语气友好简洁", "紧扣饮食/运动/恢复"],
            "preferenceHints": hints,
            "starterStyle": starter_style,
            "isgTone": "具体数字、低门槛、可点击即问",
        },
        "discarded_patch_ids": list(withheld),
    }
    return consolidated


def main() -> None:
    ensure_dirs()
    merged = merge_patches()
    out = OUTPUT / "consolidated_patch.json"
    out.write_text(json.dumps(merged, ensure_ascii=False, indent=2), encoding="utf-8")
    prompt_out = OUTPUT / "prompt_patch.json"
    prompt_out.write_text(
        json.dumps(merged["prompt_patch"], ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"wrote {out} and {prompt_out}")


if __name__ == "__main__":
    main()

"""Apply consolidated patch to skill directory."""
from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from trace2skill_common import OUTPUT, SKILL_ROOT, ensure_dirs


def apply_consolidated() -> None:
    ensure_dirs()
    consolidated_path = OUTPUT / "consolidated_patch.json"
    if not consolidated_path.exists():
        print("no consolidated_patch.json — run merge_patches first")
        return

    data = json.loads(consolidated_path.read_text(encoding="utf-8"))
    content = data.get("content") or ""
    rel = "skills/scene-orchestrator/references/evolved-lessons.md"
    target = SKILL_ROOT / rel
    target.parent.mkdir(parents=True, exist_ok=True)

    stamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    block = f"\n\n## Trace2Skill 进化记录 ({stamp})\n\n{data.get('prevalence_notes', '')}\n\n{content}\n"

    if target.exists():
        existing = target.read_text(encoding="utf-8")
        if content.strip() in existing:
            print("content already applied — skip")
        else:
            target.write_text(existing + block, encoding="utf-8")
    else:
        header = "# 小爪 Trace2Skill 进化笔记\n\n> 由轨迹并行分析 + 分层合并自动生成。人工可审阅后删改。\n"
        target.write_text(header + block, encoding="utf-8")

    # sync prompt patch to frontend public (repo root / frontend)
    prompt_src = OUTPUT / "prompt_patch.json"
    if prompt_src.exists():
        repo_root = SKILL_ROOT.parent.parent
        fe = repo_root / "frontend" / "public" / "evolved" / "prompt_patch.json"
        fe.parent.mkdir(parents=True, exist_ok=True)
        fe.write_text(prompt_src.read_text(encoding="utf-8"), encoding="utf-8")
        print(f"synced prompt patch -> {fe}")

    print(f"applied skill patch -> {target}")


def main() -> None:
    apply_consolidated()


if __name__ == "__main__":
    main()

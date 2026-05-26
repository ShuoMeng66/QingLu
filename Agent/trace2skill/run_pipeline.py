#!/usr/bin/env python3
"""Trace2Skill end-to-end pipeline for 小爪."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

from trace2skill_common import LOGS, ensure_dirs


def run(script: str) -> None:
    path = ROOT / script
    print(f"\n==> {script}")
    subprocess.check_call([sys.executable, str(path)], cwd=str(ROOT))


def main() -> None:
    ensure_dirs()
    input_path = LOGS / "trajectories.jsonl"
    if not input_path.exists() and (LOGS / "trajectories.sample.jsonl").exists():
        input_path = LOGS / "trajectories.sample.jsonl"
    extra = ["--input", str(input_path)] if input_path.exists() else []
    for script in (
        "analysis/run_success_analysis.py",
        "analysis/run_error_analysis.py",
    ):
        path = ROOT / script
        print(f"\n==> {script}")
        subprocess.check_call([sys.executable, str(path), *extra], cwd=str(ROOT))
    run("consolidate/merge_patches.py")
    run("consolidate/apply_patches.py")
    print("\nTrace2Skill pipeline complete.")


if __name__ == "__main__":
    main()

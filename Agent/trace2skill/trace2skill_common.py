"""Trace2Skill shared utilities."""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
LOGS = ROOT / "logs"
PATCHES = ROOT / "patches"
OUTPUT = ROOT / "output"
SKILL_ROOT = ROOT.parent / "hackathod_skill"


def load_trajectories(path: Path | None = None) -> list[dict[str, Any]]:
    path = path or LOGS / "trajectories.jsonl"
    if not path.exists():
        sample = LOGS / "trajectories.sample.jsonl"
        path = sample if sample.exists() else path
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def is_success(traj: dict[str, Any]) -> bool:
    labels = traj.get("labels") or {}
    if labels.get("success"):
        return True
    score = (traj.get("outcome") or {}).get("score") or {}
    total = score.get("total")
    if total is not None and total >= 75:
        return True
    feedback = (traj.get("outcome") or {}).get("feedback")
    return feedback == "up"


def is_failure(traj: dict[str, Any]) -> bool:
    labels = traj.get("labels") or {}
    if labels.get("success") is False:
        return True
    score = (traj.get("outcome") or {}).get("score") or {}
    total = score.get("total")
    if total is not None and total < 75:
        return True
    feedback = (traj.get("outcome") or {}).get("feedback")
    return feedback == "down"


def slugify(text: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_]+", "_", text)[:48]


def ensure_dirs() -> None:
    LOGS.mkdir(parents=True, exist_ok=True)
    PATCHES.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)

"""Shared utilities for hackathod_skill mock pipeline."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MOCK_DIR = ROOT / "mock"


def mock_path(*parts: str) -> Path:
    return MOCK_DIR.joinpath(*parts)


def load_json(*parts: str) -> Any:
    path = mock_path(*parts)
    if not path.exists():
        raise FileNotFoundError(f"Mock file not found: {path}")
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(data: Any, *parts: str) -> Path:
    path = mock_path(*parts)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return path


def skill_root() -> Path:
    return ROOT

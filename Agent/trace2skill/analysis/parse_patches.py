"""Parse patch JSON files from analysis stage."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from trace2skill_common import PATCHES


def load_patches() -> list[dict]:
    if not PATCHES.exists():
        return []
    patches: list[dict] = []
    for path in sorted(PATCHES.glob("*.json")):
        data = json.loads(path.read_text(encoding="utf-8"))
        if data.get("reject"):
            continue
        patches.append(data)
    return patches


def main() -> None:
    patches = load_patches()
    print(f"loaded {len(patches)} patches")


if __name__ == "__main__":
    main()

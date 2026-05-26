"""Programmatic conflict detection for skill patches."""
from __future__ import annotations

from collections import defaultdict


def detect_line_conflicts(patches: list[dict]) -> set[str]:
    """Withhold patches targeting same target+content hash bucket (simplified)."""
    buckets: dict[str, list[str]] = defaultdict(list)
    withheld: set[str] = set()

    for patch in patches:
        pid = patch.get("patch_id", "")
        target = patch.get("target", "")
        content = (patch.get("content") or "").strip()
        key = f"{target}::{hash(content) % 10_000}"
        buckets[key].append(pid)

    for ids in buckets.values():
        if len(ids) > 1:
            # keep first, withhold rest as duplicate
            for dup in ids[1:]:
                withheld.add(dup)
    return withheld


def filter_by_prevalence(patches: list[dict], min_high: int = 1) -> list[dict]:
    """Keep high generalizability; medium only if rationale repeats."""
    rationale_count: dict[str, int] = {}
    for p in patches:
        r = p.get("rationale", "")
        rationale_count[r] = rationale_count.get(r, 0) + 1

    kept: list[dict] = []
    for p in patches:
        gen = p.get("generalizability", "medium")
        r = p.get("rationale", "")
        if gen == "high" or rationale_count.get(r, 0) >= 2:
            kept.append(p)
    return kept

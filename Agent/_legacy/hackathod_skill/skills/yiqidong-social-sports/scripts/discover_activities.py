#!/usr/bin/env python3
"""Discover nearby weekend sports activities from mock catalog."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Discover nearby activities")
    parser.add_argument("--city", default="北京")
    parser.add_argument("--district", default="朝阳区")
    parser.add_argument("--sport", default=None, help="Filter: 飞盘/骑行/跑团/徒步")
    parser.add_argument("--limit", type=int, default=5)
    parser.add_argument("--max-distance-km", type=float, default=15.0)
    args = parser.parse_args()

    data = load_json("activities/nearby_activities.json")
    profile = load_json("profiles/default_user.json")
    favorites = set(profile.get("sports", {}).get("favorite_sports", []))

    acts = []
    for a in data["activities"]:
        if args.sport and args.sport not in a.get("sport", "") and args.sport not in a.get("tags", []):
            continue
        if a.get("distance_km", 99) > args.max_distance_km:
            continue
        score = a.get("match_score", 70)
        if a.get("sport") in favorites:
            score += 10
        acts.append({**a, "final_score": score})

    acts.sort(key=lambda x: x["final_score"], reverse=True)
    result = {
        "mode": "discover",
        "weekend": data.get("weekend_label"),
        "city": args.city,
        "district": args.district,
        "count": len(acts[: args.limit]),
        "activities": acts[: args.limit],
    }
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Load mock JSON data for hackathod skills."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json, mock_path  # noqa: E402

ALIASES = {
    "default_user.json": "profile",
    "profiles/default_user.json": "profile",
    "mock/profiles/default_user.json": "profile",
    "yiqidong_push_settings": "yiqidong_push_settings",
}


CATALOG = {
    "profile": "profiles/default_user.json",
    "locations": "locations.json",
    "gathering_pois": "poi/gathering_pois.json",
    "takeout_pois": "poi/takeout_pois.json",
    "hotpot_menu": "menus/hotpot_menu.json",
    "fastfood_menu": "menus/fastfood_menu.json",
    "recovery_menu": "menus/recovery_menu.json",
    "nearby_activities": "activities/nearby_activities.json",
    "sports_types": "activities/sports_types.json",
    "air_quality": "environment/air_quality.json",
    "user_created_events": "activities/user_created_events.json",
    "yiqidong_push_settings": "profiles/yiqidong_push_settings.json",
}


def resolve_key(raw: str) -> str:
    key = ALIASES.get(raw, raw)
    if key in CATALOG or key == "list":
        return key
    hint = f"Unknown mock key '{raw}'. Use one of: {', '.join(CATALOG.keys())}. Run with 'list' to inspect."
    print(json.dumps({"error": hint, "valid_keys": list(CATALOG.keys())}, ensure_ascii=False, indent=2), file=sys.stderr)
    raise SystemExit(2)


def main() -> int:
    parser = argparse.ArgumentParser(description="Load hackathod mock data")
    parser.add_argument("key", help="Mock dataset key (run 'list' to inspect)")
    parser.add_argument("--pretty", action="store_true", help="Pretty print JSON")
    args = parser.parse_args()
    key = resolve_key(args.key)

    if key == "list":
        print(json.dumps({"keys": list(CATALOG.keys()), "mock_dir": str(mock_path())}, ensure_ascii=False, indent=2))
        return 0

    data = load_json(CATALOG[key])
    if args.pretty:
        print(json.dumps(data, ensure_ascii=False, indent=2))
    else:
        print(json.dumps(data, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

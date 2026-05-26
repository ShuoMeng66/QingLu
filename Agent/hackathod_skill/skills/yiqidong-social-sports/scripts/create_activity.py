#!/usr/bin/env python3
"""Create a sports activity event (mock persistence)."""
from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json, save_json  # noqa: E402

SPORT_MAP = {
    "飞盘": "frisbee",
    "骑行": "cycling",
    "跑团": "running_group",
    "跑步": "running_group",
    "徒步": "hiking",
    "羽毛球": "badminton_indoor",
}


def main() -> int:
    parser = argparse.ArgumentParser(description="Create sports activity (mock)")
    parser.add_argument("--sport", required=True, help="飞盘/骑行/跑团/徒步/羽毛球")
    parser.add_argument("--venue", required=True, help="例如：朝阳公园")
    parser.add_argument("--time", required=True, help="ISO 或描述：2026-05-24T15:00 或 周六下午")
    parser.add_argument("--max-participants", type=int, default=8)
    parser.add_argument("--title", default=None)
    parser.add_argument("--host", default="小爪用户")
    args = parser.parse_args()

    type_id = SPORT_MAP.get(args.sport, "frisbee")
    sports = {s["type_id"]: s for s in load_json("activities/sports_types.json")["sport_types"]}
    meta = sports.get(type_id, {})

    # parse simple ISO; fallback mock next Saturday 15:00
    start = datetime.now(timezone(timedelta(hours=8))).replace(hour=15, minute=0, second=0, microsecond=0)
    if "T" in args.time:
        try:
            start = datetime.fromisoformat(args.time.replace("Z", "+00:00"))
            if start.tzinfo is None:
                start = start.replace(tzinfo=timezone(timedelta(hours=8)))
        except ValueError:
            pass
    else:
        days_ahead = (5 - start.weekday()) % 7 or 7
        start = start + timedelta(days=days_ahead)

    end = start + timedelta(minutes=meta.get("duration_min", 90))
    event_id = f"evt_{uuid.uuid4().hex[:8]}"
    title = args.title or f"{args.venue}{args.sport}局"

    event = {
        "event_id": event_id,
        "type_id": type_id,
        "title": title,
        "sport": args.sport,
        "venue": args.venue,
        "start_time": start.isoformat(),
        "end_time": end.isoformat(),
        "host": args.host,
        "participants": 1,
        "max_participants": args.max_participants,
        "status": "open",
        "created_at": datetime.now(timezone(timedelta(hours=8))).isoformat(),
        "share_text": f"「{title}｜{start.strftime('%m月%d日 %H:%M')}｜{args.venue}｜限{args.max_participants}人，来一起玩！」",
    }

    store = load_json("activities/user_created_events.json")
    store.setdefault("events", []).append(event)
    save_json(store, "activities/user_created_events.json")

    print(json.dumps({"mode": "create", "success": True, "event": event}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

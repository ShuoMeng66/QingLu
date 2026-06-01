#!/usr/bin/env python3
"""Scan proactive push candidates for 一起动."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json  # noqa: E402

# import recommend_today logic
SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))
import recommend_today  # noqa: E402


def main() -> int:
    settings = load_json("profiles/yiqidong_push_settings.json")
    if not settings.get("enabled"):
        print(json.dumps({"mode": "push_scan", "should_push": False, "reason": "用户未开启一起动推送"}, ensure_ascii=False, indent=2))
        return 0

    profile = load_json("profiles/default_user.json")
    sports_cfg = profile.get("sports", {})
    if not sports_cfg.get("push_enabled", True):
        print(json.dumps({"mode": "push_scan", "should_push": False, "reason": "用户关闭推送"}, ensure_ascii=False, indent=2))
        return 0

    import io
    from contextlib import redirect_stdout

    buf = io.StringIO()
    old = sys.argv
    sys.argv = ["recommend_today.py", "--skip-weather"]
    with redirect_stdout(buf):
        recommend_today.main()
    sys.argv = old
    rec = json.loads(buf.getvalue())

    nearby = load_json("activities/nearby_activities.json")
    top_act = None
    if nearby.get("activities"):
        top_act = sorted(nearby["activities"], key=lambda x: x.get("match_score", 0), reverse=True)[0]

    should = bool(rec.get("push_message")) or top_act is not None
    payload = {
        "mode": "push_scan",
        "should_push": should,
        "daily_tip": rec.get("push_message"),
        "nearby_highlight": None,
        "notification_text": None,
    }
    if should:
        parts = []
        if rec.get("push_message"):
            parts.append(rec["push_message"])
        if top_act:
            payload["nearby_highlight"] = {
                "activity_id": top_act["activity_id"],
                "title": top_act["title"],
                "start_time": top_act["start_time"],
                "distance_km": top_act["distance_km"],
            }
            parts.append(
                f"附近有个「{top_act['title']}」，{top_act['distance_km']}km，"
                f"还差{top_act['max_participants'] - top_act['participants']}人满员。"
            )
        payload["notification_text"] = " ".join(parts)

    print(json.dumps(payload, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

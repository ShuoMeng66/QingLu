#!/usr/bin/env python3
"""Manage 一起动 user push preferences (enable, schedule, one-shot, casual)."""
from __future__ import annotations

import argparse
import json
import sys
import uuid
from copy import deepcopy
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json, save_json  # noqa: E402

SETTINGS_PATH = "profiles/yiqidong_push_settings.json"
TZ = timezone(timedelta(hours=8))


def now_iso() -> str:
    return datetime.now(TZ).isoformat()


def load_settings() -> dict:
    return load_json(SETTINGS_PATH)


def save_settings(data: dict) -> None:
    save_json(data, SETTINGS_PATH)


def append_history(data: dict, action: str, detail: dict) -> None:
    data.setdefault("history", [])
    data["history"].append({"at": now_iso(), "action": action, **detail})
    data["history"] = data["history"][-50:]


def cmd_get(_: argparse.Namespace) -> int:
    print(json.dumps(load_settings(), ensure_ascii=False, indent=2))
    return 0


def cmd_disable(_: argparse.Namespace) -> int:
    data = load_settings()
    data["enabled"] = False
    data["mode"] = "off"
    data["scheduled"]["active"] = False
    data["casual"]["active"] = False
    append_history(data, "disable", {})
    save_settings(data)
    print(json.dumps({"ok": True, "message": "一起动推送已关闭", "settings": data}, ensure_ascii=False, indent=2))
    return 0


def cmd_enable(args: argparse.Namespace) -> int:
    data = load_settings()
    mode = args.mode
    data["enabled"] = True
    data["mode"] = mode
    data["scheduled"]["active"] = mode == "scheduled"
    data["casual"]["active"] = mode == "casual"
    if mode == "scheduled" and args.times:
        data["scheduled"]["times"] = [t.strip() for t in args.times.split(",")]
    if args.days:
        data["scheduled"]["days"] = [d.strip().lower() for d in args.days.split(",")]
    if args.label:
        if mode == "scheduled":
            data["scheduled"]["label"] = args.label
        elif mode == "casual":
            data["casual"]["label"] = args.label
    append_history(data, "enable", {"mode": mode})
    save_settings(data)
    labels = {
        "scheduled": "定时推送",
        "casual": "随心推",
        "one_shot": "一次性任务模式",
    }
    print(json.dumps({
        "ok": True,
        "message": f"已开启一起动·{labels.get(mode, mode)}",
        "settings": data,
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_set_schedule(args: argparse.Namespace) -> int:
    data = load_settings()
    data["enabled"] = True
    data["mode"] = "scheduled"
    data["scheduled"]["active"] = True
    data["casual"]["active"] = False
    if args.times:
        data["scheduled"]["times"] = [t.strip() for t in args.times.split(",")]
    if args.days:
        data["scheduled"]["days"] = [d.strip().lower() for d in args.days.split(",")]
    if args.content:
        data["scheduled"]["content"] = args.content
    if args.label:
        data["scheduled"]["label"] = args.label
    append_history(data, "set_schedule", {"times": data["scheduled"]["times"]})
    save_settings(data)
    print(json.dumps({
        "ok": True,
        "message": f"已设置定时推送：{', '.join(data['scheduled']['times'])}",
        "settings": data,
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_set_casual(args: argparse.Namespace) -> int:
    data = load_settings()
    data["enabled"] = True
    data["mode"] = "casual"
    data["casual"]["active"] = True
    data["scheduled"]["active"] = False
    if args.max_per_day is not None:
        data["casual"]["max_per_day"] = args.max_per_day
    if args.min_score is not None:
        data["casual"]["min_weather_score"] = args.min_score
    if args.cooldown_hours is not None:
        data["casual"]["cooldown_hours"] = args.cooldown_hours
    append_history(data, "set_casual", deepcopy(data["casual"]))
    save_settings(data)
    print(json.dumps({
        "ok": True,
        "message": "已开启随心推：天气合适时偶尔提醒，不会频繁打扰",
        "settings": data,
    }, ensure_ascii=False, indent=2))
    return 0


def cmd_add_task(args: argparse.Namespace) -> int:
    data = load_settings()
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    task = {
        "task_id": task_id,
        "type": args.type,
        "trigger_at": args.at,
        "intent": args.intent or "",
        "sport": args.sport,
        "venue": args.venue,
        "max_participants": args.max_participants,
        "status": "pending",
        "created_at": now_iso(),
    }
    data.setdefault("one_shot_tasks", []).append(task)
    data["enabled"] = True
    data["mode"] = "one_shot"
    data["scheduled"]["active"] = False
    data["casual"]["active"] = False
    append_history(data, "add_task", {"task_id": task_id, "type": args.type})
    save_settings(data)
    print(json.dumps({
        "ok": True,
        "message": "已记录一次性任务，到时会自动执行",
        "task": task,
        "settings": data,
    }, ensure_ascii=False, indent=2))
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Manage 一起动 push settings")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("get").set_defaults(func=cmd_get)
    sub.add_parser("disable").set_defaults(func=cmd_disable)

    p_enable = sub.add_parser("enable", help="开启推送 mode=scheduled|casual|one_shot")
    p_enable.add_argument("--mode", required=True, choices=["scheduled", "casual", "one_shot"])
    p_enable.add_argument("--times", help="09:00,18:00 for scheduled")
    p_enable.add_argument("--days", help="mon,tue,...,sun")
    p_enable.add_argument("--label")
    p_enable.set_defaults(func=cmd_enable)

    p_sched = sub.add_parser("set-schedule", help="每天固定时间提醒")
    p_sched.add_argument("--times", default="09:00")
    p_sched.add_argument("--days", default="mon,tue,wed,thu,fri,sat,sun")
    p_sched.add_argument("--content", default="daily_sport_tip")
    p_sched.add_argument("--label", default="每日运动提醒")
    p_sched.set_defaults(func=cmd_set_schedule)

    p_casual = sub.add_parser("set-casual", help="随心推")
    p_casual.add_argument("--max-per-day", type=int, default=1)
    p_casual.add_argument("--min-score", type=int, default=70)
    p_casual.add_argument("--cooldown-hours", type=int, default=24)
    p_casual.set_defaults(func=cmd_set_casual)

    p_task = sub.add_parser("add-task", help="一次性：提醒或组局")
    p_task.add_argument("--type", required=True, choices=["remind", "organize_event"])
    p_task.add_argument("--at", required=True, help="ISO time or description stored as-is")
    p_task.add_argument("--intent", default="")
    p_task.add_argument("--sport")
    p_task.add_argument("--venue")
    p_task.add_argument("--max-participants", type=int, default=8)
    p_task.set_defaults(func=cmd_add_task)

    args = parser.parse_args()
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main())

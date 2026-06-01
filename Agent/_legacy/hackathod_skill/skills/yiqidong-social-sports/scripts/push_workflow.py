#!/usr/bin/env python3
"""Evaluate 一起动 automated push workflow (scheduled / one-shot / casual)."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json, save_json  # noqa: E402

SCRIPT_DIR = Path(__file__).resolve().parent
TZ = timezone(timedelta(hours=8))
SETTINGS_PATH = "profiles/yiqidong_push_settings.json"
DAY_MAP = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]


def parse_now(s: str | None) -> datetime:
    if not s:
        return datetime.now(TZ)
    dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=TZ)
    return dt.astimezone(TZ)


def in_quiet_hours(now: datetime, start: int, end: int) -> bool:
    h = now.hour
    if start > end:
        return h >= start or h < end
    return start <= h < end


def run_script(name: str, *extra: str) -> dict:
    cmd = [sys.executable, str(SCRIPT_DIR / name), *extra]
    proc = subprocess.run(cmd, capture_output=True, text=True, cwd=str(SCRIPT_DIR.parents[2].parent))
    if proc.returncode != 0:
        return {"error": proc.stderr or proc.stdout, "script": name}
    return json.loads(proc.stdout)


def mark_casual_pushed(settings: dict, now: datetime) -> None:
    today = now.date().isoformat()
    c = settings["casual"]
    if c.get("last_push_date") != today:
        c["pushed_today_count"] = 0
        c["last_push_date"] = today
    c["pushed_today_count"] = c.get("pushed_today_count", 0) + 1
    c["last_pushed_at"] = now.isoformat()
    save_json(settings, SETTINGS_PATH)


def complete_task(settings: dict, task_id: str, result: dict) -> None:
    for t in settings.get("one_shot_tasks", []):
        if t.get("task_id") == task_id:
            t["status"] = "done"
            t["completed_at"] = datetime.now(TZ).isoformat()
            t["result"] = result
    save_json(settings, SETTINGS_PATH)


def eval_scheduled(settings: dict, now: datetime) -> dict | None:
    sched = settings.get("scheduled", {})
    if not settings.get("enabled") or not sched.get("active"):
        return None
    day = DAY_MAP[now.weekday()]
    if day not in sched.get("days", []):
        return None
    current = now.strftime("%H:%M")
    # match within same minute
    matched = any(current == t or current.startswith(t[:4]) for t in sched.get("times", []))
    if not matched:
        return None
    rec = run_script("recommend_today.py", "--skip-weather")
    if rec.get("error"):
        return {"should_push": False, "reason": "recommend_failed", "detail": rec}
    text = rec.get("push_message") or "今日适合运动，来看看推荐吧。"
    label = sched.get("label", "每日运动提醒")
    return {
        "should_push": True,
        "workflow": "scheduled",
        "notification_text": f"「{label}」{text}",
        "recommendation": rec,
    }


def eval_casual(settings: dict, now: datetime) -> dict | None:
    c = settings.get("casual", {})
    if not settings.get("enabled") or not c.get("active"):
        return None
    today = now.date().isoformat()
    if c.get("last_push_date") == today and c.get("pushed_today_count", 0) >= c.get("max_per_day", 1):
        return None
    last = c.get("last_pushed_at")
    if last:
        last_dt = datetime.fromisoformat(last)
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=TZ)
        hours = (now - last_dt).total_seconds() / 3600
        if hours < c.get("cooldown_hours", 24):
            return None
    rec = run_script("recommend_today.py", "--skip-weather")
    top = (rec.get("top_recommendations") or [{}])[0]
    score = top.get("score", 0)
    if score < c.get("min_weather_score", 70):
        return {"should_push": False, "workflow": "casual", "reason": "weather_not_good_enough", "score": score}
    scan = run_script("push_scan.py")
    text = scan.get("notification_text") or rec.get("push_message")
    if not text:
        return None
    mark_casual_pushed(settings, now)
    return {
        "should_push": True,
        "workflow": "casual",
        "notification_text": f"「随心推」{text}",
        "recommendation": rec,
    }


def eval_one_shot(settings: dict, now: datetime) -> dict | None:
    pending = [t for t in settings.get("one_shot_tasks", []) if t.get("status") == "pending"]
    if not pending:
        return None
    for task in pending:
        trigger = task.get("trigger_at", "")
        due = False
        if "T" in trigger:
            try:
                tdt = datetime.fromisoformat(trigger.replace("Z", "+00:00"))
                if tdt.tzinfo is None:
                    tdt = tdt.replace(tzinfo=TZ)
                due = now >= tdt
            except ValueError:
                due = True  # NL stored time — demo: treat as due when agent invokes workflow
        else:
            due = True
        if not due:
            continue
        if task.get("type") == "organize_event":
            sport = task.get("sport") or "飞盘"
            venue = task.get("venue") or "朝阳公园"
            created = run_script(
                "create_activity.py",
                "--sport", sport,
                "--venue", venue,
                "--time", trigger if "T" in trigger else now.replace(hour=15, minute=0).isoformat(),
                "--max-participants", str(task.get("max_participants", 8)),
            )
            complete_task(settings, task["task_id"], created)
            ev = created.get("event", {})
            return {
                "should_push": True,
                "workflow": "one_shot_organize",
                "notification_text": f"已帮你组好局：{ev.get('share_text', task.get('intent', ''))}",
                "event": ev,
            }
        rec = run_script("recommend_today.py", "--skip-weather")
        complete_task(settings, task["task_id"], rec)
        text = rec.get("push_message") or task.get("intent") or "今日运动提醒"
        return {
            "should_push": True,
            "workflow": "one_shot_remind",
            "notification_text": text,
            "recommendation": rec,
        }
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Evaluate 一起动 push workflow")
    parser.add_argument("--now", help="ISO datetime for testing")
    args = parser.parse_args()

    now = parse_now(args.now)
    settings = load_json(SETTINGS_PATH)
    q = settings.get("quiet_hours", {"start": 23, "end": 8})

    base = {
        "mode": "push_workflow",
        "enabled": settings.get("enabled", False),
        "push_mode": settings.get("mode", "off"),
        "checked_at": now.isoformat(),
    }

    if not settings.get("enabled"):
        print(json.dumps({**base, "should_push": False, "reason": "用户未开启一起动推送"}, ensure_ascii=False, indent=2))
        return 0

    if in_quiet_hours(now, q.get("start", 23), q.get("end", 8)):
        print(json.dumps({**base, "should_push": False, "reason": "静默时段"}, ensure_ascii=False, indent=2))
        return 0

    mode = settings.get("mode", "off")
    result = None
    if mode == "scheduled":
        result = eval_scheduled(settings, now)
    elif mode == "casual":
        result = eval_casual(settings, now)
    elif mode == "one_shot":
        result = eval_one_shot(settings, now)
    else:
        result = run_script("push_scan.py")
        result = {**result, "workflow": "legacy_scan"} if isinstance(result, dict) else None

    if not result:
        print(json.dumps({**base, "should_push": False, "reason": "当前无待推送"}, ensure_ascii=False, indent=2))
        return 0

    print(json.dumps({**base, **result}, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

#!/usr/bin/env python3
"""Resolve location + weather context for hackathod skills."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json  # noqa: E402


def fetch_weather(alias: str) -> dict:
    """Delegate to OpenClaw weather skill via wttr.in (mock-friendly fallback)."""
    try:
        proc = subprocess.run(
            ["curl", "-s", f"wttr.in/{alias}?format=j1"],
            capture_output=True,
            text=True,
            timeout=8,
            check=False,
        )
        if proc.returncode == 0 and proc.stdout.strip().startswith("{"):
            data = json.loads(proc.stdout)
            current = data.get("current_condition", [{}])[0]
            return {
                "source": "wttr.in",
                "temp_c": current.get("temp_C"),
                "humidity": current.get("humidity"),
                "desc": current.get("weatherDesc", [{}])[0].get("value"),
                "precip_mm": current.get("precipMM"),
            }
    except (subprocess.TimeoutExpired, json.JSONDecodeError, OSError):
        pass
    return {
        "source": "mock_fallback",
        "temp_c": "22",
        "humidity": "45",
        "desc": "Partly cloudy",
        "precip_mm": "0",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Resolve hackathod context")
    parser.add_argument("--city", default=None)
    parser.add_argument("--district", default=None)
    parser.add_argument("--skip-weather", action="store_true")
    args = parser.parse_args()

    loc = load_json("locations.json")
    current = loc["mock_current"]
    city = args.city or current["city"]
    district = args.district or current["district"]

    city_entry = next((c for c in loc["cities"] if c["city"] == city), None)
    districts = city_entry["districts"] if city_entry else []
    district_names = {d["name"] for d in districts}

    if args.city and not args.district and districts:
        district = districts[0]["name"]
    elif district not in district_names and districts:
        district = districts[0]["name"]

    weather_alias = current.get("weather_alias", "Beijing")
    for d in districts:
        if d["name"] == district:
            weather_alias = d.get("weather_alias", weather_alias)
            break

    profile = load_json("profiles/default_user.json")
    ctx = {
        "city": city,
        "district": district,
        "weather_alias": weather_alias,
        "season_hint": current.get("season_hint"),
        "user_goal": profile.get("goal"),
        "daily_kcal_target": profile["daily_targets"]["kcal"],
    }
    if not args.skip_weather:
        ctx["weather"] = fetch_weather(weather_alias)

    print(json.dumps(ctx, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

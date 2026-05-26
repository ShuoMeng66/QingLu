#!/usr/bin/env python3
"""Recommend today's suitable sport based on weather + AQI mock."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json  # noqa: E402

# reuse context resolution
sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "base" / "context-hub" / "scripts"))
import resolve_context  # noqa: E402


def aqi_for(city: str, district: str) -> dict:
    data = load_json("environment/air_quality.json")
    for c in data["cities"]:
        if c["city"] == city:
            for d in c["districts"]:
                if d["name"] == district:
                    return d
    return {"aqi": 80, "aqi_level": "moderate", "outdoor_sports_ok": True, "notes": "默认 mock AQI"}


def weather_desc(ctx: dict) -> str:
    w = ctx.get("weather") or {}
    return (w.get("desc") or "Partly cloudy").lower()


def score_sport(st: dict, aqi: int, weather: str) -> tuple[float, list[str]]:
    reasons = []
    score = 50.0
    if st.get("outdoor_required"):
        if aqi > st.get("aqi_max", 100):
            score -= 40
            reasons.append(f"AQI {aqi} 超过 {st['name']} 建议上限")
        else:
            score += 15
            reasons.append(f"空气质量可支持户外{st['name']}")
    else:
        score += 20
        reasons.append("室内项目，不受 AQI 限制")

    bad = [x.lower() for x in st.get("weather_bad", [])]
    if any(b in weather for b in bad if b):
        score -= 35
        reasons.append("天气不适宜户外")
    elif st.get("outdoor_required") and ("rain" in weather or "storm" in weather):
        score -= 30
        reasons.append("有降水风险")
    else:
        score += 10
        reasons.append("天气尚可")

    score += min(st.get("kcal_per_hour", 300) / 20, 15)
    return round(score, 1), reasons


def main() -> int:
    parser = argparse.ArgumentParser(description="Recommend today sport for 一起动")
    parser.add_argument("--city", default=None)
    parser.add_argument("--district", default=None)
    parser.add_argument("--skip-weather", action="store_true")
    args = parser.parse_args()

    # build context
    old_argv = sys.argv
    sys.argv = ["resolve_context.py"]
    if args.city:
        sys.argv += ["--city", args.city]
    if args.district:
        sys.argv += ["--district", args.district]
    if args.skip_weather:
        sys.argv += ["--skip-weather"]

    import io
    from contextlib import redirect_stdout

    buf = io.StringIO()
    with redirect_stdout(buf):
        resolve_context.main()
    sys.argv = old_argv
    ctx = json.loads(buf.getvalue())

    profile = load_json("profiles/default_user.json")
    sports_types = load_json("activities/sports_types.json")["sport_types"]
    aqi_info = aqi_for(ctx["city"], ctx["district"])
    weather = weather_desc(ctx)

    ranked = []
    for st in sports_types:
        if st["name"] in profile.get("sports", {}).get("avoid_sports", []):
            continue
        s, reasons = score_sport(st, aqi_info.get("aqi", 80), weather)
        if st["name"] in profile.get("sports", {}).get("favorite_sports", []):
            s += 12
            reasons.append("匹配用户偏好")
        ranked.append({"type_id": st["type_id"], "name": st["name"], "score": s, "reasons": reasons, "kcal_per_hour": st["kcal_per_hour"]})

    ranked.sort(key=lambda x: x["score"], reverse=True)
    out = {
        "mode": "today_recommendation",
        "city": ctx["city"],
        "district": ctx["district"],
        "weather": ctx.get("weather"),
        "aqi": aqi_info,
        "top_recommendations": ranked[:3],
        "push_message": None,
    }
    if ranked and ranked[0]["score"] >= 65:
        top = ranked[0]
        out["push_message"] = (
            f"今天{ctx['district']}空气AQI {aqi_info.get('aqi')}，适合{top['name']}，"
            f"预计消耗约{top['kcal_per_hour']}kcal/小时。"
        )
    print(json.dumps(out, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

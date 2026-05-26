#!/usr/bin/env python3
"""Nutrition macro calculator for hackathod skills."""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "scripts"))
from hackathod_common import load_json  # noqa: E402

MENU_KEYS = {
    "hotpot_menu": "menus/hotpot_menu.json",
    "fastfood_menu": "menus/fastfood_menu.json",
    "recovery_menu": "menus/recovery_menu.json",
}


def sum_items(items: list[dict[str, Any]]) -> dict[str, float]:
    total = {"kcal": 0.0, "protein_g": 0.0, "carb_g": 0.0, "fat_g": 0.0}
    for item in items:
        for key in total:
            total[key] += float(item.get(key, 0))
    return {k: round(v, 1) for k, v in total.items()}


def score_meal(total: dict[str, float], targets: dict[str, float], goal: str = "fat_loss") -> dict[str, Any]:
    kcal = total["kcal"]
    protein = total["protein_g"]
    target_kcal = targets.get("kcal", 650)
    target_protein = targets.get("protein_g", 35)

    kcal_ratio = kcal / target_kcal if target_kcal else 1
    protein_ratio = protein / target_protein if target_protein else 1

    if goal == "fat_loss":
        kcal_score = max(0, 100 - abs(kcal_ratio - 1) * 80)
        protein_score = min(100, protein_ratio * 100)
        health = round(kcal_score * 0.45 + protein_score * 0.55, 1)
    else:
        health = round((kcal_ratio + protein_ratio) / 2 * 100, 1)

    verdict = "优秀" if health >= 80 else "可用" if health >= 65 else "需调整"
    return {
        "total": total,
        "targets": targets,
        "health_score": health,
        "verdict": verdict,
        "protein_gap_g": round(max(0, target_protein - protein), 1),
        "kcal_gap": round(target_kcal - kcal, 1),
    }


def normalize_menu_item(item: dict[str, Any]) -> dict[str, Any]:
    kcal = item.get("kcal")
    if kcal is None:
        kcal = item.get("kcal_per_serving", item.get("kcal_per_100g", 0))
    return {
        "sku": item.get("sku"),
        "name": item.get("name"),
        "kcal": float(kcal or 0),
        "protein_g": float(item.get("protein_g", 0)),
        "carb_g": float(item.get("carb_g", 0)),
        "fat_g": float(item.get("fat_g", 0)),
    }


def load_items_from_menu(menu_key: str, skus: list[str]) -> list[dict[str, Any]]:
    if menu_key not in MENU_KEYS:
        raise ValueError(f"Unknown menu key: {menu_key}. Choose from: {', '.join(MENU_KEYS)}")
    data = load_json(MENU_KEYS[menu_key])
    catalog = {item["sku"]: item for item in data.get("items", []) if item.get("sku")}
    for combo in data.get("combos", []):
        if combo.get("combo_id"):
            catalog[combo["combo_id"]] = combo
    missing = [sku for sku in skus if sku not in catalog]
    if missing:
        raise ValueError(f"Unknown SKU(s) in {menu_key}: {', '.join(missing)}")
    return [normalize_menu_item(catalog[sku]) for sku in skus]


def parse_totals(raw: str) -> list[dict[str, Any]]:
    parts = [p.strip() for p in raw.split(",")]
    if len(parts) != 4:
        raise ValueError("--totals expects 4 comma-separated numbers: kcal,protein_g,carb_g,fat_g")
    kcal, protein, carb, fat = (float(p) for p in parts)
    return [{"kcal": kcal, "protein_g": protein, "carb_g": carb, "fat_g": fat}]


def parse_items_json(raw: str) -> list[dict[str, Any]]:
    text = raw.strip()
    if not text or text in {"[...]", "..."}:
        raise ValueError("Replace placeholder [...] with real item data, --totals, or --menu/--skus")

    attempts = [text]
    if text.startswith("'") and text.endswith("'"):
        attempts.append(text[1:-1])
    if text.startswith('"') and text.endswith('"'):
        attempts.append(text[1:-1])

    # PowerShell single-quoted commands strip JSON double quotes: [{kcal:620,...}]
    attempts.append(re.sub(r"(\{|,)\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", r'\1"\2":', text))

    last_error: json.JSONDecodeError | None = None
    for candidate in attempts:
        try:
            data = json.loads(candidate)
            if not isinstance(data, list):
                raise ValueError("--items-json must be a JSON array")
            return data
        except json.JSONDecodeError as exc:
            last_error = exc
            continue

    hint = (
        "Invalid JSON for --items-json. On Windows PowerShell, avoid inline JSON quotes; "
        "use --totals 620,38,58,22 or --menu hotpot_menu --skus lean_beef,shrimp_paste "
        "or --items-file path/to/items.json"
    )
    raise ValueError(f"{hint}. Parser error: {last_error}") from last_error


def load_items(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.totals:
        return parse_totals(args.totals)
    if args.menu and args.skus:
        skus = [s.strip() for s in args.skus.split(",") if s.strip()]
        return load_items_from_menu(args.menu, skus)
    if args.items_file:
        path = Path(args.items_file)
        data = json.loads(path.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            raise ValueError("--items-file must contain a JSON array")
        return data
    if args.items_json:
        return parse_items_json(args.items_json)
    data = json.load(sys.stdin)
    if not isinstance(data, list):
        raise ValueError("stdin must contain a JSON array of items")
    return data


def main() -> int:
    parser = argparse.ArgumentParser(description="Calculate meal macros from mock items")
    parser.add_argument("--items-json", help="JSON array of items with kcal/protein_g/carb_g/fat_g")
    parser.add_argument("--items-file", help="Path to JSON file containing an items array")
    parser.add_argument("--totals", help="Windows-safe shortcut: kcal,protein_g,carb_g,fat_g")
    parser.add_argument("--menu", choices=sorted(MENU_KEYS.keys()), help="Mock menu key for --skus")
    parser.add_argument("--skus", help="Comma-separated SKUs/combo_ids from --menu")
    parser.add_argument("--meal", default="dinner", choices=["breakfast", "lunch", "dinner", "snack"])
    args = parser.parse_args()

    try:
        items = load_items(args)
    except ValueError as exc:
        print(json.dumps({"error": str(exc)}, ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    profile = load_json("profiles/default_user.json")
    budget_key = f"{args.meal}_kcal"
    targets = {
        "kcal": profile["meal_budget"].get(budget_key, 650),
        "protein_g": profile["daily_targets"]["protein_g"] / 3,
    }

    result = score_meal(sum_items(items), targets, profile.get("goal", "fat_loss"))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

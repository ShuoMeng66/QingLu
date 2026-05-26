"""Extract Qinglu character assets from reference images."""
from __future__ import annotations

import os
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images" / "qinglu"
ASSETS = Path(r"C:\Users\MR\.cursor\projects\d-Hackathod\assets")
SHEET = next(ASSETS.glob("*7d31f31ce49d2552b7bbcc7bdac7473b*.png"))
MOCK = next(ASSETS.glob("*c5e744b487e496bf1224318ce7c1c18c*.png"))


def cream_key(img: Image.Image, tolerance: int = 38) -> Image.Image:
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    corners = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (0, h // 2)]
    refs = [px[x, y][:3] for x, y in corners]
    avg = tuple(sum(c[i] for c in refs) // len(refs) for i in range(3))
    for y in range(h):
        for x in range(w):
            r, g, b, _a = px[x, y]
            dist = abs(r - avg[0]) + abs(g - avg[1]) + abs(b - avg[2])
            if dist < tolerance or (r > 230 and g > 225 and b > 215):
                px[x, y] = (r, g, b, 0)
    return img


def save(img: Image.Image, name: str) -> None:
    path = OUT / name
    img.save(path, optimize=True)
    print(f"saved {name} {img.size}")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(SHEET)
    mock = Image.open(MOCK)

    save(cream_key(sheet.crop((0, 0, 420, 780)), 42), "qinglu-fullbody.png")
    save(cream_key(sheet.crop((30, 0, 400, 760)), 42), "qinglu-hero.png")

    avatar = cream_key(sheet.crop((120, 20, 320, 220)), 35)
    avatar = avatar.resize((256, 256), Image.Resampling.LANCZOS)
    save(avatar, "qinglu-avatar.png")

    save(mock.crop((0, 0, 556, 340)).convert("RGB"), "qinglu-chat-header.png")
    save(cream_key(mock.crop((280, 40, 540, 320)), 45), "qinglu-cutout.png")
    save(sheet, "qinglu-sheet.png")
    save(mock.crop((0, 0, 400, 200)).convert("RGB"), "qinglu-skyline.png")


if __name__ == "__main__":
    main()

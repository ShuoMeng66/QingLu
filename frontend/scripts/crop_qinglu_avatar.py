"""Crop Qinglu portrait into a face-focused square avatar."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "images" / "qinglu"
SOURCE = Path(
    r"C:\Users\MR\.cursor\projects\d-Hackathod\assets"
    r"\c__Users_MR_AppData_Roaming_Cursor_User_workspaceStorage_ca99ac1373e0a13fdbc298273d21f6e9_images_"
    r"1191727c-bb5f-4c96-9091-e49ad034143a-b53b737f-1581-475c-b3ea-d024b7a7b02f.png"
)


def crop_avatar(img: Image.Image, top_ratio: float = 0.08, height_ratio: float = 0.55) -> Image.Image:
    """Square crop centered horizontally, anchored on face/upper body."""
    w, h = img.size
    side = int(w * height_ratio)
    side = min(side, w, h)
    left = (w - side) // 2
    top = int(h * top_ratio)
    top = max(0, min(top, h - side))
    return img.crop((left, top, left + side, top + side))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    portrait = Image.open(SOURCE).convert("RGB")
    portrait_path = OUT / "qinglu-portrait.png"
    portrait.save(portrait_path, optimize=True)
    print(f"saved {portrait_path.name} {portrait.size}")

    avatar = crop_avatar(portrait)
    avatar = avatar.resize((512, 512), Image.Resampling.LANCZOS)
    avatar_path = OUT / "qinglu-avatar.png"
    avatar.save(avatar_path, optimize=True)
    print(f"saved {avatar_path.name} {avatar.size}")


if __name__ == "__main__":
    main()

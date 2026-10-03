"""สร้างไอคอนของแอปลงใน public/icons (รันเมื่ออยากเปลี่ยนไอคอน: python scripts/make-icons.py)"""

import math
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent.parent / "public" / "icons"
SCALE = 4  # วาดใหญ่กว่าจริงแล้วย่อลง เพื่อให้ขอบเรียบ

SKY_TOP = (120, 205, 255)
SKY_BOTTOM = (94, 129, 255)
STAR = (255, 212, 59)
STAR_EDGE = (245, 159, 0)
CHILD = (255, 159, 28)
PARENT = (255, 255, 255)


def star_points(cx: float, cy: float, outer: float, inner: float) -> list[tuple[float, float]]:
    points = []
    for i in range(10):
        radius = outer if i % 2 == 0 else inner
        angle = math.radians(-90 + i * 36)
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    return points


def draw_icon(size: int) -> Image.Image:
    s = size * SCALE
    img = Image.new("RGB", (s, s))
    draw = ImageDraw.Draw(img)

    for y in range(s):
        t = y / (s - 1)
        color = tuple(round(a + (b - a) * t) for a, b in zip(SKY_TOP, SKY_BOTTOM))
        draw.line([(0, y), (s, y)], fill=color)

    # ทุกอย่างอยู่ในวงกลมกลางภาพ เพื่อไม่ให้ถูกตัดเมื่อระบบครอบไอคอนเป็นวงกลม
    cx = s / 2
    draw.polygon(star_points(cx, s * 0.40, s * 0.27, s * 0.115), fill=STAR_EDGE)
    draw.polygon(star_points(cx, s * 0.40, s * 0.235, s * 0.10), fill=STAR)

    # วงกลมสองวงแทนผู้เล่นสองคน
    r = s * 0.085
    for x, color in ((s * 0.385, CHILD), (s * 0.615, PARENT)):
        draw.ellipse([x - r, s * 0.72 - r, x + r, s * 0.72 + r], fill=color)

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
        draw_icon(size).save(OUT / name, optimize=True)
        print("wrote", OUT / name)


if __name__ == "__main__":
    main()

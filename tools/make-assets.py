"""Build the fallback pet art from the reference images in ../../assets.

The originals are references, not runtime files. We trim the white backdrop so
the pet can float on the desktop; the Live2D upgrade can replace these later.
"""
from collections import deque
from pathlib import Path
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT.parent / "assets"
OUT = ROOT / "pet" / "assets"
OUT.mkdir(parents=True, exist_ok=True)


def remove_white(img: Image.Image, tol: int = 26) -> Image.Image:
    img = img.convert("RGBA")
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    q = deque()

    def near_white(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and r >= 255 - tol and g >= 255 - tol and b >= 255 - tol

    for x in range(w):
        for y in (0, h - 1):
            if not seen[y * w + x] and near_white(x, y):
                seen[y * w + x] = 1
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not seen[y * w + x] and near_white(x, y):
                seen[y * w + x] = 1
                q.append((x, y))

    while q:
        x, y = q.popleft()
        r, g, b, a = px[x, y]
        px[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and near_white(nx, ny):
                seen[ny * w + nx] = 1
                q.append((nx, ny))

    # Soften the 1px white halo left by JPEG.
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r > 238 and g > 238 and b > 238:
                edge = False
                for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                    if 0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 0:
                        edge = True
                        break
                if edge:
                    px[x, y] = (r, g, b, 110)
    return img


def trim(img: Image.Image, pad: int = 12) -> Image.Image:
    box = img.getbbox()
    if not box:
        return img
    l, t, r, b = box
    l = max(0, l - pad); t = max(0, t - pad)
    r = min(img.width, r + pad); b = min(img.height, b + pad)
    return img.crop((l, t, r, b))


def save_png(img: Image.Image, name: str):
    img.save(OUT / name, "PNG", optimize=True)
    print("wrote", name, img.size)


def main():
    # Maid: 2.png is a clean front view on white (it is really a JPEG).
    maid = Image.open(ASSETS / "2.png")
    save_png(trim(remove_white(maid)), "maid.png")

    # Winter: crop the front view out of the three-view sheet.
    winter = Image.open(ASSETS / "冬装小肥鱼.png")
    front = winter.crop((0, 0, int(winter.width * 0.36), winter.height))
    save_png(trim(remove_white(front, tol=30)), "winter.png")

    # Knit: animated GIF -> animated WebP with alpha.
    gif = Image.open(ASSETS / "dance.gif")
    frames = []
    durations = []
    try:
        while True:
            frame = gif.convert("RGBA")
            frames.append(remove_white(frame, tol=18))
            durations.append(gif.info.get("duration", 80))
            gif.seek(gif.tell() + 1)
    except EOFError:
        pass
    if frames:
        # 200 frames at full size is 12 MB; sample every third frame and keep the
        # loop under ~3 MB so the pet window opens instantly.
        step = 3
        frames = [f.resize((300, 423), Image.LANCZOS) for f in frames[::step]]
        durations = [max(60, sum(durations[i:i + step])) for i in range(0, len(durations), step)]
        frames[0].save(
            OUT / "knit.webp", "WEBP", save_all=True, append_images=frames[1:],
            duration=durations, loop=0, quality=62, method=4,
        )
        print("wrote knit.webp", frames[0].size, "frames", len(frames))

    # Sticker reactions: keep the blue sticker background, resize.
    for src, dst in (("爱你哦.png", "happy.webp"), ("才不肥.png", "pout.webp"), ("好困.png", "sleepy.webp")):
        img = Image.open(ASSETS / src).convert("RGBA")
        img.thumbnail((360, 360), Image.LANCZOS)
        img.save(OUT / dst, "WEBP", quality=84)
        print("wrote", dst, img.size)

    # Keep the original three-view as a design reference for Codex.
    winter.save(OUT / "winter-reference.jpg", "JPEG", quality=88)


if __name__ == "__main__":
    main()

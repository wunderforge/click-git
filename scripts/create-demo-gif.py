from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "media" / "demo.gif"
W, H = 960, 540


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


F_TITLE = font(26, True)
F_UI = font(17)
F_UI_BOLD = font(17, True)
F_SMALL = font(14)
F_CODE = font(15)


def rect(draw: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], fill: str, outline: str | None = None, width: int = 1) -> None:
    draw.rounded_rectangle(xy, radius=8, fill=fill, outline=outline, width=width)


def text(draw: ImageDraw.ImageDraw, xy: tuple[int, int], value: str, fill: str = "#dbeafe", fnt: ImageFont.ImageFont = F_UI) -> None:
    draw.text(xy, value, fill=fill, font=fnt)


def draw_window(title: str, step: str) -> Image.Image:
    img = Image.new("RGB", (W, H), "#0f172a")
    d = ImageDraw.Draw(img)

    rect(d, (18, 18, W - 18, H - 18), "#111827", "#334155", 2)
    d.rectangle((18, 18, W - 18, 56), fill="#1f2937")
    text(d, (38, 28), "Click Git demo", "#e5e7eb", F_UI_BOLD)
    for i, c in enumerate(["#ef4444", "#f59e0b", "#22c55e"]):
        d.ellipse((W - 92 + i * 24, 31, W - 80 + i * 24, 43), fill=c)

    text(d, (42, 78), title, "#f8fafc", F_TITLE)
    text(d, (42, 114), step, "#93c5fd", F_UI)

    # Explorer sidebar
    rect(d, (42, 156, 310, 462), "#0b1220", "#334155")
    text(d, (62, 174), "EXPLORER", "#94a3b8", F_SMALL)
    text(d, (62, 206), "manual-repo", "#e5e7eb", F_UI_BOLD)
    text(d, (82, 238), "selected", "#fbbf24", F_UI_BOLD)
    text(d, (108, 268), "file.txt", "#e5e7eb", F_UI)
    text(d, (82, 304), "outside", "#cbd5e1", F_UI)
    text(d, (108, 334), "file.txt", "#cbd5e1", F_UI)

    # Editor/output area
    rect(d, (334, 156, 918, 462), "#020617", "#334155")
    text(d, (358, 176), "Git status before", "#f8fafc", F_UI_BOLD)
    code_lines = [
        " M selected/file.txt",
        " M outside/file.txt",
        "",
        "Right-click selected -> Click Git: Stage Folder",
        "",
        "Git status after",
        "M  selected/file.txt",
        " M outside/file.txt",
    ]
    y = 212
    for line in code_lines:
        color = "#22c55e" if line.startswith("M  selected") else "#e5e7eb"
        if line.startswith("Right-click"):
            color = "#fbbf24"
        text(d, (358, y), line, color, F_CODE)
        y += 25

    return img


def draw_context_menu(base: Image.Image, highlight_index: int = 0) -> Image.Image:
    img = base.copy()
    d = ImageDraw.Draw(img)
    x, y = 214, 246
    items = [
        "Click Git: Stage Folder",
        "Click Git: Unstage Folder",
        "Click Git: Commit Folder",
        "Click Git: Restore Folder",
        "Click Git: Status Folder",
        "Click Git: Diff Folder",
        "Click Git: Pull Repo",
        "Click Git: Pull Nested Repos",
    ]
    rect(d, (x, y, x + 278, y + 278), "#111827", "#475569")
    for idx, item in enumerate(items):
        yy = y + 18 + idx * 31
        if idx == highlight_index:
            d.rectangle((x + 8, yy - 5, x + 270, yy + 24), fill="#0f766e")
        text(d, (x + 18, yy), item, "#f8fafc" if idx == highlight_index else "#cbd5e1", F_SMALL)
    return img


def draw_success(base: Image.Image) -> Image.Image:
    img = base.copy()
    d = ImageDraw.Draw(img)
    rect(d, (590, 86, 898, 132), "#064e3b", "#34d399")
    text(d, (612, 101), "Staged folder: selected", "#ecfdf5", F_UI_BOLD)
    return img


def draw_output(base: Image.Image) -> Image.Image:
    img = base.copy()
    d = ImageDraw.Draw(img)
    d.rectangle((334, 370, 918, 462), fill="#030712")
    text(d, (358, 386), "Click Git output", "#93c5fd", F_UI_BOLD)
    text(d, (358, 416), "Staged selected in C:\\...\\manual-repo", "#e5e7eb", F_CODE)
    return img


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    frames: list[Image.Image] = []

    base = draw_window(
        "Right-click folder Git actions",
        "Run common Git commands against only the folder you select.",
    )
    frames.extend([base] * 8)

    menu = draw_context_menu(base)
    frames.extend([menu] * 12)

    success = draw_success(base)
    frames.extend([success] * 10)

    output = draw_output(success)
    frames.extend([output] * 12)

    frames[0].save(
        OUT,
        save_all=True,
        append_images=frames[1:],
        duration=120,
        loop=0,
        optimize=True,
    )


if __name__ == "__main__":
    main()

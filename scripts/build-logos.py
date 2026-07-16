#!/usr/bin/env python3
"""Build the AA mark asset set from vector masters.

Everything derives from the double-A ligature paths in aauth-wordmark.svg.
Those are real paths, not <text>, so rendering does not depend on JetBrains
Mono being installed -- which it is not, on most machines.

Usage:  python3 scripts/build-logos.py
Requires: rsvg-convert  (brew install librsvg)
"""

import os
import struct
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MEDIA = os.path.join(ROOT, "static", "media")
STATIC = os.path.join(ROOT, "static")

# --- brand -----------------------------------------------------------------
BRIGHT = "#40D97B"   # --color-accent   : leading A
DARK = "#277346"     # #40D97B @50% over #0a0a0f, baked solid: trailing A
BG = "#0a0a0f"       # coin background

# Optical sizing for 16/32px. At those sizes the two A's blur into one blob:
# the ligature is only ~10px of ink and A-vs-A separation is just 3.15:1.
# Darkening the trailing A cannot help -- it is already wedged between a
# near-black bg (3.41:1) and the leading A (3.15:1), and a search over the
# green ramp tops out at 3.26:1. Brightening the LEADING A is the lever that
# works: #7BEFAA takes A-vs-A to 4.07:1. Tiny sizes also drop circle-safe
# padding, since nothing circle-crops a favicon.
BRIGHT_TINY = "#7BEFAA"
TINY_SIZES = (16, 32)

# The two A paths, lifted verbatim from aauth-wordmark.svg.
# Ink bbox: x 0..92.6016, y 3.90625..75  (92.6016 x 71.0938)
A_TRAIL = "M60.9121 16.0645L41.5762 75H26L52.416 3.90625H62.3281L60.9121 16.0645ZM76.9766 75L57.5918 16.0645L56.0293 3.90625H66.0391L92.6016 75H76.9766ZM76.0977 48.5352V60.0098H38.5488V48.5352H76.0977Z"
A_LEAD = "M34.9121 16.0645L15.5762 75H0L26.416 3.90625H36.3281L34.9121 16.0645ZM50.9766 75L31.5918 16.0645L30.0293 3.90625H40.0391L66.6016 75H50.9766ZM50.0977 48.5352V60.0098H12.5488V48.5352H50.0977Z"

INK_W, INK_H = 92.6016, 71.0938
INK_Y0 = 3.90625


def ligature(scale, canvas_w, canvas_h, bright=BRIGHT, dark=DARK):
    """AA ligature, ink-centered on the canvas at the given scale."""
    ox = (canvas_w - INK_W * scale) / 2
    oy = (canvas_h - INK_H * scale) / 2 - INK_Y0 * scale
    return (
        f'  <g transform="translate({ox:.4f}, {oy:.4f}) scale({scale})">\n'
        f'    <path d="{A_TRAIL}" fill="{dark}"/>\n'
        f'    <path d="{A_LEAD}" fill="{bright}"/>\n'
        f"  </g>\n"
    )


def svg(body, w, h):
    return (
        f'<svg viewBox="0 0 {w} {h}" fill="none" xmlns="http://www.w3.org/2000/svg">\n'
        f"{body}</svg>\n"
    )


def write(path, text):
    write_quiet(path, text)
    print(f"  wrote {os.path.relpath(path, ROOT)}")


def write_quiet(path, text):
    with open(path, "w") as f:
        f.write(text)


def render(src, dst, w, h):
    subprocess.run(
        ["rsvg-convert", "-w", str(w), "-h", str(h), src, "-o", dst], check=True
    )


def make_ico(png_paths, dst):
    """ICO with embedded PNGs (Vista+). Entries must be ordered small->large."""
    entries, blobs = [], []
    offset = 6 + 16 * len(png_paths)
    for p in png_paths:
        data = open(p, "rb").read()
        w = h = int(os.path.basename(p).rsplit("-", 1)[1].split(".")[0])
        entries.append(
            struct.pack(
                "<BBBBHHII",
                w if w < 256 else 0,
                h if h < 256 else 0,
                0, 0, 1, 32,
                len(data), offset,
            )
        )
        blobs.append(data)
        offset += len(data)
    with open(dst, "wb") as f:
        f.write(struct.pack("<HHH", 0, 1, len(png_paths)))
        for e in entries:
            f.write(e)
        for b in blobs:
            f.write(b)
    print(f"  wrote {os.path.relpath(dst, ROOT)}")


def main():
    if subprocess.run(["which", "rsvg-convert"], capture_output=True).returncode:
        sys.exit("rsvg-convert not found -- brew install librsvg")

    # --- transparent mark: we control the background, so let it breathe ---
    print("transparent mark:")
    aa_logo = os.path.join(MEDIA, "aa-logo.svg")
    write(aa_logo, svg(ligature(5.0, 512, 512), 512, 512))
    for s in (16, 32, 48, 64, 128, 180, 256, 512, 1024):
        render(aa_logo, os.path.join(MEDIA, f"aa-logo-{s}.png"), s, s)
    print(f"  rendered aa-logo-*.png")

    # --- coin: carries its own background for foreign surfaces ---
    # scale 3.5 -> ink 324x249 in 512, half-diagonal 204 < 256, so the mark
    # survives a circle crop with room to spare.
    print("coin (rounded):")
    coin_body = f'  <rect width="512" height="512" rx="96" fill="{BG}"/>\n' + ligature(3.5, 512, 512)
    aa_coin = os.path.join(MEDIA, "aa-coin.svg")
    write(aa_coin, svg(coin_body, 512, 512))
    for s in (48, 64, 128, 180, 256, 512):
        render(aa_coin, os.path.join(MEDIA, f"aa-coin-{s}.png"), s, s)
    print(f"  rendered aa-coin-*.png")

    # --- coin, tiny: brighter lead + tighter padding so 16/32 stay readable ---
    print("coin (tiny, optical-sized for 16/32):")
    tiny_body = (
        f'  <rect width="512" height="512" rx="96" fill="{BG}"/>\n'
        + ligature(4.4, 512, 512, bright=BRIGHT_TINY)
    )
    aa_tiny = os.path.join(MEDIA, "aa-coin-tiny.svg")
    write(aa_tiny, svg(tiny_body, 512, 512))
    for s in TINY_SIZES:
        render(aa_tiny, os.path.join(MEDIA, f"aa-coin-{s}.png"), s, s)
    print(f"  rendered aa-coin-{{{','.join(map(str, TINY_SIZES))}}}.png from tiny master")

    # --- coin, full-bleed square ------------------------------------------
    # Two reasons this, not the rounded coin, is the favicon/touch-icon:
    #  1. iOS/Android apply their OWN mask; pre-rounded art double-rounds.
    #  2. Browsers do NOT round favicons -- rounded corners just expose the
    #     tab background through the notches. Square still carries its own
    #     background, which is what makes the coin robust on foreign chrome.
    print("coin (square, for favicons + OS masking):")
    sq_body = f'  <rect width="512" height="512" fill="{BG}"/>\n' + ligature(3.5, 512, 512)
    aa_sq = os.path.join(MEDIA, "aa-coin-square.svg")
    write(aa_sq, svg(sq_body, 512, 512))
    render(aa_sq, os.path.join(STATIC, "apple-touch-icon.png"), 180, 180)
    print("  wrote static/apple-touch-icon.png (180, square: iOS masks it)")

    # favicon.svg replaces the old <text>-based file, which depended on
    # JetBrains Mono being installed and used the wrong green (#4ade80).
    write(os.path.join(STATIC, "favicon.svg"), svg(sq_body, 512, 512))

    # aauth.png: JSON-LD logo, referenced from +page.svelte
    render(aa_sq, os.path.join(STATIC, "aauth.png"), 200, 200)
    print("  wrote static/aauth.png (200, JSON-LD logo)")

    # --- favicon.ico: square, tiny-optical at 16/32 ------------------------
    print("favicon.ico:")
    tiny_sq = (
        f'  <rect width="512" height="512" fill="{BG}"/>\n'
        + ligature(4.4, 512, 512, bright=BRIGHT_TINY)
    )
    tmp_svg = os.path.join(MEDIA, ".ico-src.svg")
    icos = []
    for s in (16, 32, 48):
        write_quiet(tmp_svg, svg(tiny_sq if s in TINY_SIZES else sq_body, 512, 512))
        p = os.path.join(MEDIA, f".ico-{s}.png")
        render(tmp_svg, p, s, s)
        icos.append(p)
    make_ico(icos, os.path.join(STATIC, "favicon.ico"))
    for p in icos + [tmp_svg]:
        os.remove(p)


if __name__ == "__main__":
    main()

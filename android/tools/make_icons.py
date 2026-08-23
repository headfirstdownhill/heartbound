"""Generates the launcher icons from the game's own heart.

The game has no image files anywhere — every sprite is a grid of characters
mapped to palette colours — and the icon is made the same way rather than being
a stray png someone drew once and can no longer regenerate. Writes the PNGs by
hand out of zlib so this needs nothing installed.
"""

import os
import struct
import zlib

# The HEART grid from js/gfx/sprites/items.js, and the palette entries it uses.
HEART = [
    '..rr...rr..',
    '.rwrr.rrrr.',
    'rwrrrrrrrrr',
    'rrrrrrrrrrr',
    'rrrrrrrrrrr',
    '.RRRRRRRRR.',
    '..RRRRRRR..',
    '...RRRRR...',
    '....RRR....',
    '.....R.....',
]
INK = {
    'r': (0xFF, 0x4D, 0x6D),
    'R': (0xC2, 0x2A, 0x4C),
    'w': (0xFF, 0xFF, 0xFF),
}
BACKDROP = (0x0D, 0x0B, 0x14)

# Launcher buckets. Android picks by screen density; shipping all five means no
# phone has to stretch one.
SIZES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}

# How much of the icon the heart takes up. Launchers mask icons into circles and
# squircles, so it needs real margin or the corners get shaved off.
COVER = 0.58


def write_png(path, width, height, rows):
    raw = b''.join(b'\x00' + bytes(row) for row in rows)

    def chunk(kind, data):
        head = struct.pack('>I', len(data)) + kind
        return head + data + struct.pack('>I', zlib.crc32(kind + data) & 0xFFFFFFFF)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(raw, 9))
    png += chunk(b'IEND', b'')
    with open(path, 'wb') as fh:
        fh.write(png)


def render(size):
    art_w = len(HEART[0])
    art_h = len(HEART)
    # Whole-number scale only: the art is pixel art, and a fractional scale
    # would resample it into mush at the exact moment it is most looked at.
    scale = max(1, int(size * COVER / art_w))
    ox = (size - art_w * scale) // 2
    oy = (size - art_h * scale) // 2

    rows = []
    for y in range(size):
        row = bytearray()
        gy = (y - oy) // scale
        for x in range(size):
            gx = (x - ox) // scale
            pixel = BACKDROP
            if 0 <= gy < art_h and 0 <= gx < art_w and oy <= y and ox <= x:
                ch = HEART[gy][gx]
                if ch in INK:
                    pixel = INK[ch]
            row += bytes(pixel)
        rows.append(row)
    return rows


def main():
    here = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    for bucket, size in SIZES.items():
        out_dir = os.path.join(here, 'res', 'mipmap-' + bucket)
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, 'ic_launcher.png')
        write_png(path, size, size, render(size))
        print('  %-8s %3dx%-3d  %s' % (bucket, size, size, os.path.relpath(path, here)))


if __name__ == '__main__':
    main()

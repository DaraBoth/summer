#!/usr/bin/env python3
import io
import json
import os
import sys
import zipfile
from pathlib import Path

from PIL import Image


MAX_WIDTH = int(os.getenv("MENU_MAX_WIDTH", "1600"))
JPEG_QUALITY = int(os.getenv("MENU_JPEG_QUALITY", "78"))
WEBP_QUALITY = int(os.getenv("MENU_WEBP_QUALITY", "75"))


SUPPORTED = {".jpg", ".jpeg", ".png", ".webp"}


def optimize_image_bytes(data: bytes, ext: str):
    img = Image.open(io.BytesIO(data))
    if img.mode not in ("RGB", "L"):
        img = img.convert("RGB")

    if img.width > MAX_WIDTH:
        ratio = MAX_WIDTH / float(img.width)
        new_height = int(img.height * ratio)
        img = img.resize((MAX_WIDTH, new_height), Image.Resampling.LANCZOS)

    out = io.BytesIO()
    ext_lower = ext.lower()

    if ext_lower in (".jpg", ".jpeg", ".png"):
        img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True, progressive=True)
        return out.getvalue(), ".jpg"

    if ext_lower == ".webp":
        img.save(out, format="WEBP", quality=WEBP_QUALITY, method=6)
        return out.getvalue(), ".webp"

    return data, ext


def main():
    if len(sys.argv) != 4:
        print("Usage: optimize_menu_zip.py <input_zip> <output_zip> <report_json>", file=sys.stderr)
        sys.exit(1)

    input_zip = Path(sys.argv[1])
    output_zip = Path(sys.argv[2])
    report_json = Path(sys.argv[3])

    if not input_zip.exists():
        print(f"Input ZIP does not exist: {input_zip}", file=sys.stderr)
        sys.exit(1)

    before_total = 0
    after_total = 0
    optimized_files = 0
    copied_files = 0

    with zipfile.ZipFile(input_zip, "r") as zin, zipfile.ZipFile(
        output_zip,
        "w",
        compression=zipfile.ZIP_DEFLATED,
        compresslevel=9,
    ) as zout:
        for info in zin.infolist():
            if info.is_dir():
                continue

            name = info.filename
            data = zin.read(name)
            before_total += len(data)

            ext = Path(name.lower()).suffix
            if ext in SUPPORTED:
                new_data, new_ext = optimize_image_bytes(data, ext)
                out_name = str(Path(name).with_suffix(new_ext)).replace("\\", "/")
                zout.writestr(out_name, new_data)
                after_total += len(new_data)
                optimized_files += 1
            else:
                zout.writestr(name, data)
                after_total += len(data)
                copied_files += 1

    report = {
        "beforeBytes": before_total,
        "afterBytes": after_total,
        "savedBytes": before_total - after_total,
        "optimizedFiles": optimized_files,
        "copiedFiles": copied_files,
    }

    report_json.write_text(json.dumps(report), encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()

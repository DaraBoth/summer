#!/usr/bin/env python3
import io
import json
import sys
import zipfile
from pathlib import Path

import pypdfium2 as pdfium


RENDER_SCALE = 2.0  # ~144 DPI


def main() -> int:
    if len(sys.argv) != 4:
        print("Usage: pdf_to_png_zip.py <input_pdf> <output_zip> <report_json>", file=sys.stderr)
        return 1

    input_pdf = Path(sys.argv[1])
    output_zip = Path(sys.argv[2])
    report_json = Path(sys.argv[3])

    if not input_pdf.exists():
        print(f"Input PDF not found: {input_pdf}", file=sys.stderr)
        return 1

    doc = pdfium.PdfDocument(str(input_pdf))
    page_count = len(doc)

    total_png_bytes = 0

    with zipfile.ZipFile(output_zip, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zout:
        for i in range(page_count):
            page = doc[i]
            bitmap = page.render(scale=RENDER_SCALE)
            image = bitmap.to_pil()

            buf = io.BytesIO()
            image.save(buf, format="PNG", optimize=True)
            png_data = buf.getvalue()

            file_name = f"menu-{i + 1}.png"
            zout.writestr(file_name, png_data)
            total_png_bytes += len(png_data)

    report = {
        "inputPdf": str(input_pdf),
        "outputZip": str(output_zip),
        "pages": page_count,
        "totalPngBytes": total_png_bytes,
        "averagePngBytes": int(total_png_bytes / page_count) if page_count else 0,
    }

    report_json.write_text(json.dumps(report), encoding="utf-8")
    print(json.dumps(report))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

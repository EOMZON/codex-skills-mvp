#!/usr/bin/env python3
from __future__ import annotations

import argparse
from pathlib import Path


def _read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def _write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def generate_preview_page(svg_path: Path, output_html: Path, template_html: Path) -> None:
    svg_text = _read_text(svg_path).strip()
    template = _read_text(template_html)

    title = f"WeChat SVG Preview · {svg_path.name}"
    result = (
        template.replace("{{PAGE_TITLE}}", title)
        .replace("{{SVG_FILENAME}}", svg_path.name)
        .replace("<!-- SVG_PLACEHOLDER -->", svg_text)
    )

    _write_text(output_html, result)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a preview HTML page for interactive SVGs in WeChat.",
    )
    parser.add_argument("svg_path", help="Path to the .svg file to embed.")
    parser.add_argument(
        "-o",
        "--output",
        default="wechat-svg-preview.html",
        help="Output HTML path (default: ./wechat-svg-preview.html).",
    )
    args = parser.parse_args()

    svg_path = Path(args.svg_path).expanduser().resolve()
    if not svg_path.exists():
        raise SystemExit(f"SVG file not found: {svg_path}")

    output_html = Path(args.output).expanduser().resolve()
    script_dir = Path(__file__).resolve().parent
    template_html = (script_dir.parent / "assets" / "preview-template.html").resolve()
    if not template_html.exists():
        raise SystemExit(f"Template not found: {template_html}")

    generate_preview_page(svg_path=svg_path, output_html=output_html, template_html=template_html)
    print(f"Wrote: {output_html}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


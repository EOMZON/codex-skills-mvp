#!/usr/bin/env python3
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps, ImageStat


MODEL_URLS = {
    "EDSR_x4.pb": "https://raw.githubusercontent.com/Saafke/EDSR_Tensorflow/master/models/EDSR_x4.pb",
    "FSRCNN_x4.pb": "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x4.pb",
    "FSRCNN_x2.pb": "https://raw.githubusercontent.com/Saafke/FSRCNN_Tensorflow/master/models/FSRCNN_x2.pb",
}


def _ts() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


def _eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def _safe_mkdir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _flatten_to_rgb(img: Image.Image, *, bg=(255, 255, 255)) -> Image.Image:
    if img.mode in ("RGBA", "LA") or ("transparency" in img.info):
        rgba = img.convert("RGBA")
        base = Image.new("RGBA", rgba.size, bg + (255,))
        out = Image.alpha_composite(base, rgba).convert("RGB")
        return out
    return img.convert("RGB")


def _try_import_cv2():
    try:
        import cv2  # type: ignore

        return cv2
    except Exception:
        return None


def _guess_content_type(path: Path) -> str:
    ext = path.suffix.lower()
    if ext == ".png":
        return "image/png"
    if ext in (".jpg", ".jpeg"):
        return "image/jpeg"
    if ext == ".webp":
        return "image/webp"
    if ext == ".gif":
        return "image/gif"
    if ext == ".svg":
        return "image/svg+xml"
    if ext == ".html":
        return "text/html; charset=utf-8"
    return "application/octet-stream"


def _load_env_file(env_path: Path) -> None:
    try:
        raw = env_path.read_text(encoding="utf-8")
    except Exception:
        return

    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip("'\"")
        if key and key not in os.environ:
            os.environ[key] = value


def _auto_load_r2_env() -> None:
    # Best-effort: load common per-repo env files if present (never print secrets).
    # 1) Explicit path
    explicit = os.environ.get("R2_ENV_FILE") or os.environ.get("CLOUDFLARE_ENV_FILE")
    if explicit:
        _load_env_file(Path(explicit).expanduser())
        return

    # 2) ./8_Workflow/video/OLDLIFEASSONG/.env somewhere above cwd
    cwd = Path.cwd()
    for p in [cwd] + list(cwd.parents):
        candidate = p / "8_Workflow" / "video" / "OLDLIFEASSONG" / ".env"
        if candidate.exists():
            _load_env_file(candidate)
            return

    # 3) local .env
    local = cwd / ".env"
    if local.exists():
        _load_env_file(local)


def _candidate_model_dirs(start: Path, *, explicit_dir: Optional[Path] = None) -> list[Path]:
    out: list[Path] = []
    if explicit_dir:
        out.append(explicit_dir)

    env_dir = os.environ.get("OPENCV_SR_MODEL_DIR")
    if env_dir:
        out.append(Path(env_dir).expanduser())

    for p in [start] + list(start.parents):
        out.append(p / "tmp" / "opencv_sr_models")

    out.append(Path.home() / ".codex" / "cache" / "opencv_sr_models")
    out.append(Path.home() / ".cache" / "opencv_sr_models")
    return out


def _find_model_file(name: str, start: Path, *, explicit_dir: Optional[Path] = None) -> Optional[Path]:
    for d in _candidate_model_dirs(start, explicit_dir=explicit_dir):
        try:
            candidate = (d / name).resolve()
        except Exception:
            candidate = d / name
        if candidate.exists():
            return candidate
    return None


def _download_model(name: str, dest_dir: Path) -> Path:
    url = MODEL_URLS.get(name)
    if not url:
        raise RuntimeError(f"Unknown model file: {name}")
    _safe_mkdir(dest_dir)
    dest = dest_dir / name
    _eprint(f"Downloading {name} -> {dest}")
    tmp = dest.with_suffix(dest.suffix + ".part")
    with urllib.request.urlopen(url) as r:  # noqa: S310
        if r.status != 200:
            raise RuntimeError(f"Download failed: {url} ({r.status})")
        tmp.write_bytes(r.read())
    tmp.replace(dest)
    return dest


def _require_model(name: str, start: Path, *, model_dir: Optional[Path], download: bool) -> Path:
    found = _find_model_file(name, start, explicit_dir=model_dir)
    if found:
        return found
    if download:
        return _download_model(name, dest_dir=Path.cwd() / "tmp" / "opencv_sr_models")
    raise RuntimeError(
        "Missing SR model file: "
        f"{name}\n"
        "- Put models in `tmp/opencv_sr_models/` (cwd or a parent), OR\n"
        "- Set `OPENCV_SR_MODEL_DIR`, OR\n"
        "- Re-run with `--download-models` (needs network).\n"
        f"Known URL: {MODEL_URLS.get(name, '<unknown>')}"
    )


def _pil_unsharp_autocontrast_x8(img_rgb: Image.Image) -> Image.Image:
    up = img_rgb.resize((img_rgb.width * 8, img_rgb.height * 8), resample=Image.Resampling.LANCZOS)
    up = up.filter(ImageFilter.UnsharpMask(radius=2.0, percent=180, threshold=3))
    up = ImageOps.autocontrast(up, cutoff=1)
    up = ImageEnhance.Contrast(up).enhance(1.12)
    up = ImageEnhance.Sharpness(up).enhance(1.08)
    return up


def _cv2_traditional_clahe_unsharp_x8(cv2, bgr) -> "object":
    h, w = bgr.shape[:2]
    up = cv2.resize(bgr, (w * 8, h * 8), interpolation=cv2.INTER_LANCZOS4)
    lab = cv2.cvtColor(up, cv2.COLOR_BGR2LAB)
    l, a, bb = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(10, 10))
    l2 = clahe.apply(l)
    lab2 = cv2.merge((l2, a, bb))
    clahe_bgr = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)
    blurred = cv2.GaussianBlur(clahe_bgr, (0, 0), sigmaX=1.2, sigmaY=1.2)
    sharpened = cv2.addWeighted(clahe_bgr, 1.8, blurred, -0.8, 0)
    return sharpened


def _cv2_superres_upscale(cv2, bgr, *, model_path: Path, model_name: str, scale: int):
    if not hasattr(cv2, "dnn_superres"):
        raise RuntimeError("OpenCV missing dnn_superres (need opencv-contrib-python).")
    sr = cv2.dnn_superres.DnnSuperResImpl_create()
    sr.readModel(str(model_path))
    sr.setModel(str(model_name).lower(), int(scale))
    return sr.upsample(bgr)


def _pick_font_path(explicit: Optional[str]) -> Optional[Path]:
    if explicit:
        p = Path(explicit).expanduser()
        return p if p.exists() else None

    env_font = os.environ.get("IMAGE_UPSCALE_BEST_FONT")
    if env_font:
        p = Path(env_font).expanduser()
        if p.exists():
            return p

    candidates = [
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Helvetica.ttf",
        "/System/Library/Fonts/Supplemental/Andale Mono.ttf",
    ]
    for c in candidates:
        p = Path(c)
        if p.exists():
            return p
    return None


@dataclass(frozen=True)
class OcrWord:
    left: int
    top: int
    width: int
    height: int
    conf: float
    text: str


def _run_tesseract_tsv(image_path: Path, *, lang: str, psm: int) -> str:
    exe = shutil.which("tesseract")
    if not exe:
        raise RuntimeError("tesseract not found in PATH")
    cmd = [exe, str(image_path), "stdout", "--psm", str(psm), "-l", str(lang), "tsv"]
    proc = subprocess.run(cmd, capture_output=True, text=True)  # noqa: S603
    if proc.returncode != 0:
        raise RuntimeError(
            "tesseract failed:\n"
            f"cmd: {' '.join(cmd)}\n"
            f"stderr: {proc.stderr.strip()}"
        )
    return proc.stdout


def _parse_tesseract_tsv(tsv: str, *, min_conf: float) -> list[OcrWord]:
    lines = [ln for ln in tsv.splitlines() if ln.strip()]
    if not lines:
        return []
    header = lines[0].split("\t")
    idx = {name: i for i, name in enumerate(header)}
    required = {"left", "top", "width", "height", "conf", "text"}
    if not required.issubset(idx):
        return []

    out: list[OcrWord] = []
    for line in lines[1:]:
        cols = line.split("\t")
        if len(cols) != len(header):
            continue
        text = cols[idx["text"]].strip()
        if not text:
            continue
        try:
            conf = float(cols[idx["conf"]])
        except Exception:
            conf = -1.0
        if conf < float(min_conf):
            continue
        try:
            left = int(float(cols[idx["left"]]))
            top = int(float(cols[idx["top"]]))
            width = int(float(cols[idx["width"]]))
            height = int(float(cols[idx["height"]]))
        except Exception:
            continue
        if width <= 0 or height <= 0:
            continue
        out.append(OcrWord(left=left, top=top, width=width, height=height, conf=conf, text=text))
    return out


def _mean_luma(img_rgb: Image.Image, box: tuple[int, int, int, int]) -> float:
    crop = img_rgb.crop(box).convert("L")
    stat = ImageStat.Stat(crop)
    return float(stat.mean[0]) if stat.mean else 255.0


def _draw_ocr_overlay(
    base_rgb: Image.Image,
    words: Iterable[OcrWord],
    *,
    font_path: Optional[Path],
    min_size: int = 10,
) -> tuple[Image.Image, str]:
    img = base_rgb.copy()
    draw = ImageDraw.Draw(img)

    font_cache: dict[int, ImageFont.FreeTypeFont | ImageFont.ImageFont] = {}

    def get_font(px: int):
        px = max(int(px), int(min_size))
        if px in font_cache:
            return font_cache[px]
        if font_path:
            try:
                font_cache[px] = ImageFont.truetype(str(font_path), size=px)
                return font_cache[px]
            except Exception:
                pass
        font_cache[px] = ImageFont.load_default()
        return font_cache[px]

    svg_parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{img.width}" height="{img.height}" viewBox="0 0 {img.width} {img.height}">',
        "<style>",
        "text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Hiragino Sans GB','Microsoft YaHei','Noto Sans CJK SC',sans-serif;font-weight:650;}",
        "</style>",
    ]

    for w in words:
        box = (w.left, w.top, w.left + w.width, w.top + w.height)
        if box[2] <= box[0] or box[3] <= box[1]:
            continue
        luma = _mean_luma(img, box)
        if luma < 110:
            fill = (250, 250, 250)
            stroke = (10, 10, 10)
            svg_fill = "#fafafa"
            svg_stroke = "#0a0a0a"
        else:
            fill = (10, 10, 10)
            stroke = (250, 250, 250)
            svg_fill = "#0a0a0a"
            svg_stroke = "#fafafa"

        font_size = max(min_size, int(w.height * 0.92))
        font = get_font(font_size)
        stroke_w = max(1, int(font_size * 0.08))

        draw.text(
            (w.left, w.top),
            w.text,
            font=font,
            fill=fill,
            stroke_width=stroke_w,
            stroke_fill=stroke,
        )

        x = w.left
        y = w.top + int(w.height * 0.92)
        svg_parts.append(
            f'<text x="{x}" y="{y}" font-size="{font_size}" fill="{svg_fill}" stroke="{svg_stroke}" stroke-width="{max(1, int(font_size * 0.06))}" paint-order="stroke fill">{html.escape(w.text)}</text>'
        )

    svg_parts.append("</svg>")
    return img, "\n".join(svg_parts) + "\n"


def _write_compare_html(out_path: Path, *, title: str, items: list[dict[str, str]]) -> None:
    # items: {label, src, note, href}
    cards = []
    for it in items:
        label = html.escape(it.get("label", ""))
        src = html.escape(it.get("src", ""))
        note = html.escape(it.get("note", ""))
        href = html.escape(it.get("href", it.get("src", "")))
        cards.append(
            f"""
            <figure class="card">
              <a class="imglink" href="{href}" target="_blank" rel="noreferrer">
                <img src="{src}" alt="{label}" loading="lazy" />
              </a>
              <figcaption>
                <div class="label">{label}</div>
                <div class="note">{note}</div>
              </figcaption>
            </figure>
            """.strip()
        )

    html_text = f"""<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <title>{html.escape(title)}</title>
    <meta name="theme-color" content="#fafafa" />
    <style>
      :root {{
        --black: #0a0a0a;
        --white: #fafafa;
        --gray-100: #f5f5f5;
        --gray-200: #e8e8e8;
        --gray-400: #999;
        --gray-600: #666;
        --gray-800: #333;
        --measure: 1100px;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        background: var(--white);
        color: var(--black);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
          "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;
        line-height: 1.7;
        font-size: 15px;
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }}
      a {{ color: inherit; }}
      img {{ max-width: 100%; height: auto; display: block; }}
      header {{
        position: sticky;
        top: 0;
        z-index: 10;
        background: rgba(250, 250, 250, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid var(--gray-200);
      }}
      .wrap {{
        max-width: var(--measure);
        margin: 0 auto;
        padding: 18px 20px;
      }}
      .title {{
        font-size: 12px;
        letter-spacing: 4px;
        text-transform: uppercase;
        color: var(--gray-600);
        font-weight: 650;
      }}
      .subtitle {{
        margin-top: 8px;
        color: var(--gray-800);
        font-size: 14px;
      }}
      main {{ max-width: var(--measure); margin: 0 auto; padding: 18px 20px 60px; }}
      .grid {{
        display: grid;
        gap: 14px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }}
      @media (max-width: 900px) {{
        .grid {{ grid-template-columns: 1fr; }}
      }}
      .card {{
        border: 1px solid var(--gray-200);
        background: rgba(245, 245, 245, 0.55);
        padding: 12px;
        overflow: hidden;
      }}
      .imglink {{ display: block; border: 0; }}
      figcaption {{
        margin-top: 10px;
        display: grid;
        gap: 4px;
      }}
      .label {{
        font-size: 11px;
        letter-spacing: 3px;
        text-transform: uppercase;
        color: var(--gray-600);
        font-weight: 650;
      }}
      .note {{ font-size: 13px; color: var(--gray-800); }}
      footer {{
        margin-top: 18px;
        padding-top: 14px;
        border-top: 1px solid var(--gray-200);
        color: var(--gray-600);
        font-size: 12px;
      }}
    </style>
  </head>
  <body>
    <header>
      <div class="wrap">
        <div class="title">{html.escape(title)}</div>
        <div class="subtitle">点击图片可在新标签页打开原图（便于放大对比）。</div>
      </div>
    </header>
    <main>
      <div class="grid">
        {"".join(cards)}
      </div>
      <footer>Generated by image-upscale-best · {html.escape(dt.datetime.now().isoformat(timespec="seconds"))}</footer>
    </main>
  </body>
</html>
"""
    out_path.write_text(html_text, encoding="utf-8")


def _r2_put_object(
    file_path: Path,
    *,
    account_id: str,
    api_token: str,
    bucket: str,
    key: str,
    public_base: str,
) -> str:
    data = file_path.read_bytes()
    url = (
        "https://api.cloudflare.com/client/v4/accounts/"
        f"{urllib.parse.quote(account_id)}/r2/buckets/{urllib.parse.quote(bucket)}/objects/{urllib.parse.quote(key)}"
    )
    req = urllib.request.Request(  # noqa: S310
        url,
        data=data,
        method="PUT",
        headers={
            "Authorization": f"Bearer {api_token}",
            "Content-Type": _guess_content_type(file_path),
        },
    )
    with urllib.request.urlopen(req) as resp:  # noqa: S310
        if getattr(resp, "status", 200) >= 300:
            raise RuntimeError(f"R2 upload failed: {file_path} ({getattr(resp, 'status', '?')})")

    if not public_base:
        return ""
    return f"{public_base.rstrip('/')}/{key}"


def _write_r2_meta(file_path: Path, *, url: str, bucket: str, key: str) -> None:
    meta_path = file_path.with_suffix(".json")
    existing = {}
    try:
        existing = json.loads(meta_path.read_text(encoding="utf-8"))
    except Exception:
        existing = {}

    meta = {
        **existing,
        "url": url or existing.get("url", ""),
        "r2Bucket": bucket,
        "r2Key": key,
        "source": existing.get("source", "r2-upload"),
        "updatedAt": dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z"),
    }
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")


def _upload_to_r2(files: list[Path], *, prefix: str) -> dict[str, str]:
    _auto_load_r2_env()

    account_id = os.environ.get("CLOUDFLARE_ACCOUNT_ID", "").strip()
    api_token = os.environ.get("CLOUDFLARE_API_TOKEN", "").strip()
    bucket = (
        os.environ.get("R2_BUCKET")
        or os.environ.get("R2_BUCKET_NAME")
        or os.environ.get("BUCKET")
        or ""
    ).strip()
    public_base = (os.environ.get("R2_PUBLIC_BASE_URL") or os.environ.get("PUBLIC_URL") or "").strip()

    if not account_id or not api_token or not bucket:
        raise RuntimeError(
            "Missing R2 env vars. Need at least: CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN / R2_BUCKET\n"
            "Optional: R2_PUBLIC_BASE_URL (to print full public URLs)\n"
            "Tip: set R2_ENV_FILE or run inside your repo that contains an .env file."
        )

    out: dict[str, str] = {}
    prefix = prefix.strip().strip("/")
    for f in files:
        key = f"{prefix}/{f.name}" if prefix else f.name
        _eprint(f"Uploading to R2: {f} -> {bucket}/{key}")
        url = _r2_put_object(
            f, account_id=account_id, api_token=api_token, bucket=bucket, key=key, public_base=public_base
        )
        _write_r2_meta(f, url=url, bucket=bucket, key=key)
        out[f.name] = url
        if url:
            _eprint("Uploaded. Public URL:", url)
        else:
            _eprint("Uploaded. (No public URL; set R2_PUBLIC_BASE_URL)")
    return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Local-first upscale + clarity pipeline (EDSR/FSRCNN + OCR overlay).")
    ap.add_argument("--in", dest="input_path", required=True, help="Input image path")
    ap.add_argument(
        "--mode",
        default="best-text",
        choices=["best-text", "quality", "fast", "traditional"],
        help="best-text: EDSR×4→×2 + OCR overlay; quality: EDSR×4; fast: FSRCNN×4; traditional: CLAHE+Unsharp×8",
    )
    ap.add_argument("--out-dir", default="tmp/image-upscale-best", help="Output directory root")
    ap.add_argument("--model-dir", default="", help="Optional directory containing SR models (.pb)")
    ap.add_argument("--download-models", action="store_true", help="Download missing models (needs network)")
    ap.add_argument("--font", default="", help="Optional TTF/TTC path for OCR overlay rendering")
    ap.add_argument("--ocr-lang", default="eng", help="Tesseract language (default: eng)")
    ap.add_argument("--ocr-psm", type=int, default=6, help="Tesseract PSM (default: 6)")
    ap.add_argument("--ocr-min-conf", type=float, default=70.0, help="Min OCR confidence (0-100, default: 70)")
    ap.add_argument("--upload-r2", action="store_true", help="Upload outputs to Cloudflare R2 (needs env + network)")
    ap.add_argument("--r2-prefix", default="", help="R2 key prefix, e.g. image-upscale/case/20260123-xxxxxx")
    args = ap.parse_args()

    input_path = Path(args.input_path).expanduser()
    if not input_path.exists():
        _eprint("Input not found:", input_path)
        return 2

    out_root = Path(args.out_dir)
    stamp = _ts()
    out_dir = out_root / stamp
    _safe_mkdir(out_dir)

    # Normalize input to stable RGB PNG.
    src = Image.open(input_path)
    src.load()
    rgb = _flatten_to_rgb(src)
    original_path = out_dir / "original.png"
    rgb.save(original_path, format="PNG", optimize=True)

    items_local: list[dict[str, str]] = [
        {"label": "Original", "src": "original.png", "note": f"{rgb.width}×{rgb.height}", "href": "original.png"}
    ]

    cv2 = _try_import_cv2()
    model_dir = Path(args.model_dir).expanduser() if str(args.model_dir).strip() else None

    # Traditional baseline.
    traditional_path = out_dir / "traditional_x8.png"
    if cv2 is not None:
        bgr = cv2.imread(str(original_path))
        if bgr is not None:
            trad = _cv2_traditional_clahe_unsharp_x8(cv2, bgr)
            cv2.imwrite(str(traditional_path), trad)
        else:
            _eprint("OpenCV failed to read image; fallback to PIL traditional.")
            _pil_unsharp_autocontrast_x8(rgb).save(traditional_path, format="PNG", optimize=True)
    else:
        _pil_unsharp_autocontrast_x8(rgb).save(traditional_path, format="PNG", optimize=True)
    if traditional_path.exists():
        items_local.append(
            {
                "label": "Traditional CLAHE+Unsharp ×8",
                "src": traditional_path.name,
                "note": "Fast baseline (no hallucinated detail)",
                "href": traditional_path.name,
            }
        )

    ai_edsr_x4_path = out_dir / "ai_edsr_x4.png"
    ai_fsrcnn_x4_path = out_dir / "ai_fsrcnn_x4.png"
    ai_pipeline_x8_path = out_dir / "ai_pipeline_x8.png"

    wants_ai = args.mode in ("best-text", "quality", "fast")
    wants_edsr = args.mode in ("best-text", "quality")
    wants_fsrcnn = args.mode in ("best-text", "fast")

    if wants_ai:
        if cv2 is None:
            raise RuntimeError("OpenCV (cv2) not available. Install opencv-contrib-python or use a Python env that has it.")
        if not hasattr(cv2, "dnn_superres"):
            raise RuntimeError("cv2.dnn_superres missing. Install opencv-contrib-python (not opencv-python).")

        bgr = cv2.imread(str(original_path))
        if bgr is None:
            raise RuntimeError("OpenCV failed to read the normalized PNG.")

        if wants_fsrcnn:
            fsrcnn_x4 = _require_model("FSRCNN_x4.pb", Path.cwd(), model_dir=model_dir, download=args.download_models)
            out_fsrcnn = _cv2_superres_upscale(cv2, bgr, model_path=fsrcnn_x4, model_name="fsrcnn", scale=4)
            cv2.imwrite(str(ai_fsrcnn_x4_path), out_fsrcnn)
            items_local.append(
                {"label": "AI Super-Resolution FSRCNN ×4", "src": ai_fsrcnn_x4_path.name, "note": "Fast / low memory", "href": ai_fsrcnn_x4_path.name}
            )

        if wants_edsr:
            edsr_x4 = _require_model("EDSR_x4.pb", Path.cwd(), model_dir=model_dir, download=args.download_models)
            out_edsr = _cv2_superres_upscale(cv2, bgr, model_path=edsr_x4, model_name="edsr", scale=4)
            cv2.imwrite(str(ai_edsr_x4_path), out_edsr)
            items_local.append(
                {"label": "AI Super-Resolution EDSR ×4", "src": ai_edsr_x4_path.name, "note": "Best quality (CPU, heavy RAM)", "href": ai_edsr_x4_path.name}
            )

        if args.mode == "best-text":
            # Preferred: FSRCNN×2 on top of EDSR×4 (×8).
            if not ai_edsr_x4_path.exists():
                raise RuntimeError("best-text requires EDSR×4 output, but it was not produced.")
            edsr_bgr = cv2.imread(str(ai_edsr_x4_path))
            if edsr_bgr is None:
                raise RuntimeError("OpenCV failed to read ai_edsr_x4.png")

            x2_model = _find_model_file("FSRCNN_x2.pb", Path.cwd(), explicit_dir=model_dir)
            if x2_model is None and args.download_models:
                x2_model = _download_model("FSRCNN_x2.pb", dest_dir=Path.cwd() / "tmp" / "opencv_sr_models")

            if x2_model is not None:
                out_x8 = _cv2_superres_upscale(cv2, edsr_bgr, model_path=x2_model, model_name="fsrcnn", scale=2)
            else:
                _eprint("FSRCNN_x2.pb not found; fallback to Lanczos ×2 for the last step.")
                h4, w4 = edsr_bgr.shape[:2]
                out_x8 = cv2.resize(edsr_bgr, (w4 * 2, h4 * 2), interpolation=cv2.INTER_LANCZOS4)
            cv2.imwrite(str(ai_pipeline_x8_path), out_x8)
            items_local.append(
                {"label": "AI Pipeline ×8 (EDSR×4 → ×2)", "src": ai_pipeline_x8_path.name, "note": "Bigger base for OCR", "href": ai_pipeline_x8_path.name}
            )

    # OCR overlay (only in best-text mode).
    ocr_png = out_dir / "ocr_overlay_x8.png"
    ocr_svg = out_dir / "ocr_overlay_x8_text.svg"
    if args.mode == "best-text":
        ocr_source = None
        for candidate in [ai_pipeline_x8_path, ai_edsr_x4_path, ai_fsrcnn_x4_path, traditional_path]:
            if candidate.exists():
                ocr_source = candidate
                break

        if ocr_source is None:
            _eprint("OCR skipped: no source image produced.")
        elif not shutil.which("tesseract"):
            _eprint("OCR skipped: tesseract not found in PATH.")
        else:
            try:
                tsv = _run_tesseract_tsv(ocr_source, lang=args.ocr_lang, psm=args.ocr_psm)
                words = _parse_tesseract_tsv(tsv, min_conf=args.ocr_min_conf)
                if not words:
                    _eprint("OCR produced no words above confidence threshold; skipping overlay.")
                else:
                    base = Image.open(ocr_source).convert("RGB")
                    font_path = _pick_font_path(args.font.strip() or None)
                    overlay_img, overlay_svg = _draw_ocr_overlay(base, words, font_path=font_path)
                    overlay_img.save(ocr_png, format="PNG", optimize=True)
                    ocr_svg.write_text(overlay_svg, encoding="utf-8")
                    items_local.append(
                        {"label": "OCR Text Overlay ×8", "src": ocr_png.name, "note": "Best readability for small text", "href": ocr_png.name}
                    )
            except Exception as e:
                _eprint("OCR overlay failed:", str(e))

    # Local compare page.
    compare_html = out_dir / "compare.html"
    _write_compare_html(compare_html, title=f"Image Upscale Best · {stamp}", items=items_local)

    # Optional upload to R2.
    compare_r2_html = out_dir / "compare.r2.html"
    uploaded_urls: dict[str, str] = {}
    if args.upload_r2:
        if not args.r2_prefix.strip():
            raise RuntimeError("--upload-r2 requires --r2-prefix (for deterministic keys).")
        upload_files = [out_dir / it["src"] for it in items_local if (out_dir / it["src"]).exists()]
        # Also upload the SVG text layer if present.
        if ocr_svg.exists():
            upload_files.append(ocr_svg)
        # Upload compare.html (optional) for sharing.
        upload_files.append(compare_html)
        uploaded_urls = _upload_to_r2(upload_files, prefix=args.r2_prefix.strip())

        items_r2 = []
        for it in items_local:
            name = it["src"]
            url = uploaded_urls.get(name, "")
            if not url:
                # Fall back to local relative paths in case public base is not set.
                url = name
            items_r2.append({**it, "src": url, "href": url})
        # Compare page itself: link to uploaded compare.html if present.
        _write_compare_html(compare_r2_html, title=f"Image Upscale Best (R2) · {stamp}", items=items_r2)

    print("OUT_DIR=", out_dir)
    print("COMPARE_HTML=", compare_html)
    if uploaded_urls:
        print("R2_PREFIX=", args.r2_prefix.strip())
        if "compare.html" in uploaded_urls:
            print("COMPARE_R2_URL=", uploaded_urls["compare.html"])
        print("COMPARE_R2_HTML=", compare_r2_html)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())


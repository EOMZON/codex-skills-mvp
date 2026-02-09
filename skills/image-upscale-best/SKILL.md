---
name: image-upscale-best
description: "Local-first (free) image clarity pipeline to make blurry images clearer and higher-resolution: traditional enhancement, OpenCV DNN super-resolution (EDSR/FSRCNN), optional OCR text overlay for screenshots/small text, optional Cloudflare R2 upload, and an HTML compare page. Use when user asks to “变清晰/高清/提高分辨率/放大不糊/超分/锐化” a photo or screenshot."
---

# Image Upscale Best

## Quick Decision

- Screenshot / 信息图 / 小字：用 `--mode best-text`（超分放大 + OCR 重绘文字）
- 真实照片：用 `--mode quality`（EDSR×4）或 `--mode fast`（FSRCNN×4）

## Run

```bash
python3 ~/.codex/skills/image-upscale-best/scripts/upscale_best.py --in "/path/to/image.png" --mode best-text
```

常用模式：

```bash
python3 ~/.codex/skills/image-upscale-best/scripts/upscale_best.py --in "./input.png" --mode quality
python3 ~/.codex/skills/image-upscale-best/scripts/upscale_best.py --in "./input.png" --mode fast
python3 ~/.codex/skills/image-upscale-best/scripts/upscale_best.py --in "./input.png" --mode traditional
```

可选：自动上传 R2 + 生成 `compare.r2.html`：

```bash
python3 ~/.codex/skills/image-upscale-best/scripts/upscale_best.py \
  --in "./input.png" \
  --mode best-text \
  --upload-r2 \
  --r2-prefix "image-upscale/mycase/20260123-xxxxxx"
```

## Outputs

默认输出到：`tmp/image-upscale-best/<timestamp>/`

- `original.png`
- `traditional_x8.png`
- `ai_fsrcnn_x4.png`
- `ai_edsr_x4.png`
- `ai_pipeline_x8.png`
- `ocr_overlay_x8.png` / `ocr_overlay_x8_text.svg`（若本机有 `tesseract`）
- `compare.html`（本地对比页）
- `compare.r2.html`（若上传 R2）

## Requirements (Auto-detected)

- OpenCV（Python `cv2` + `dnn_superres`）：用于 EDSR/FSRCNN 超分；缺失时会自动降级或报错。
- `tesseract` CLI：用于 OCR；缺失时跳过 OCR overlay。
- EDSR/FSRCNN 模型文件：优先从 `tmp/opencv_sr_models/`（当前目录或父目录）查找；也可设置 `OPENCV_SR_MODEL_DIR`。

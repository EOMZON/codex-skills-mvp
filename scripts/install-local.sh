#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
src="$repo_root/skills"

dest="${1:-/tmp/codex-skills-mvp/.codex/skills}"
if [[ "$dest" == "~"* ]]; then
  dest="${dest/#\~/$HOME}"
fi

if [[ ! -d "$src" ]]; then
  echo "ERROR: skills directory not found: $src" >&2
  exit 1
fi

mkdir -p "$dest"
cp -R "$src/." "$dest/"

echo "Installed Codex skills to: $dest"


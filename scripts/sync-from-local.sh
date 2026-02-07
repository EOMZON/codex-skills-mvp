#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
dest_root="$repo_root/skills"

src_root="${CODEX_SKILLS_SRC:-${CODEX_HOME:-$HOME/.codex}/skills}"

usage() {
  cat <<'EOF' >&2
Usage:
  sync-from-local.sh <skill_name> [skill_name...]

Reads from:
  $CODEX_SKILLS_SRC  (preferred)
  or $CODEX_HOME/skills
  or ~/.codex/skills

Examples:
  ./scripts/sync-from-local.sh best-minds
  CODEX_SKILLS_SRC="$HOME/.codex/skills" ./scripts/sync-from-local.sh best-minds github-ops
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

if [[ ! -d "$src_root" ]]; then
  echo "ERROR: source skills directory not found: $src_root" >&2
  exit 2
fi

mkdir -p "$dest_root"

for skill in "$@"; do
  src="$src_root/$skill"
  dest="$dest_root/$skill"

  if [[ ! -d "$src" ]]; then
    echo "ERROR: missing skill directory: $src" >&2
    exit 3
  fi

  rm -rf "$dest"
  mkdir -p "$dest"

  if command -v rsync >/dev/null 2>&1; then
    rsync -a --delete \
      --exclude ".DS_Store" \
      --exclude "__pycache__" \
      "$src/" "$dest/"
  else
    cp -R "$src/." "$dest/"
  fi

  echo "Synced skill: $skill"
done


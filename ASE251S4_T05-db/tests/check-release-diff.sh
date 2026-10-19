#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

base="${1:-}"
[[ -n "$base" ]] || { printf 'Uso: %s <commit-base>\n' "$0" >&2; exit 2; }
git cat-file -e "${base}^{commit}" 2>/dev/null || { printf 'No existe el commit base %s.\n' "$base" >&2; exit 2; }

violations="$(git diff --name-status "$base" HEAD -- db/*/changes/ | awk '$1 != "A" {print}')"
if [[ -n "$violations" ]]; then
  printf 'Los changesets publicados son inmutables; crea el siguiente VNNN:\n%s\n' "$violations" >&2
  exit 1
fi

./demo/inspect-changes.sh >/dev/null
printf '✓ Changesets anteriores intactos; las adiciones conservan secuencia y paridad.\n'

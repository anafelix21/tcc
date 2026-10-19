#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
output="${1:-check/src/main/resources/release-manifest.json}"
mkdir -p "$(dirname "$output")"
temporary="${output}.tmp"

emit_engine() {
  local engine="$1" extension="$2" master="db/$1/changelog.xml" first=1 file path id author
  while IFS= read -r file; do
    path="db/$engine/changes/$file"
    id="${file%%__*}"
    if [[ "$extension" == sql ]]; then
      author="$(sed -n 's/^--changeset \([^:]*\):.*/\1/p' "$path" | head -1)"
    else
      author="$(sed -n 's/.*<changeSet id="[^"]*" author="\([^"]*\)".*/\1/p' "$path" | head -1)"
    fi
    [[ -n "$author" ]] || { printf 'No se pudo leer autor en %s\n' "$path" >&2; exit 1; }
    (( first )) || printf ',\n'
    printf '      {"id":"%s","author":"%s","file":"%s"}' "$id" "$author" "$path"
    first=0
  done < <(sed -n 's/.*file="changes\/\([^"]*\)".*/\1/p' "$master")
}

{
  printf '{\n  "engines": {\n    "postgresql": [\n'
  emit_engine postgresql sql
  printf '\n    ],\n    "mongodb": [\n'
  emit_engine mongodb xml
  printf '\n    ]\n  }\n}\n'
} > "$temporary"
mv "$temporary" "$output"
printf '✓ Manifiesto generado desde los includes: %s\n' "$output"

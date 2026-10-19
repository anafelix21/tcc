#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

inspect_engine() {
  local engine="$1" extension="$2" master="db/$1/changelog.xml"
  local includes actual file id expected=1 count=0
  includes="$(sed -n 's/.*file="changes\/\([^"]*\)".*/\1/p' "$master")"
  [[ -n "$includes" ]] || fail "$master no incluye cambios."

  while IFS= read -r file; do
    [[ "$file" =~ ^V[0-9]{3}__[a-z0-9_]+\.${extension}$ ]] || fail "Nombre inválido: $file"
    [[ -f "db/$engine/changes/$file" ]] || fail "$master incluye un archivo inexistente: $file"
    id="${file%%__*}"
    [[ "$id" == "V$(printf '%03d' "$expected")" ]] || fail "$engine esperaba V$(printf '%03d' "$expected") y encontró $id."
    if [[ "$extension" == sql ]]; then
      grep -q '^--liquibase formatted sql logicalFilePath:' "db/$engine/changes/$file" || fail "$file no es formatted SQL."
      grep -q "^--changeset [a-zA-Z0-9._-]*:${id}$" "db/$engine/changes/$file" || fail "$file no declara changeset $id."
      grep -q '^--rollback ' "db/$engine/changes/$file" || fail "$file no declara rollback."
    else
      grep -q "<changeSet id=\"$id\"" "db/$engine/changes/$file" || fail "$file no declara changeset $id."
      grep -q '<rollback>' "db/$engine/changes/$file" || fail "$file no declara rollback."
    fi
    expected=$((expected + 1)); count=$((count + 1))
  done <<< "$includes"

  actual="$(find "db/$engine/changes" -maxdepth 1 -type f -name "*.${extension}" -exec basename {} \; | sort)"
  [[ "$includes" == "$actual" ]] || fail "$engine tiene archivos huérfanos o includes fuera de orden."
  printf '%s' "$count"
}

postgres_count="$(inspect_engine postgresql sql)"
mongo_count="$(inspect_engine mongodb xml)"
[[ "$postgres_count" == "$mongo_count" ]] || fail "Los motores difieren: PostgreSQL=$postgres_count, MongoDB=$mongo_count."

printf '    Contrato esperado por motor: V%03d\n' "$postgres_count"
printf '    PostgreSQL: %s cambios en SQL\n' "$postgres_count"
printf '    MongoDB:    %s cambios en XML Community\n' "$mongo_count"
ok "Secuencia, includes, identidades y rollback están alineados."

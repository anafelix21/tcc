#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

temporary="$(mktemp -d "${TMPDIR:-/tmp}/block2-conflict.XXXXXX")"
trap 'rm -rf "$temporary"' EXIT

pause_conflict() {
  printf '\n    \033[2mPresiona Enter para continuar...\033[0m '
  read -r _
}

copy_lab() {
  local destination="$1"
  mkdir -p "$destination"
  cp -R db demo "$destination/"
}

next_version() {
  local root="$1" file number
  file="$(find "$root/db/postgresql/changes" -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
  number="${file#V}"; number="${number%%__*}"
  printf 'V%03d' "$((10#$number + 1))"
}

step 1 "Dos equipos parten exactamente del mismo contrato de Agro Pacayales S.A.C."
why "Ambos calculan el siguiente número local; Git no coordina números entre ramas todavía."
copy_lab "$temporary/equipo-a"
copy_lab "$temporary/equipo-b"
collision_version="$(next_version "$temporary/equipo-a")"
pause_conflict

step 2 "Cada equipo crea una capacidad distinta en su propia rama."
command_log "equipo-a: ./demo/new-change.sh telemetria equipo-a"
(cd "$temporary/equipo-a" && ./demo/new-change.sh telemetria equipo-a >/dev/null)
command_log "equipo-b: ./demo/new-change.sh despacho equipo-b"
(cd "$temporary/equipo-b" && ./demo/new-change.sh despacho equipo-b >/dev/null)
find "$temporary/equipo-a/db" "$temporary/equipo-b/db" -type f -name "${collision_version}__*" \
  | sort | sed "s|$temporary/|      |"
warn "Las dos ramas eligieron el mismo VNNN. El conflicto existe aunque Git logre mezclar parte del XML."
pause_conflict

step 3 "Integramos primero A y recalculamos B sobre el nuevo estado."
why "No se renumera un changeset ya publicado; se actualiza la rama pendiente antes del merge."
copy_lab "$temporary/integracion"
(cd "$temporary/integracion" && ./demo/new-change.sh telemetria equipo-a >/dev/null)
(cd "$temporary/integracion" && ./demo/new-change.sh despacho equipo-b >/dev/null)
(cd "$temporary/integracion" && ./demo/inspect-changes.sh)
resolved_version="V$(printf '%03d' "$((10#${collision_version#V} + 1))")"
find "$temporary/integracion/db" -type f \( -name "${collision_version}__*" -o -name "${resolved_version}__*" \) \
  | sort | sed "s|$temporary/integracion/|      |"
ok "A conserva su número ($collision_version) y B toma el siguiente ($resolved_version). La simulación no modificó Git ni las bases cloud."

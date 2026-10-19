#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

action="${1:-plan}"
target="${2:-V004}"
[[ "$target" =~ ^V[0-9]{3}$ ]] || fail "Objetivo inválido; usa V004."

latest_file="$(find db/postgresql/changes -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
latest="${latest_file%%__*}"
target_number=$((10#${target#V}))
latest_number=$((10#${latest#V}))
(( target_number >= 1 && target_number <= latest_number )) || fail "$target no existe en el contrato V001..$latest."
count=$((latest_number - target_number))

plan() {
  step PLAN "Objetivo $target; contrato local $latest; se revertirán $count changeset(s) por motor."
  why "Usamos el checkout actual porque contiene los bloques rollback de las versiones posteriores a $target."
  [[ "$count" -gt 0 ]] || warn "Ya estás en $target según el contrato local; crea y aplica V006 para demostrar una reversión."
}

rollback_cloud() {
  (( count > 0 )) || fail "No hay versiones locales posteriores a $target."
  plan
  step PREVIO "Verificamos pendientes e historial real antes de revertir."
  "$SCRIPT_DIR/lab.sh" status all
  "$SCRIPT_DIR/lab.sh" history all
  warn "Rollback puede eliminar tablas, colecciones y datos. PostgreSQL y MongoDB se revierten en secuencia."
  printf '\nEscribe ROLLBACK %s para continuar: ' "$target"
  read -r confirmation
  [[ "$confirmation" == "ROLLBACK $target" ]] || fail "Rollback cancelado."
  for engine in postgresql mongodb; do
    step "$engine" "Liquibase ejecuta rollback-count --count=$count."
    command_log "docker compose --env-file .env run --rm --no-deps -T $engine rollback-count --count=$count"
    docker compose --env-file .env run --rm --no-deps -T "$engine" rollback-count "--count=$count" </dev/null
  done
  ok "Rollback solicitado hasta $target. Ejecuta evidence para revisar el resultado."
}

evidence() {
  step EVIDENCIA "Liquibase debe mostrar las versiones posteriores como pendientes."
  "$SCRIPT_DIR/lab.sh" status all
  "$SCRIPT_DIR/lab.sh" history all
}

restore() {
  step RESTAURAR "Volvemos a aplicar los changesets pendientes del mismo repositorio."
  why "El rollback cambia el estado cloud; no borra el historial de Git ni crea otra versión."
  "$SCRIPT_DIR/lab.sh" apply all
}

case "$action" in
  plan) plan ;;
  apply) rollback_cloud ;;
  evidence) evidence ;;
  restore) restore ;;
  *) fail "Usa: $0 {plan|apply|evidence|restore} [V004]" ;;
esac

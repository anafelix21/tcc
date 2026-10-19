#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

step() { printf '\n\033[1;36m[%s]\033[0m %s\n' "$1" "$2"; }
ok() { printf '    \033[1;32m✓ %s\033[0m\n' "$1"; }
warn() { printf '    \033[1;33m! %s\033[0m\n' "$1"; }
fail() { printf '    \033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

ENV_FILE="${ROOT_DIR}/.env"
MONGO_URL="${MONGODB_URL:-}"

if [[ -z "$MONGO_URL" && -f "$ENV_FILE" ]]; then
  MONGO_URL="$(sed -n 's/^MONGODB_URL=//p' "$ENV_FILE" | tail -1)"
fi

step INICIO "Ejecutando suite de transacciones ACID en MongoDB 8.0 (Agro Pacayales S.A.C.)"

run_mongosh() {
  local script_file="$1"
  if command -v mongosh >/dev/null 2>&1; then
    if [[ -n "$MONGO_URL" && "$MONGO_URL" != *HOST* ]]; then
      mongosh "$MONGO_URL" "$script_file"
    else
      mongosh --quiet "$script_file"
    fi
  elif docker ps 2>/dev/null | grep -q "agro-mongo-test"; then
    docker exec -i agro-mongo-test mongosh --quiet < "$script_file"
  elif docker compose version >/dev/null 2>&1; then
    warn "mongosh local no detectado; ejecutando en contenedor Docker de MongoDB..."
    docker compose exec -T mongodb mongosh --quiet < "$script_file"
  else
    fail "Se requiere mongosh instalado localmente o Docker activo con el servicio mongodb."
  fi
}

step CASO-1 "Casuística 1: Despacho de Cosecha de Palto Hass con Descuento Atómico de Stock"
run_mongosh "$SCRIPT_DIR/01_despacho_cosecha_transaccion.js"
ok "Caso 1 finalizado con éxito."

step CASO-2 "Casuística 2: Asignación y Consumo Fitosanitario en Ficha de Campo"
run_mongosh "$SCRIPT_DIR/02_asignacion_insumos_transaccion.js"
ok "Caso 2 finalizado con éxito."

step CASO-3 "Casuística 3: Bloqueos a Nivel de Documento y Detección de WriteConflict"
run_mongosh "$SCRIPT_DIR/03_simulacion_locks_write_conflict.js"
ok "Caso 3 finalizado con éxito."

printf '\n\033[1;32m======================================================================\033[0m\n'
printf '\033[1;32m  Todas las pruebas transaccionales de MongoDB 8.0 concluyeron con éxito.\033[0m\n'
printf '\033[1;32m======================================================================\033[0m\n\n'

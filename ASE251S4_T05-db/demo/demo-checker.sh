#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"
action="${1:-presentation}"
port="$(sed -n 's/^CHECKER_PORT=//p' .env 2>/dev/null | tail -1)"; port="${port:-8080}"
base="http://localhost:$port"

start() {
  need docker; need curl
  "$SCRIPT_DIR/check-env.sh"
  "$SCRIPT_DIR/generate-manifest.sh"
  step CHECK "Construimos el checker WebFlux y lo iniciamos sin permisos DDL."
  why "Lee Git y DATABASECHANGELOG; no contiene Liquibase ni ejecuta update."
  command_log "docker compose --env-file .env --profile checker up -d --build checker"
  docker compose --env-file .env --profile checker up -d --build checker
  for attempt in 1 2 3 4 5 6 7 8 9 10 11 12; do
    curl -fsS "$base/actuator/health" >/dev/null 2>&1 && { ok "Checker disponible en $base"; return; }
    printf '    Esperando WebFlux (%d/12)...\n' "$attempt"; sleep 5
  done
  docker compose --env-file .env logs --tail=80 checker
  fail "El checker no respondió."
}

show() {
  local path="$1" explanation="$2"
  step API "$explanation"
  command_log "curl -s $base$path | python3 -m json.tool"
  curl -fsS "$base$path" | python3 -m json.tool 2>/dev/null || curl -fsS "$base$path"
}

case "$action" in
  start) start ;;
  diagnostics) show /api/diagnostics "Comparamos el manifiesto Git con ambos historiales." ;;
  changes) show /api/changes "Leemos identidad, checksum, orden y fecha aplicados." ;;
  contract) show /api/contract "Comprobamos objetos estructurales mínimos." ;;
  logs) docker compose --env-file .env logs --tail=120 checker ;;
  stop) docker compose --env-file .env --profile checker down ;;
  presentation)
    DEMO_GUIDED=1
    start; pause_demo
    show /api/diagnostics "Primero respondemos si ambos motores están alineados."; pause_demo
    show /api/changes "Después abrimos la evidencia de DATABASECHANGELOG."; pause_demo
    show /api/contract "Finalmente separamos historial de estructura funcional."
    printf '\n    Swagger: %s/swagger-ui.html\n' "$base"
    ;;
  *) fail "Usa: $0 {start|diagnostics|changes|contract|logs|stop|presentation}" ;;
esac

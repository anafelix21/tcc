#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

CURRENT_STAGE="inicio"
CURRENT_ENGINE="ninguno"
trap 'code=$?; debug_context "$code" "$LINENO" "$BASH_COMMAND"; exit "$code"' ERR

ACTION="${1:-help}"
ENGINE="${2:-all}"

usage() {
  cat <<'TXT'
Uso:
  ./demo/lab.sh inspect
  ./demo/lab.sh create <nombre> [autor]
  ./demo/lab.sh build
  ./demo/lab.sh validate [postgresql|mongodb|all]
  ./demo/lab.sh status   [postgresql|mongodb|all]
  ./demo/lab.sh apply    [postgresql|mongodb|all]
  ./demo/lab.sh history  [postgresql|mongodb|all]
  ./demo/lab.sh full
  ./demo/lab.sh presentation [nombre-del-nuevo-cambio]

inspect/create no usan Docker ni credenciales. apply/full piden confirmación.
presentation puede crear el siguiente VNNN y ejecuta el relato completo con pausas.
DEMO_DEBUG=1 agrega contexto técnico cuando ocurre un error; nunca imprime .env.
TXT
}

compose() { docker compose --env-file .env "$@"; }

check_runtime() {
  need docker
  docker compose version >/dev/null 2>&1 || fail "Docker Compose v2 no está disponible."
  docker info >/dev/null 2>&1 || fail "Docker Desktop no está activo."
  "$SCRIPT_DIR/check-env.sh"
}

run_one() {
  local engine="$1"
  shift
  local command="$*"
  CURRENT_ENGINE="$engine"
  CURRENT_STAGE="$command"
  step "$engine" "Liquibase ejecutará '$command' en el destino cloud."
  why "El contenedor es temporal; DATABASECHANGELOG y su lock viven dentro de cada base."
  command_log "docker compose run --rm --no-deps -T $engine $command"
  compose run --rm --no-deps -T "$engine" "$@" </dev/null
  ok "$engine completó '$command'."
}

run_selected() {
  local command="$1"
  shift
  case "$ENGINE" in
    postgresql|mongodb) run_one "$ENGINE" "$command" "$@" ;;
    all) run_one postgresql "$command" "$@"; run_one mongodb "$command" "$@" ;;
    *) fail "Motor inválido: usa postgresql, mongodb o all." ;;
  esac
}

apply_changes() {
  step PREVIO "Primero validamos y mostramos los cambios pendientes."
  CURRENT_STAGE="validación previa"
  run_selected validate
  run_selected status --verbose
  warn "No existe una transacción conjunta entre PostgreSQL y MongoDB. Se aplican en secuencia."
  printf '\nEscribe APLICAR para continuar en cloud: '
  read -r confirmation
  [[ "$confirmation" == APLICAR ]] || fail "Operación cancelada; no se modificó ninguna base."
  run_selected update
  step EVIDENCIA "Consultamos nuevamente los pendientes y el historial."
  run_selected status --verbose
  run_selected history
}

case "$ACTION" in
  help|-h|--help) usage ;;
  inspect)
    CURRENT_STAGE="inspección local"
    step INSPECCIÓN "Revisamos VNNN, includes, identidad y rollback sin conectarnos a cloud."
    why "Encontrar inconsistencias antes de Docker hace el feedback rápido y evita una ejecución parcial."
    command_log "./demo/inspect-changes.sh"
    "$SCRIPT_DIR/inspect-changes.sh" ;;
  create)
    [[ "$ENGINE" != all ]] || fail "Indica un nombre: ./demo/lab.sh create auditoria"
    step CREACIÓN "Calculamos el siguiente VNNN para ambos motores."
    why "Un solo comando genera la misma intención funcional en SQL y MongoDB XML."
    command_log "./demo/new-change.sh $ENGINE ${3:-hugo-fernandez}"
    "$SCRIPT_DIR/new-change.sh" "$ENGINE" "${3:-hugo-fernandez}" ;;
  build)
    CURRENT_STAGE="build del runner"
    check_runtime
    step BUILD "Construimos el runner con Liquibase, drivers y extensión MongoDB."
    why "La misma imagen se usa localmente y puede ejecutarse desde CI sin instalar Liquibase en el host."
    command_log "docker compose build postgresql mongodb"
    compose build postgresql mongodb
    ok "Runner construido." ;;
  validate) check_runtime; run_selected validate ;;
  status) check_runtime; run_selected status --verbose ;;
  apply) check_runtime; apply_changes ;;
  history) check_runtime; run_selected history ;;
  full)
    check_runtime
    "$SCRIPT_DIR/inspect-changes.sh"
    "$0" build
    apply_changes ;;
  presentation)
    DEMO_GUIDED=1
    step DEMO "Iniciando recorrido guiado de versionamiento con Liquibase (Agro Pacayales S.A.C.)."
    why "Cada etapa demuestra una garantía técnica: inspección, construcción, validación, confirmación y evidencia."
    command_log "./demo/inspect-changes.sh"
    "$SCRIPT_DIR/inspect-changes.sh"; pause_demo
    if [[ -n "${2:-}" && "$2" != all ]]; then
      step CREACIÓN "Generando $2 para la demostración en vivo."
      command_log "./demo/new-change.sh $2 ${3:-hugo-fernandez}"
      "$SCRIPT_DIR/new-change.sh" "$2" "${3:-hugo-fernandez}"; pause_demo
    fi
    check_runtime
    step RUNNER "Verificamos imagen runner reutilizable."
    command_log "docker compose build postgresql mongodb"
    compose build postgresql mongodb; pause_demo
    step PENDIENTES "Consultamos el estado previo en cloud."
    run_selected validate
    run_selected status --verbose; pause_demo
    apply_changes
    ok "Presentación concluida con éxito." ;;
  *) fail "Acción desconocida: $ACTION. Usa ./demo/lab.sh help" ;;
esac

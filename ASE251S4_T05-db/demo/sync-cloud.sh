#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"
mode="${1:-local}"

if [[ "$mode" == local ]]; then
  step LOCAL "Sincronización desde tu equipo con el checkout actual (Agro Pacayales S.A.C.)."
  why "Ejecuta preflight, muestra pendientes y exige escribir APLICAR antes de update."
  command_log "./demo/lab.sh apply all"
  exec "$SCRIPT_DIR/lab.sh" apply all
fi

[[ "$mode" == plan || "$mode" == ci ]] || fail "Usa: $0 {local|plan|ci}"
[[ "${GITHUB_ACTIONS:-false}" == true ]] || fail "Los modos plan/ci sólo se ejecutan dentro de GitHub Actions."
if [[ "$mode" == ci ]]; then
  [[ "${CI_APPROVED:-}" == YES ]] || fail "Falta la aprobación CI_APPROVED=YES."
fi
: "${RUNNER_IMAGE:?Falta RUNNER_IMAGE}"
: "${POSTGRES_URL:?Falta POSTGRES_URL}" "${POSTGRES_USERNAME:?Falta POSTGRES_USERNAME}" "${POSTGRES_PASSWORD:?Falta POSTGRES_PASSWORD}"
: "${MONGODB_URL:?Falta MONGODB_URL}" "${MONGODB_USERNAME:?Falta MONGODB_USERNAME}" "${MONGODB_PASSWORD:?Falta MONGODB_PASSWORD}"

group_start() { printf '::group::%s\n' "$1"; }
group_end() { printf '::endgroup::\n'; }

run_liquibase() {
  local engine="$1" command="$2" url username password
  if [[ "$engine" == postgresql ]]; then
    url="$POSTGRES_URL"; username="$POSTGRES_USERNAME"; password="$POSTGRES_PASSWORD"
  else
    url="$MONGODB_URL"; username="$MONGODB_USERNAME"; password="$MONGODB_PASSWORD"
  fi
  step "$engine" "Liquibase ejecuta: $command"
  command_log "docker run --rm -v \$GITHUB_WORKSPACE/db:/workspace/db:ro [credenciales enmascaradas] $RUNNER_IMAGE $command"
  read -r -a args <<< "$command"
  docker run --rm \
    -v "$GITHUB_WORKSPACE/db:/workspace/db:ro" \
    -e LIQUIBASE_COMMAND_URL="$url" \
    -e LIQUIBASE_COMMAND_USERNAME="$username" \
    -e LIQUIBASE_COMMAND_PASSWORD="$password" \
    -e LIQUIBASE_COMMAND_CHANGELOG_FILE="db/$engine/changelog.xml" \
    "$RUNNER_IMAGE" "${args[@]}"
}

if [[ "$mode" == ci ]]; then
  group_start "0 · Vigencia del plan aprobado"
  command_log "git fetch origin main && comprobar el último commit que modificó db/"
  git fetch --quiet origin main
  latest_contract_sha="$(git log -1 --format=%H origin/main -- db/)"
  [[ "$GITHUB_SHA" == "$latest_contract_sha" ]] || fail "El contrato aprobado quedó obsoleto. Plan: $GITHUB_SHA; último cambio db/: $latest_contract_sha. Reejecuta el workflow vigente."
  ok "El plan corresponde al contrato db/ vigente en main."
  group_end
fi

group_start "1 · Preflight: contrato del commit"
printf 'Commit aprobado: %s\n' "$(git rev-parse HEAD)"
printf 'Runner: %s\n' "$RUNNER_IMAGE"
command_log "./tests/test-lab.sh"
./tests/test-lab.sh
group_end

group_start "2 · Validate: conexión, changelog y checksums"
run_liquibase postgresql validate
run_liquibase mongodb validate
group_end

group_start "3 · Plan: cambios pendientes antes de escribir"
run_liquibase postgresql "status --verbose"
run_liquibase mongodb "status --verbose"
group_end

if [[ "$mode" == plan ]]; then
  ok "Plan remoto terminado. No se ejecutó update ni se modificó el contrato."
  exit 0
fi

group_start "4 · Apply: ejecución secuencial aprobada"
warn "No hay transacción distribuida: PostgreSQL se aplica antes que MongoDB."
run_liquibase postgresql update
run_liquibase mongodb update
group_end

group_start "5 · Evidencia: pendientes e historial final"
run_liquibase postgresql "status --verbose"
run_liquibase mongodb "status --verbose"
run_liquibase postgresql history
run_liquibase mongodb history
group_end

ok "Sincronización cloud terminada para el commit $(git rev-parse --short=8 HEAD)."

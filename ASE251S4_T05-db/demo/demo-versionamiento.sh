#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

CURRENT_STAGE="inicio"
CURRENT_ENGINE="ambos"
trap 'code=$?; debug_context "$code" "$LINENO" "$BASH_COMMAND"; exit "$code"' ERR

phase="${1:-help}"
argument="${2:-}"

latest_contract() {
  local file number
  file="$(find db/postgresql/changes -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
  number="${file#V}"; number="${number%%__*}"
  printf 'V%03d' "$((10#$number))"
}

immutable_tag() {
  local revision date
  revision="$(git log -1 --format=%H -- docker/liquibase 2>/dev/null || echo 'local')"
  [[ -n "$revision" ]] || fail "No existe una revisión publicable del runner."
  date="$(TZ=America/Lima git show -s --format=%cd --date=format-local:'%Y.%m.%d' "$revision" 2>/dev/null || date +'%Y.%m.%d')"
  printf 'runner-v%s-%s' "$date" "${revision:0:8}"
}

pause() {
  printf '\n    \033[2mPresiona Enter cuando termines de explicar esta evidencia...\033[0m '
  read -r _
}

context_phase() {
  CURRENT_STAGE="contexto"
  step FASE-1 "Partimos del contrato aplicado y del historial que vive en cada base."
  why "Antes de crear otra versión debemos demostrar qué conoce Git y qué recuerda Liquibase."
  command_log "./demo/lab.sh inspect"
  "$SCRIPT_DIR/lab.sh" inspect
  pause
  command_log "./demo/lab.sh status all"
  "$SCRIPT_DIR/lab.sh" status all
  pause
  command_log "./demo/lab.sh history all"
  "$SCRIPT_DIR/lab.sh" history all
  ok "Punto de partida explicado: $(latest_contract) aplicado y sin pendientes."
}

create_phase() {
  CURRENT_STAGE="nuevo changeset"
  [[ -n "$argument" ]] || fail "Indica la capacidad: $0 create auditoria"
  step FASE-2 "Creamos automáticamente la siguiente versión en ambos motores."
  why "La secuencia sale del repositorio: después de V005 vendrán V006, V007 sin editar contadores."
  command_log "./demo/lab.sh create $argument"
  "$SCRIPT_DIR/lab.sh" create "$argument"
  contract="$(latest_contract)"
  printf '\n    Archivos de %s:\n' "$contract"
  find db/postgresql/changes db/mongodb/changes -maxdepth 1 -type f -name "${contract}__*" -print | sed 's/^/      - /'
  pause
  command_log "git diff -- db"
  git diff -- db
  ok "$contract está en código, pero todavía no existe en cloud."
}

validate_phase() {
  CURRENT_STAGE="validación previa"
  step FASE-3 "Validamos reglas locales y construimos el mismo runner que usará CI."
  why "Un archivo válido en un motor puede seguir rompiendo orden, paridad o rollback en el repositorio."
  command_log "./tests/test-lab.sh"
  ./tests/test-lab.sh
  pause
  command_log "./demo/lab.sh build"
  "$SCRIPT_DIR/lab.sh" build
  pause
  step FASE-3 "Liquibase valida conexión y changelogs; luego muestra pendientes."
  command_log "./demo/lab.sh validate all"
  "$SCRIPT_DIR/lab.sh" validate all
  command_log "./demo/lab.sh status all"
  "$SCRIPT_DIR/lab.sh" status all
  ok "$(latest_contract) está listo para revisión y aplicación."
}

apply_phase() {
  CURRENT_STAGE="aplicación cloud"
  step FASE-4 "Aplicamos los cambios pendientes con confirmación explícita."
  why "PostgreSQL y MongoDB avanzan en secuencia y conservan historiales independientes."
  "$SCRIPT_DIR/lab.sh" apply all
}

evidence_phase() {
  CURRENT_STAGE="evidencia"
  step FASE-5 "Comprobamos idempotencia: volver a consultar no crea ni repite cambios."
  command_log "./demo/lab.sh status all"
  "$SCRIPT_DIR/lab.sh" status all
  pause
  command_log "./demo/lab.sh history all"
  "$SCRIPT_DIR/lab.sh" history all
  ok "$(latest_contract) quedó registrado en ambos motores."
}

publish_phase() {
  CURRENT_STAGE="entrega en git"
  step FASE-6 "Mostramos los commits que activarán CI/CD."
  why "El push dispara GitHub Actions: PR valida; merge a main aplica tras aprobación."
  command_log "git status --short"
  git status --short
  printf '\n    Comandos para entregar:\n'
  printf '      git add db/ check/src/main/resources/release-manifest.json\n'
  printf '      git commit -m "feat(database): incorporar $(latest_contract) para %s"\n' "${argument:-capacidad}"
  printf '      git push origin <rama-feature>\n'
  ok "Flujo de entrega listo para revisión por pares (Pull Request)."
}

sync_phase() {
  CURRENT_STAGE="sincronización remota"
  step FASE-7 "Calculamos el tag del runner inmutable y mostramos el flujo de sincronización."
  why "El runner se publica sólo cuando cambia docker/liquibase; cada despliegue reutiliza la imagen aprobada."
  printf '    Tag inmutable del runner: %s\n' "$(immutable_tag)"
  printf '    Comando local: ./demo/sync-cloud.sh local\n'
  printf '    En CI: apply.yml ejecuta validate -> plan -> aprobación -> update -> evidence.\n'
  ok "Sincronización explicada."
}

case "$phase" in
  context) context_phase ;;
  create) create_phase ;;
  validate) validate_phase ;;
  apply) apply_phase ;;
  evidence) evidence_phase ;;
  publish) publish_phase ;;
  sync) sync_phase ;;
  help|*)
    cat <<'TXT'
Uso para la sustentación y video demostrativo:
  ./demo/demo-versionamiento.sh context
  ./demo/demo-versionamiento.sh create <capacidad>
  ./demo/demo-versionamiento.sh validate
  ./demo/demo-versionamiento.sh apply
  ./demo/demo-versionamiento.sh evidence
  ./demo/demo-versionamiento.sh publish
  ./demo/demo-versionamiento.sh sync
TXT
    ;;
esac

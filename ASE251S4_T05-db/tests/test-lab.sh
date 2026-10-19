#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

fail() { printf 'FALLO: %s\n' "$1" >&2; exit 1; }
pass() { printf '✓ %s\n' "$1"; }

bash -n demo/*.sh || fail "Hay sintaxis Bash inválida."
bash -n tests/*.sh || fail "Hay sintaxis Bash inválida en tests."
pass "Sintaxis Bash"

./demo/inspect-changes.sh >/dev/null || fail "El contrato inicial no pasa inspección."
pass "Secuencia versionada alineada entre ambos motores"

manifest_test="$(mktemp "${TMPDIR:-/tmp}/block2-manifest.XXXXXX")"
./demo/generate-manifest.sh "$manifest_test" >/dev/null
cmp -s "$manifest_test" check/src/main/resources/release-manifest.json || fail "El manifiesto del checker está desactualizado."
rm -f "$manifest_test"
pass "Manifiesto del checker derivado de changelogs"

temporary="$(mktemp -d "${TMPDIR:-/tmp}/block2-lab-test.XXXXXX")"
trap 'rm -rf "$temporary"' EXIT
cp -R db demo "$temporary/"
(
  cd "$temporary"
  last="$(find db/postgresql/changes -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
  baseline="${last#V}"; baseline="${baseline%%__*}"
  ./demo/new-change.sh telemetria tester >/dev/null
  ./demo/new-change.sh empaque tester >/dev/null
  ./demo/new-change.sh exportacion tester >/dev/null
  ./demo/new-change.sh senasa tester >/dev/null
  slugs=(telemetria empaque exportacion senasa)
  for index in "${!slugs[@]}"; do
    version="V$(printf '%03d' "$((10#$baseline + index + 1))")"
    [[ -f "db/postgresql/changes/${version}__create_${slugs[$index]}.sql" ]]
    [[ -f "db/mongodb/changes/${version}__create_${slugs[$index]}.xml" ]]
  done
  ./demo/inspect-changes.sh >/dev/null
) || fail "El generador incremental no produjo cuatro versiones consecutivas válidas."
pass "Generación incremental desde la versión vigente"

if (
  cd "$temporary"
  last="$(find db/postgresql/changes -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
  last_number="${last#V}"; last_number="${last_number%%__*}"
  orphan="V$(printf '%03d' "$((10#$last_number + 1))")__orphan.sql"
  cp "db/postgresql/changes/$last" "db/postgresql/changes/$orphan"
  ./demo/inspect-changes.sh >/dev/null 2>&1
); then
  fail "La inspección aceptó un archivo huérfano."
fi
pass "Rechazo de cambios huérfanos"

printf '\nTodas las pruebas locales pasaron.\n'

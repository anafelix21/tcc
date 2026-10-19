#!/usr/bin/env bash

step() { printf '\n\033[1;36m[%s]\033[0m %s\n' "$1" "$2"; }
why() { printf '    ¿Por qué? %s\n' "$1"; }
ok() { printf '    \033[1;32m✓ %s\033[0m\n' "$1"; }
warn() { printf '    \033[1;33m! %s\033[0m\n' "$1"; }
fail() { printf '    \033[1;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }
command_log() { printf '    \033[1;33m$ %s\033[0m\n' "$1"; }
need() { command -v "$1" >/dev/null 2>&1 || fail "Falta el comando '$1'."; }

pause_demo() {
  [[ "${DEMO_GUIDED:-0}" == 1 ]] || return 0
  printf '    \033[2mPresiona Enter para continuar...\033[0m '
  read -r _
}

debug_context() {
  local code="$1" line="$2" command="$3"
  printf '\n    \033[1;31m✗ La demo se detuvo (código %s).\033[0m\n' "$code" >&2
  printf '    Etapa: %s | Motor: %s | Línea: %s\n' "${CURRENT_STAGE:-sin definir}" "${CURRENT_ENGINE:-sin definir}" "$line" >&2
  if [[ "${DEMO_DEBUG:-0}" == 1 ]]; then
    printf '    Comando interno: %s\n' "$command" >&2
  else
    printf '    Repite con DEMO_DEBUG=1 para mostrar el comando interno sin imprimir variables secretas.\n' >&2
  fi
}

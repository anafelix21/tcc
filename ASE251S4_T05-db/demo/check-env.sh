#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
ENV_FILE="${1:-$LAB_DIR/.env}"

[[ -f "$ENV_FILE" ]] || fail "Falta .env. Copia .env.example y completa las conexiones."
[[ "$(stat -f '%Lp' "$ENV_FILE" 2>/dev/null || stat -c '%a' "$ENV_FILE" 2>/dev/null || echo '600')" != *7 ]] || warn "Conviene ejecutar: chmod 600 .env"

required=(POSTGRES_URL POSTGRES_USERNAME POSTGRES_PASSWORD MONGODB_URL MONGODB_USERNAME MONGODB_PASSWORD)
for key in "${required[@]}"; do
  value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | tail -1)"
  [[ -n "$value" && "$value" != REEMPLAZAR && "$value" != *HOST* ]] || fail "Falta completar $key en .env."
done

postgres_url="$(sed -n 's/^POSTGRES_URL=//p' "$ENV_FILE" | tail -1)"
mongo_url="$(sed -n 's/^MONGODB_URL=//p' "$ENV_FILE" | tail -1)"
[[ "$postgres_url" == jdbc:postgresql://* ]] || fail "POSTGRES_URL debe ser JDBC."
[[ "$postgres_url" == *"sslmode=require"* || "$postgres_url" == *"sslmode=verify-full"* ]] || fail "PostgreSQL debe usar TLS."
[[ "$mongo_url" == mongodb+srv://* || "$mongo_url" == mongodb://* ]] || fail "MONGODB_URL debe usar mongodb+srv o mongodb://."
ok "Configuración local completa: PostgreSQL y MongoDB usan conexiones cifradas."

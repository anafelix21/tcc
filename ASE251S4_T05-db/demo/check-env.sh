#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
ENV_FILE="${1:-$LAB_DIR/.env}"

[[ -f "$ENV_FILE" ]] || fail "Falta .env. Copia .env.example y completa las conexiones."
[[ "$(stat -f '%Lp' "$ENV_FILE" 2>/dev/null || stat -c '%a' "$ENV_FILE" 2>/dev/null || echo '600')" != *7 ]] || warn "Conviene ejecutar: chmod 600 .env"

required=(SQLSERVER_URL SQL_USERNAME SQL_PASSWORD MONGODB_URL)
for key in "${required[@]}"; do
  value="$(sed -n "s/^${key}=//p" "$ENV_FILE" | tail -1)"
  [[ -n "$value" && "$value" != REEMPLAZAR && "$value" != *HOST* ]] || fail "Falta completar $key en .env."
done

sqlserver_url="$(sed -n 's/^SQLSERVER_URL=//p' "$ENV_FILE" | tail -1)"
mongo_url="$(sed -n 's/^MONGODB_URL=//p' "$ENV_FILE" | tail -1)"
[[ "$sqlserver_url" == jdbc:sqlserver://* ]] || fail "SQLSERVER_URL debe ser JDBC (jdbc:sqlserver://...)."
[[ "$mongo_url" == mongodb+srv://* || "$mongo_url" == mongodb://* ]] || fail "MONGODB_URL debe usar mongodb+srv o mongodb://."
ok "Configuración local completa: SQL Server y MongoDB usan conexiones válidas."

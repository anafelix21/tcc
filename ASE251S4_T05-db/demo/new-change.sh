#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/_common.sh"
cd "$LAB_DIR"

slug="${1:-}"
author="${2:-hugo-fernandez}"
[[ "$slug" =~ ^[a-z][a-z0-9_]{2,29}$ ]] || fail "Usa 3–30 caracteres en minúsculas, números o _: crear-cambio auditoria"
[[ "$author" =~ ^[a-zA-Z0-9._-]{3,50}$ ]] || fail "Autor inválido."

"$SCRIPT_DIR/inspect-changes.sh" >/dev/null
last="$(find db/postgresql/changes -maxdepth 1 -name 'V[0-9][0-9][0-9]__*.sql' -exec basename {} \; | sort | tail -1)"
number="${last#V}"; number="${number%%__*}"; next=$((10#$number + 1))
(( next <= 999 )) || fail "Se agotó la convención VNNN."
version="V$(printf '%03d' "$next")"
name="create_${slug}"
table="demo_${slug}_v$(printf '%03d' "$next")"
sql_file="db/postgresql/changes/${version}__${name}.sql"
mongo_file="db/mongodb/changes/${version}__${name}.xml"

[[ ! -e "$sql_file" && ! -e "$mongo_file" ]] || fail "$version ya existe."

cat > "$sql_file" <<SQL
--liquibase formatted sql logicalFilePath:$sql_file

--changeset ${author}:${version}
--comment: Crear ${table}; cambio generado para la demostración de Agro Pacayales S.A.C.
CREATE TABLE ${table} (
    id SERIAL PRIMARY KEY,
    note VARCHAR(160) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--rollback DROP TABLE ${table};
SQL

cat > "$mongo_file" <<XML
<?xml version="1.0" encoding="UTF-8"?>
<databaseChangeLog xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:mongodb="http://www.liquibase.org/xml/ns/mongodb"
 xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog https://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-4.33.xsd http://www.liquibase.org/xml/ns/mongodb https://www.liquibase.org/xml/ns/mongodb/liquibase-mongodb-latest.xsd">
  <changeSet id="$version" author="$author">
    <comment>Crear $table; cambio generado para la demostración de Agro Pacayales S.A.C.</comment>
    <mongodb:createCollection collectionName="$table">
      <mongodb:options><![CDATA[{
        "validator": {"\$jsonSchema": {
          "bsonType": "object",
          "required": ["note", "createdAt"],
          "properties": {
            "note": {"bsonType": "string"},
            "createdAt": {"bsonType": "date"}
          }
        }},
        "validationLevel": "strict",
        "validationAction": "error"
      }]]></mongodb:options>
    </mongodb:createCollection>
    <rollback><mongodb:dropCollection collectionName="$table"/></rollback>
  </changeSet>
</databaseChangeLog>
XML

append_include() {
  local master="$1" filename="$2" temporary
  temporary="${master}.tmp"
  awk -v include_line="  <include file=\"changes/${filename}\" relativeToChangelogFile=\"true\"/>" '
    /<\/databaseChangeLog>/ {print include_line}
    {print}
  ' "$master" > "$temporary"
  mv "$temporary" "$master"
}

append_include db/postgresql/changelog.xml "$(basename "$sql_file")"
append_include db/mongodb/changelog.xml "$(basename "$mongo_file")"

"$SCRIPT_DIR/inspect-changes.sh" >/dev/null || fail "El cambio generado no pasó la inspección."
[[ -d check/src/main/resources ]] && "$SCRIPT_DIR/generate-manifest.sh" >/dev/null
printf '%s\n' "$version creado de forma equivalente:" "  - $sql_file" "  - $mongo_file"
ok "Revisa el diff; create no se conecta ni modifica las bases cloud."

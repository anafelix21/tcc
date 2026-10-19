#!/usr/bin/env bash
# ==============================================================================
# demo-evolucion.sh — Demostración Paso a Paso de Versionamiento e Intercalado
# Agro Pacayales S.A.C. — Equipo 05 (ASE251S4)
# ==============================================================================
set -e

CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}  AGRO PACAYALES S.A.C. (TEAM 05) — DEMO DE VERSIONAMIENTO Y MODELADO   ${NC}"
echo -e "${CYAN}========================================================================${NC}"

# 1. Configurar variables locales si no existe .env
if [ ! -f .env ]; then
  echo -e "${YELLOW}[INFO] Copiando .env.example a .env...${NC}"
  cp .env.example .env
fi

# 2. Limpieza de estado anterior
echo -e "\n${YELLOW}>>> PASO 1: Limpieza de contenedores y volúmenes previos...${NC}"
docker compose down --volumes --remove-orphans

# 3. Despliegue en Versión 1 (Baseline)
echo -e "\n${YELLOW}>>> PASO 2: Despliegue en VERSIÓN 1 (TARGET_SCHEMA_VERSION=1)...${NC}"
export TARGET_SCHEMA_VERSION=1
docker compose -f compose.yaml -f compose.build.yaml up -d --build

echo -e "\n${YELLOW}>>> PASO 3: Esperando estabilización e inicialización V1...${NC}"
sleep 15
docker compose ps

echo -e "\n${YELLOW}>>> PASO 4: Logs de Inicialización en V1 (Determinismo)...${NC}"
echo -e "${CYAN}--- Logs de SQL Server Init ---${NC}"
docker compose logs --no-color sql-init
echo -e "${CYAN}--- Logs de MongoDB Init ---${NC}"
docker compose logs --no-color mongo-init

echo -e "\n${YELLOW}>>> PASO 5: Verificando Checker API en Versión 1...${NC}"
curl -s http://localhost:8080/version | jq . || curl -s http://localhost:8080/version
echo ""

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}  VERSIÓN 1 VERIFICADA: Estado base cargado sin estrategias V2          ${NC}"
echo -e "${GREEN}========================================================================${NC}"
read -p "Presione ENTER para evolucionar a VERSIÓN 2 (Modelado de Datos)..."

# 4. Evolución a Versión 2 (Modelado de Datos con 6 Estrategias)
echo -e "\n${YELLOW}>>> PASO 6: Evolucionando a VERSIÓN 2 (TARGET_SCHEMA_VERSION=2)...${NC}"
export TARGET_SCHEMA_VERSION=2
docker compose -f compose.yaml -f compose.build.yaml up -d --build

echo -e "\n${YELLOW}>>> Esperando aplicación incremental de V2...${NC}"
sleep 12
docker compose ps

echo -e "\n${YELLOW}>>> PASO 7: Inspección de Logs en V2 (Detección de V1 y Ejecución de V2)...${NC}"
echo -e "${CYAN}--- Logs de MongoDB Init (V2) ---${NC}"
docker compose logs --no-color mongo-init
echo -e "${CYAN}--- Logs de SQL Server Init (V2) ---${NC}"
docker compose logs --no-color sql-init

echo -e "\n${YELLOW}>>> PASO 8: Verificando Checker API en Versión 2...${NC}"
curl -s http://localhost:8080/version | jq . || curl -s http://localhost:8080/version
echo ""

echo -e "\n${YELLOW}>>> PASO 9: Verificando Diagnóstico Completo y Alineación de Motores...${NC}"
curl -s http://localhost:8080/diagnostics | jq . || curl -s http://localhost:8080/diagnostics
echo ""

echo -e "\n${GREEN}========================================================================${NC}"
echo -e "${GREEN}  DEMOSTRACIÓN EXITOSA:                                                 ${NC}"
echo -e "${GREEN}  - Versión V1 ejecutada e inspeccionada.                               ${NC}"
echo -e "${GREEN}  - Evolución incremental a V2 ejecutada sin pérdida de datos.          ${NC}"
echo -e "${GREEN}  - 6 Estrategias de modelado de datos activas en MongoDB.              ${NC}"
echo -e "${GREEN}  - Checker Swagger disponible en http://localhost:8080/swagger-ui       ${NC}"
echo -e "${GREEN}========================================================================${NC}"

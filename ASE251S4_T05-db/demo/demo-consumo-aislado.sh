#!/usr/bin/env bash
# ==============================================================================
# demo-consumo-aislado.sh — Demostración de Consumo Aislado de Imágenes Publicadas
# Agro Pacayales S.A.C. — Equipo 05
# ==============================================================================
set -e

echo "=== Despliegue de Consumo Aislado (Imágenes Preconstruidas) ==="
docker compose pull
docker compose up -d

echo "=== Esperando disponibilidad de servicios ==="
sleep 15
docker compose ps -a

echo "=== Prueba de endpoints del Checker ==="
curl -i http://localhost:8080/health
curl -i http://localhost:8080/connections

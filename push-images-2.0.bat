@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo   AGROPACAYALES - PUBLICACION DE IMAGENES COMPILADAS (VERSION 2.0)
echo ==============================================================================
echo.

set DOCKER_USER=hugo454

echo [1/3] Iniciando sesion en Docker Hub...
docker login -u %DOCKER_USER%
if %ERRORLEVEL% neq 0 (
    echo.
    echo [X] Error de autenticacion con Docker Hub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [2/3] Subiendo imagenes recien compiladas a Docker Hub:
echo ==============================================================================

echo [+] Subiendo Frontend React (2.0)...
docker push %DOCKER_USER%/agropacayales-frontend:2.0
docker push %DOCKER_USER%/agropacayales-frontend:latest

echo [+] Subiendo Backend 1 WebFlux (2.0)...
docker push %DOCKER_USER%/agropacayales-backend1:2.0
docker push %DOCKER_USER%/agropacayales-backend1:latest

echo [+] Subiendo Backend 2 Analitico (2.0)...
docker push %DOCKER_USER%/agropacayales-backend-analitico:2.0
docker push %DOCKER_USER%/agropacayales-backend-analitico:latest

echo.
echo ==============================================================================
echo [3/3] PUBLICACION COMPLETADA CON EXITO:
echo   1. %DOCKER_USER%/agropacayales-frontend:2.0
echo   2. %DOCKER_USER%/agropacayales-backend1:2.0
echo   3. %DOCKER_USER%/agropacayales-backend-analitico:2.0
echo ==============================================================================
pause

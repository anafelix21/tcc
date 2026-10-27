@echo off
setlocal enabledelayedexpansion

echo ==============================================================================
echo   AGROPACAYALES - CONSTRUCCION Y PUBLICACION AUTOMATIZADA (DOCKER HUB)
echo ==============================================================================
echo.

set DEFAULT_USER=hugo454
set /p DOCKER_USER="Ingresa tu usuario de Docker Hub [Default: %DEFAULT_USER%]: "
if "%DOCKER_USER%"=="" set DOCKER_USER=%DEFAULT_USER%

echo.
echo ==============================================================================
echo [+] Usuario seleccionado: %DOCKER_USER%
echo [+] Verificando sesion de Docker...
echo ==============================================================================
docker login -u %DOCKER_USER%
if %ERRORLEVEL% neq 0 (
    echo [X] Error en autenticacion con Docker Hub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==============================================================================
echo [1/3] Construyendo FRONTEND (React + Vite + TypeScript) -> NodePort 30000
echo ==============================================================================
cd ASE251S3_T05-fe
docker buildx build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-frontend:1.0 --push .
if %ERRORLEVEL% neq 0 (
    echo [X] Error al compilar Frontend.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ==============================================================================
echo [2/3] Construyendo BACKEND 1 (Spring Boot WebFlux Java 21) -> NodePort 30001
echo ==============================================================================
cd ASE251S4_T05-be
docker buildx build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-backend1:1.0 --push .
if %ERRORLEVEL% neq 0 (
    echo [X] Error al compilar Backend 1.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ==============================================================================
echo [3/3] Construyendo BACKEND 2 ANALITICO (Python Flask) -> NodePort 30002
echo ==============================================================================
cd ASE251S4_T05-be-analitico
docker buildx build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-backend-analitico:1.0 --push .
if %ERRORLEVEL% neq 0 (
    echo [X] Error al compilar Backend 2.
    cd ..
    pause
    exit /b %ERRORLEVEL%
)
cd ..

echo.
echo ==============================================================================
echo [OK] LAS 3 IMAGENES HAN SIDO CONSTRUIDAS Y SUBIDAS EXITOSAMENTE A DOCKER HUB:
echo   1. %DOCKER_USER%/agropacayales-frontend:1.0
echo   2. %DOCKER_USER%/agropacayales-backend1:1.0
echo   3. %DOCKER_USER%/agropacayales-backend-analitico:1.0
echo ==============================================================================
pause

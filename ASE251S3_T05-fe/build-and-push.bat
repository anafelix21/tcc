@echo off
echo ========================================================
echo   CONSTRUYENDO Y SUBIENDO FRONTEND (REACT+VITE)
echo ========================================================
echo.

set DOCKER_USER=hugo454
set IMAGE_NAME=agropacayales-frontend
set TAG=2.0

echo [+] Docker Hub User: %DOCKER_USER%
echo [+] Imagen: %DOCKER_USER%/%IMAGE_NAME%:%TAG%
echo [+] Multi-arquitectura: linux/amd64
echo.

docker buildx build --platform linux/amd64 -t %DOCKER_USER%/%IMAGE_NAME%:%TAG% --push .

if %ERRORLEVEL% neq 0 (
    echo.
    echo [X] ERROR: Fallo la construccion o subida a Docker Hub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ========================================================
echo [OK] FRONTEND PUBLICADO CON EXITO:
echo      %DOCKER_USER%/%IMAGE_NAME%:%TAG%
echo ========================================================
pause

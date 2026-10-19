@echo off
echo =========================================================
echo 🚀 CONSTRUYENDO Y SUBIENDO BACKEND ANALITICO A DOCKER HUB
echo =========================================================
echo.

set DOCKER_USER=anafelixmendoza21
set IMAGE_NAME=agropacayales-backend-analitico
set TAG=1.0

echo [+] Construyendo imagen Docker: %DOCKER_USER%/%IMAGE_NAME%:%TAG%...
docker build -t %DOCKER_USER%/%IMAGE_NAME%:%TAG% .

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: Fallo la construccion de la imagen Docker.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] Construccion exitosa. Subiendo a Docker Hub...
docker push %DOCKER_USER%/%IMAGE_NAME%:%TAG%

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo subir la imagen a Docker Hub. Verifica que hayas hecho "docker login".
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =========================================================
echo ✅ IMAGEN PUBLICADA CON EXITO EN DOCKER HUB:
echo %DOCKER_USER%/%IMAGE_NAME%:%TAG%
echo =========================================================
pause

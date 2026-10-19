@echo off
echo ==========================================
echo 🚀 CONSTRUYENDO Y SUBIENDO FRONTEND A DOCKER HUB
echo ==========================================
echo.

set DOCKER_USER=hugo454
set IMAGE_NAME=agropacayales-frontend
set TAG=1.0

echo [+] Iniciando construccion de la imagen Docker...
docker build -t %DOCKER_USER%/%IMAGE_NAME%:%TAG% .

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: Fallo la construccion de la imagen Docker.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [+] Construccion exitosa. Iniciando sesion en Docker Hub...
docker login

echo.
echo [+] Subiendo la imagen a Docker Hub...
docker push %DOCKER_USER%/%IMAGE_NAME%:%TAG%

if %ERRORLEVEL% neq 0 (
    echo.
    echo ❌ ERROR: No se pudo subir la imagen a Docker Hub.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo ==========================================
echo ✅ PROCESO COMPLETADO EXITOSAMENTE
echo Imagen disponible: %DOCKER_USER%/%IMAGE_NAME%:%TAG%
echo ==========================================
pause

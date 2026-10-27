@echo off
setlocal
REM ==============================================================================
REM AGROPACAYALES - Construye y publica en TU Docker Hub las imagenes de los 2 despliegues
REM   Kubernetes: agropacayales-frontend / -backend / -backend-analitico :2.0
REM   Taller:     agropacayales-cc-backend / -cc-backend-analitico     :1.0
REM Uso: doble clic, o en CMD/PowerShell:  imagenes-docker\publicar-imagenes.bat tu_usuario
REM ==============================================================================

set "DOCKER_USER=%~1"
if "%DOCKER_USER%"=="" set /p DOCKER_USER=Usuario de Docker Hub:
if "%DOCKER_USER%"=="" (echo [X] Falta el usuario de Docker Hub. & pause & exit /b 1)

cd /d "%~dp0.."
docker info >nul 2>&1 || (echo [X] Docker no esta corriendo. Abre Docker Desktop. & pause & exit /b 1)

echo == 1/3 Iniciar sesion en Docker Hub como %DOCKER_USER%
docker login -u %DOCKER_USER% || goto :error

echo == 2/3 Construir imagenes (linux/amd64, para EC2)
docker build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-frontend:2.0 ASE251S3_T05-fe || goto :error
docker build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-backend:2.0 ASE251S4_T05-be || goto :error
docker build --platform linux/amd64 -t %DOCKER_USER%/agropacayales-backend-analitico:2.0 ASE251S4_T05-be-analitico || goto :error
REM El taller usa el mismo codigo de los backends con otro nombre (no se reconstruye)
docker tag %DOCKER_USER%/agropacayales-backend:2.0 %DOCKER_USER%/agropacayales-cc-backend:1.0 || goto :error
docker tag %DOCKER_USER%/agropacayales-backend-analitico:2.0 %DOCKER_USER%/agropacayales-cc-backend-analitico:1.0 || goto :error

echo == 3/3 Subir a Docker Hub
for %%I in (agropacayales-frontend:2.0 agropacayales-backend:2.0 agropacayales-backend-analitico:2.0 agropacayales-cc-backend:1.0 agropacayales-cc-backend-analitico:1.0) do (
  docker push %DOCKER_USER%/%%I || goto :error
)

echo.
echo ==============================================================================
echo  LISTO. Imagenes publicadas en https://hub.docker.com/u/%DOCKER_USER%
echo  Para que el despliegue use TUS imagenes, cambia solo esta linea en el user data:
echo     DOCKER_USER="%DOCKER_USER%"
echo    - Kubernetes: despliegue-aws\user-data-universal.sh
echo    - Taller:     despliegue-taller-cloud\user-data-taller.sh
echo  Y en Docker Hub deja los 5 repositorios como "Public".
echo ==============================================================================
pause
exit /b 0

:error
echo.
echo [X] Algo fallo. Revisa el mensaje de arriba (login, Docker Desktop o conexion).
pause
exit /b 1

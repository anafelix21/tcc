@echo off
REM ==============================================================================
REM AgroPacayales - Script de Compilación para Despliegue en Amazon S3
REM Uso: build-s3.bat <IP_PUBLICA_EC2_BACKEND>
REM Ejemplo: build-s3.bat 54.210.85.90
REM ==============================================================================

if "%~1"=="" (
    echo.
    echo [ERROR] Debes proporcionar la IP publica de tu EC2 en AWS donde corren los Backends.
    echo Uso: build-s3.bat ^<IP_PUBLICA_EC2^>
    echo Ejemplo: build-s3.bat 54.210.85.90
    echo.
    exit /b 1
)

set EC2_IP=%~1
echo.
echo ==============================================================================
echo [1/3] Configurando variables de entorno para Amazon S3...
echo   Backend Transaccional: http://%EC2_IP%:30001/api
echo   Backend Analitico:     http://%EC2_IP%:30002/api/v1/analytics
echo ==============================================================================

set VITE_API_URL=http://%EC2_IP%:30001/api
set VITE_ANALYTICS_URL=http://%EC2_IP%:30002/api/v1/analytics

echo.
echo [2/3] Compilando frontend React + Vite para produccion...
cd ASE251S3_T05-fe
call npm run build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Fallo la compilacion del Frontend. Revisa los logs arriba.
    cd ..
    exit /b 1
)

cd ..

echo.
echo ==============================================================================
echo [3/3] COMPILACION EXITOSA PARA AMAZON S3
echo ==============================================================================
echo Los archivos listos para subir a tu Bucket de S3 se encuentran en:
echo   ASE251S3_T05-fe\dist
echo.
echo Pasos siguientes:
echo   1. Abre tu bucket S3 con 'Static website hosting' habilitado.
echo   2. Sube todo el contenido de 'ASE251S3_T05-fe\dist' a la raiz del bucket.
echo   3. Abre tu URL publica de S3: http://^<tu-bucket^>.s3-website-us-east-1.amazonaws.com
echo ==============================================================================

# =============================================================================
#  PROBAR TODO — AgroPacayales Sprint 8
#  Uso (PowerShell, en la carpeta tcc):   .\probar-todo.ps1
#  Opciones:  -SoloPruebas   no levanta servicios (asume que ya están corriendo)
#             -SinUnitarias  omite pytest / mvn test / tsc
# =============================================================================
param([switch]$SoloPruebas, [switch]$SinUnitarias)

$ErrorActionPreference = 'Stop'
$raiz = $PSScriptRoot
$be1 = Join-Path $raiz 'ASE251S4_T05-be'
$be2 = Join-Path $raiz 'ASE251S4_T05-be-analitico'
$movil = Join-Path $raiz 'ASE251S4_T05-mobile'
$py = Join-Path $be2 'venv\Scripts\python.exe'
$resumen = [ordered]@{}

function Titulo($t) { Write-Host "`n=== $t ===" -ForegroundColor Green }
function Resultado($nombre, $ok) {
    $resumen[$nombre] = $ok
    if ($ok) { Write-Host "  OK  $nombre" -ForegroundColor Green } else { Write-Host "  FALLA  $nombre" -ForegroundColor Red }
}
function Esperar($url, $segundos = 150) {
    $limite = (Get-Date).AddSeconds($segundos)
    while ((Get-Date) -lt $limite) {
        try { Invoke-WebRequest $url -UseBasicParsing -TimeoutSec 3 | Out-Null; return $true } catch { Start-Sleep 3 }
    }
    return $false
}
function Maven {
    $mvn = Get-ChildItem "$env:USERPROFILE\.m2\wrapper" -Recurse -Filter mvn.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($mvn) { return $mvn.FullName } else { return 'mvn' }
}

# --- 0. Entorno Python del backend analítico ---------------------------------
if (-not (Test-Path $py)) {
    Titulo 'Creando entorno virtual del backend analítico'
    python -m venv (Join-Path $be2 'venv')
    & $py -m pip install -q -r (Join-Path $be2 'requirements.txt')
}

# --- 1. Pruebas unitarias ----------------------------------------------------
if (-not $SinUnitarias) {
    Titulo '1. Pruebas unitarias'
    Push-Location $be2; & $py -m pytest -q; Resultado 'Backend analítico: pytest' ($LASTEXITCODE -eq 0); Pop-Location
    Push-Location $be1; & (Maven) -q clean test '-Dtest=*ControllerTest,*ServiceTest'; Resultado 'Backend 1: mvn test' ($LASTEXITCODE -eq 0); Pop-Location
    Push-Location $movil
    if (-not (Test-Path 'node_modules')) { npm install --legacy-peer-deps | Out-Null }
    npx tsc --noEmit; Resultado 'App móvil: typecheck TypeScript' ($LASTEXITCODE -eq 0); Pop-Location
}

# --- 2. Servicios ------------------------------------------------------------
if (-not $SoloPruebas) {
    Titulo '2. Levantando SQL Server (Docker) y backends'
    docker compose -f (Join-Path $raiz 'docker-compose.local.yml') up -d
    # Detiene versiones antiguas que ocupan los puertos 8081 / 5000
    docker stop agropacayales-backend-transaccional agropacayales-backend-analitico 2>$null | Out-Null

    if (-not (Esperar 'http://localhost:8081/api-docs' 2)) {
        $env:ANALYTICS_URL = 'http://localhost:5000'
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$be1'; & '$(Maven)' spring-boot:run '-Dspring-boot.run.profiles=cloud'"
    }
    if (-not (Esperar 'http://localhost:5000/health' 2)) {
        Start-Process powershell -ArgumentList '-NoExit', '-Command', "cd '$be2'; `$env:SQL_SERVER='localhost'; & '$py' wsgi.py"
    }
    Resultado 'Backend 1 en http://localhost:8081' (Esperar 'http://localhost:8081/api-docs')
    Resultado 'Backend 2 en http://localhost:5000' (Esperar 'http://localhost:5000/health')
}

# --- 3. Datos de demo + prueba integral --------------------------------------
Titulo '3. Datos de demostración'
& $py (Join-Path $raiz 'scripts\sembrar_demo.py')

Titulo '4. Prueba integral (todos los endpoints)'
& $py (Join-Path $raiz 'scripts\probar_todo.py')
Resultado 'Prueba integral de punta a punta' ($LASTEXITCODE -eq 0)

Titulo 'RESUMEN'
$resumen.GetEnumerator() | ForEach-Object {
    $color = if ($_.Value) { 'Green' } else { 'Red' }
    Write-Host ("  {0,-45} {1}" -f $_.Key, $(if ($_.Value) { 'OK' } else { 'FALLA' })) -ForegroundColor $color
}
Write-Host "`nSwagger BE1:  http://localhost:8081/swagger-ui.html"
Write-Host "Swagger BE2:  http://localhost:5000/apidocs"
Write-Host "Guía Swagger: docs/GUIA_SWAGGER.md"
Write-Host "Dashboard:    http://localhost:5000/dashboard"
Write-Host "App móvil:    cd ASE251S4_T05-mobile; npx expo start   (escanear QR con Expo Go)"

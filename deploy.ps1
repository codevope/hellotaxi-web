# Script de construcción y despliegue de HelloTaxi Web App (PowerShell)

Write-Host "🚀 Construyendo HelloTaxi Web App para Docker..." -ForegroundColor Green

# Verificar que existe el archivo .env
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: No se encontró el archivo .env" -ForegroundColor Red
    Write-Host "Copia .env.example como .env y configura tus variables de Firebase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Variables de entorno encontradas" -ForegroundColor Green

# Construir la imagen Docker
Write-Host "🏗️  Construyendo imagen Docker..." -ForegroundColor Blue

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"

docker build -t hellotaxi-web:latest -t hellotaxi-web:$timestamp .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Imagen Docker construida exitosamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error construyendo la imagen Docker" -ForegroundColor Red
    exit 1
}

# Ejecutar con docker-compose
Write-Host "🚀 Iniciando con Docker Compose..." -ForegroundColor Blue
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ HelloTaxi Web App desplegada!" -ForegroundColor Green
    Write-Host "🌐 Aplicación disponible en: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "🔍 Ver logs: docker-compose logs -f" -ForegroundColor Yellow
    Write-Host "🛑 Detener: docker-compose down" -ForegroundColor Yellow
} else {
    Write-Host "❌ Error iniciando con Docker Compose" -ForegroundColor Red
    exit 1
}
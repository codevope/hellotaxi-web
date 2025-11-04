# HelloTaxi Deployment Script para Windows
# Este script automatiza el despliegue completo con SSL

Write-Host "🚕 HelloTaxi - Iniciando despliegue con SSL..." -ForegroundColor Green

# Verificar que estamos en el directorio correcto
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: Ejecuta este script desde el directorio raíz del proyecto" -ForegroundColor Red
    exit 1
}

# Verificar Docker
try {
    docker --version | Out-Null
    Write-Host "✅ Docker encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker no está instalado o no está en el PATH" -ForegroundColor Red
    exit 1
}

try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose no está instalado" -ForegroundColor Red
    exit 1
}

# Verificar archivo .env
if (!(Test-Path ".env.local") -and !(Test-Path ".env.production")) {
    Write-Host "⚠️  No se encontró archivo .env" -ForegroundColor Yellow
    Write-Host "📄 Copiando ejemplo de variables de entorno..."
    Copy-Item "deployment\env\.env.example" ".env.local"
    Write-Host "✏️  Edita .env.local con tus configuraciones reales antes de continuar" -ForegroundColor Cyan
    Write-Host "📖 Luego ejecuta nuevamente: .\deployment\scripts\deploy.ps1" -ForegroundColor Cyan
    exit 0
}

# Crear directorio para certificados SSL
Write-Host "📁 Creando directorios para certificados SSL..." -ForegroundColor Blue
New-Item -ItemType Directory -Force -Path ".\ssl\certbot\conf" | Out-Null
New-Item -ItemType Directory -Force -Path ".\ssl\certbot\www" | Out-Null
New-Item -ItemType Directory -Force -Path ".\ssl\certbot\logs" | Out-Null

# Construir imagen Docker
Write-Host "🔨 Construyendo imagen Docker..." -ForegroundColor Blue
docker build -t hellotaxi-web .

# Iniciar servicios
Write-Host "🚀 Iniciando servicios..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

Write-Host "⏳ Esperando que los servicios se inicialicen..." -ForegroundColor Yellow
Start-Sleep 30

# Verificar estado de los servicios
Write-Host "🔍 Verificando servicios..." -ForegroundColor Blue
docker-compose -f docker-compose.prod.yml ps

Write-Host "✅ Despliegue completado!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Tu aplicación debería estar disponible en:" -ForegroundColor Cyan
Write-Host "   http://hellotaxi.pe (se redirigirá a HTTPS)" -ForegroundColor White
Write-Host "   https://hellotaxi.pe" -ForegroundColor White
Write-Host ""
Write-Host "📋 Para verificar logs:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml logs -f" -ForegroundColor White
Write-Host ""
Write-Host "🔄 Para actualizar la aplicación:" -ForegroundColor Cyan
Write-Host "   git pull" -ForegroundColor White
Write-Host "   .\deployment\scripts\deploy.ps1" -ForegroundColor White
Write-Host ""
Write-Host "🛠️  Para administración SSL:" -ForegroundColor Cyan
Write-Host "   docker-compose -f docker-compose.prod.yml exec certbot certbot certificates" -ForegroundColor White
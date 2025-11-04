#!/bin/bash

# HelloTaxi Deployment Script
# Este script automatiza el despliegue completo con SSL

set -e

echo "🚕 HelloTaxi - Iniciando despliegue con SSL..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado"
    exit 1
fi

# Verificar archivo .env
if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    echo "⚠️  No se encontró archivo .env"
    echo "📄 Copiando ejemplo de variables de entorno..."
    cp deployment/env/.env.example .env.local
    echo "✏️  Edita .env.local con tus configuraciones reales antes de continuar"
    echo "📖 Luego ejecuta nuevamente: ./deployment/scripts/deploy.sh"
    exit 0
fi

# Crear directorio para certificados SSL
echo "📁 Creando directorios para certificados SSL..."
mkdir -p ./ssl/certbot/conf
mkdir -p ./ssl/certbot/www
mkdir -p ./ssl/certbot/logs

# Construir imagen Docker
echo "🔨 Construyendo imagen Docker..."
docker build -t hellotaxi-web .

# Iniciar servicios
echo "🚀 Iniciando servicios..."
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Esperando que los servicios se inicialicen..."
sleep 30

# Verificar estado de los servicios
echo "🔍 Verificando servicios..."
docker-compose -f docker-compose.prod.yml ps

echo "✅ Despliegue completado!"
echo ""
echo "🌐 Tu aplicación debería estar disponible en:"
echo "   http://hellotaxi.pe (se redirigirá a HTTPS)"
echo "   https://hellotaxi.pe"
echo ""
echo "📋 Para verificar logs:"
echo "   docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🔄 Para actualizar la aplicación:"
echo "   git pull"
echo "   ./deployment/scripts/deploy.sh"
echo ""
echo "🛠️  Para administración SSL:"
echo "   docker-compose -f docker-compose.prod.yml exec certbot certbot certificates"
echo ""
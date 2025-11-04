#!/bin/bash

# Script SSL simplificado para solo hellotaxi.pe (sin www)

set -e

echo "🔒 Configurando SSL para hellotaxi.pe (sin www)..."

# 1. Crear directorios
mkdir -p ssl/conf ssl/www ssl/logs webroot

# 2. Detener servicios
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 3. Iniciar solo la app
docker-compose -f docker-compose.prod.yml up -d hellotaxi-web

# 4. Nginx temporal
docker run -d --name nginx-temp \
  --network hellotaxi-web_hellotaxi-network \
  -p 80:80 \
  -v $(pwd)/deployment/nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/webroot:/var/www/html \
  nginx:alpine

sleep 10

# 5. Generar SSL solo para hellotaxi.pe
echo "🔐 Generando certificados SSL solo para hellotaxi.pe..."
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/webroot:/var/www/html \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email admin@hellotaxi.pe \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  -d hellotaxi.pe

# 6. Verificar certificados
if [ ! -f "ssl/live/hellotaxi.pe/fullchain.pem" ]; then
    echo "❌ Error generando certificados"
    exit 1
fi

# 7. Detener nginx temporal
docker stop nginx-temp && docker rm nginx-temp

# 8. Iniciar todo con SSL
docker-compose -f docker-compose.prod.yml up -d

echo "✅ SSL configurado para hellotaxi.pe"
#!/bin/bash

# Script para configurar SSL paso a paso en HelloTaxi
# Ejecutar en el servidor VPS

set -e

echo "🔒 Configurando SSL para HelloTaxi paso a paso..."

# 1. Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio del proyecto"
    exit 1
fi

# 2. Crear directorios necesarios
echo "📁 Creando directorios SSL..."
mkdir -p ssl/conf ssl/www ssl/logs
mkdir -p webroot

# 3. Detener servicios existentes
echo "🛑 Deteniendo servicios existentes..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# 4. Iniciar nginx temporal (sin SSL) y app
echo "🚀 Iniciando servicios temporales sin SSL..."
docker-compose -f docker-compose.prod.yml up -d hellotaxi-web

# Usar nginx temporal
docker run -d --name nginx-temp \
  --network hellotaxi-web_hellotaxi-network \
  -p 80:80 \
  -v $(pwd)/deployment/nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/webroot:/var/www/html \
  nginx:alpine

echo "⏳ Esperando que los servicios se inicialicen..."
sleep 10

# 5. Verificar que el sitio responde en HTTP
echo "🔍 Verificando que el sitio responde..."
if ! curl -f http://hellotaxi.pe >/dev/null 2>&1; then
    echo "❌ El sitio no responde en HTTP. Verifica el DNS y los servicios."
    echo "Logs de nginx:"
    docker logs nginx-temp --tail 20
    exit 1
fi

echo "✅ Sitio responde en HTTP, procediendo con SSL..."

# 6. Generar certificados SSL
echo "🔐 Generando certificados SSL..."
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
  -d hellotaxi.pe \
  -d www.hellotaxi.pe

# 7. Verificar que se generaron los certificados
if [ ! -f "ssl/live/hellotaxi.pe/fullchain.pem" ]; then
    echo "❌ Error: No se pudieron generar los certificados SSL"
    echo "Verifica que:"
    echo "- hellotaxi.pe y www.hellotaxi.pe apunten a esta IP"
    echo "- Los puertos 80 y 443 estén abiertos"
    echo "- No haya otros servicios usando el puerto 80"
    exit 1
fi

echo "✅ Certificados SSL generados correctamente"

# 8. Detener nginx temporal
echo "🛑 Deteniendo nginx temporal..."
docker stop nginx-temp
docker rm nginx-temp

# 9. Iniciar servicios completos con SSL
echo "🚀 Iniciando servicios completos con SSL..."
docker-compose -f docker-compose.prod.yml up -d

# 10. Verificar que todo funciona
echo "⏳ Verificando SSL..."
sleep 15

if curl -f https://hellotaxi.pe >/dev/null 2>&1; then
    echo "✅ ¡SSL configurado correctamente!"
    echo "🌐 Tu sitio está disponible en:"
    echo "   https://hellotaxi.pe"
    echo "   https://www.hellotaxi.pe"
else
    echo "⚠️ SSL generado pero verificación falló. Revisa los logs:"
    echo "docker-compose -f docker-compose.prod.yml logs nginx"
fi

echo "🎉 Configuración SSL completada"
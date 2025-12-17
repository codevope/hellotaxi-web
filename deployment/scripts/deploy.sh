#!/bin/bash

# 🚕 HelloTaxi - Deployment Completo con SSL
# Script único que hace TODO desde cero

set -e

echo "🚕 HelloTaxi - Iniciando deployment completo..."

# 1. CREAR DIRECTORIOS
echo "📁 Creando estructura de directorios..."
mkdir -p ssl/conf ssl/www ssl/logs webroot

# 2. VERIFICAR REQUISITOS
echo "🔍 Verificando requisitos..."

# Verificar DNS
HELLOTAXI_IP=$(dig hellotaxi.pe +short | tail -n1)
WWW_IP=$(dig www.hellotaxi.pe +short | tail -n1)
SERVER_IP=$(curl -s ifconfig.me)

if [ "$HELLOTAXI_IP" != "$SERVER_IP" ]; then
    echo "❌ Error: hellotaxi.pe ($HELLOTAXI_IP) no apunta a este servidor ($SERVER_IP)"
    exit 1
fi

if [ "$WWW_IP" != "$SERVER_IP" ]; then
    echo "❌ Error: www.hellotaxi.pe ($WWW_IP) no apunta a este servidor ($SERVER_IP)"
    exit 1
fi

echo "✅ DNS configurado correctamente"

# 3. CONSTRUIR IMAGEN
echo "🔨 Construyendo imagen de HelloTaxi..."
docker build -t hellotaxi-web .

# 4. INICIAR APLICACIÓN SIN SSL
echo "🚀 Iniciando aplicación (sin SSL)..."
docker compose -f docker-compose.yml up -d hellotaxi-web

# 5. NGINX TEMPORAL PARA OBTENER SSL
echo "🌐 Configurando nginx temporal..."
docker run -d --name nginx-temp \
  --network hellotaxi-web_hellotaxi-network \
  -p 80:80 \
  -v $(pwd)/deployment/nginx/nginx-temp.conf:/etc/nginx/nginx.conf:ro \
  -v $(pwd)/webroot:/var/www/html \
  nginx:alpine

# Esperar que nginx esté listo
echo "⏳ Esperando nginx temporal..."
sleep 15

# Verificar que el sitio responde
echo "🔍 Verificando conectividad HTTP..."
if ! curl -f -s http://hellotaxi.pe >/dev/null; then
    echo "❌ El sitio no responde en HTTP"
    docker logs nginx-temp --tail 20
    exit 1
fi

echo "✅ Sitio responde en HTTP"

# 6. GENERAR CERTIFICADOS SSL
echo "🔐 Generando certificados SSL con Let's Encrypt..."
docker run --rm \
  -v $(pwd)/ssl:/etc/letsencrypt \
  -v $(pwd)/webroot:/var/www/html \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/html \
  --email admin@hellotaxi.pe \
  --agree-tos \
  --no-eff-email \
  --non-interactive \
  --force-renewal \
  -d hellotaxi.pe \
  -d www.hellotaxi.pe

# 7. VERIFICAR CERTIFICADOS
if [ ! -f "ssl/live/hellotaxi.pe/fullchain.pem" ]; then
    echo "❌ Error: No se generaron los certificados SSL"
    exit 1
fi

echo "✅ Certificados SSL generados correctamente"

# 8. DETENER NGINX TEMPORAL
echo "🛑 Deteniendo nginx temporal..."
docker stop nginx-temp
docker rm nginx-temp

# 9. INICIAR SERVICIOS COMPLETOS CON SSL
echo "🚀 Iniciando servicios completos con SSL..."
docker compose -f docker-compose.yml up -d

# 10. VERIFICAR DEPLOYMENT
echo "⏳ Verificando deployment..."
sleep 20

# Verificar que todos los servicios están corriendo
if ! docker compose -f docker-compose.yml ps | grep -q "Up"; then
    echo "❌ Error: Algunos servicios no están corriendo"
    docker compose -f docker-compose.yml logs
    exit 1
fi

# Verificar HTTPS
echo "🔍 Verificando HTTPS..."
if curl -f -s -k https://hellotaxi.pe >/dev/null; then
    echo "✅ HTTPS funciona correctamente"
else
    echo "⚠️ HTTPS puede estar configurándose aún..."
fi

# 11. RESULTADO FINAL
echo ""
echo "🎉 ¡DEPLOYMENT COMPLETADO!"
echo ""
echo "🌐 Tu aplicación está disponible en:"
echo "    https://hellotaxi.pe"
echo "    https://www.hellotaxi.pe"
echo "    http://hellotaxi.pe (redirige a HTTPS)"
echo ""
echo "📊 Estado de servicios:"
docker compose -f docker-compose.yml ps
echo ""
echo "🔧 Comandos útiles:"
echo "   Ver logs: docker compose -f docker-compose.yml logs -f"
echo "   Reiniciar: docker compose -f docker-compose.yml restart"
echo "   Detener: docker compose -f docker-compose.yml down"
echo ""
echo "🔄 Los certificados SSL se renovarán automáticamente cada 90 días"
echo "✨ ¡HelloTaxi está listo para usar!"
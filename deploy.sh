#!/bin/bash

# Script de construcción y despliegue de HelloTaxi Web App

set -e

echo "🚀 Construyendo HelloTaxi Web App para Docker..."

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "Copia .env.example como .env y configura tus variables de Firebase"
    exit 1
fi

# Cargar variables de entorno
export $(cat .env | xargs)

echo "✅ Variables de entorno cargadas"

# Construir la imagen Docker
echo "🏗️  Construyendo imagen Docker..."
docker build \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$NEXT_PUBLIC_FIREBASE_API_KEY" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$NEXT_PUBLIC_FIREBASE_PROJECT_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$NEXT_PUBLIC_FIREBASE_APP_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID="$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID" \
  -t hellotaxi-web:latest \
  -t hellotaxi-web:$(date +%Y%m%d-%H%M%S) \
  .

echo "✅ Imagen Docker construida exitosamente"

# Opcional: Ejecutar con docker-compose
echo "🚀 Iniciando con Docker Compose..."
docker-compose up -d

echo "✅ HelloTaxi Web App desplegada!"
echo "🌐 Aplicación disponible en: http://localhost:3000"
echo "🔍 Ver logs: docker-compose logs -f"
echo "🛑 Detener: docker-compose down"
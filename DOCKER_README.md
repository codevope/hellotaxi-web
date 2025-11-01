# HelloTaxi Web App - Docker Deployment

## 🐳 Despliegue con Docker

Esta aplicación Next.js está optimizada para ejecutarse en contenedores Docker con Firebase como backend.

### 📋 Pre-requisitos

- Docker y Docker Compose instalados
- Proyecto Firebase configurado
- Variables de entorno de Firebase

### 🚀 Instalación Rápida

1. **Clonar el repositorio**
   ```bash
   git clone <tu-repo>
   cd hellotaxi-web
   ```

2. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Firebase
   ```

3. **Construir y desplegar**
   
   **En Linux/Mac:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```
   
   **En Windows:**
   ```powershell
   .\deploy.ps1
   ```

   **Manual:**
   ```bash
   docker-compose up --build -d
   ```

### 🔧 Configuración de Variables de Entorno

Crea un archivo `.env` con las siguientes variables:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-ABCDEF1234

# App Configuration
NODE_ENV=production
PORT=3000
```

### 🌐 Configuración para VPS/Dominio

#### Con Reverse Proxy (Recomendado)

Si usas Nginx como reverse proxy:

```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Acceso Directo (Sin Nginx)

Para acceso directo en puerto 80:

```yaml
# En docker-compose.yml, cambiar:
ports:
  - "80:3000"  # Puerto 80 externo
```

### 📱 Características de la Aplicación

- ✅ **PWA (Progressive Web App)** - Instalable en móviles
- ✅ **Responsive Design** - Mobile-first
- ✅ **Firebase Integration** - Auth, Firestore, Storage
- ✅ **Real-time Updates** - WebRTC y WebSockets
- ✅ **Geolocalización** - Google Maps integrado

### 🛠️ Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose logs -f

# Reiniciar aplicación
docker-compose restart

# Detener aplicación
docker-compose down

# Reconstruir después de cambios
docker-compose up --build -d

# Ver estado de contenedores
docker-compose ps

# Acceder al contenedor
docker-compose exec hellotaxi-web-app sh
```

### 🔍 Health Check

La aplicación incluye un endpoint de health check:

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-01T...",
  "service": "hellotaxi-web"
}
```

### 🚨 Solución de Problemas

#### Error de Build
```bash
# Limpiar cache de Docker
docker system prune -a
docker-compose up --build --force-recreate
```

#### Variables de entorno no cargadas
```bash
# Verificar que .env existe y tiene las variables correctas
cat .env
```

#### Puerto ocupado
```bash
# Verificar qué usa el puerto 3000
netstat -tulpn | grep 3000
# Cambiar puerto en docker-compose.yml si es necesario
```

### 🔐 Consideraciones de Seguridad

- Las variables de Firebase son públicas por diseño
- Configura reglas de seguridad en Firebase Console
- Usa HTTPS en producción (Cloudflare, Let's Encrypt)
- Mantén actualizado Node.js y dependencias

### 📊 Monitoreo

```bash
# CPU y memoria del contenedor
docker stats hellotaxi-web-app

# Logs específicos
docker-compose logs hellotaxi-web-app

# Información del contenedor
docker inspect hellotaxi-web-app
```

---

¡Tu aplicación HelloTaxi está lista para producción! 🚀🚕
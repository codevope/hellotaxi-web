# 🚕 HelloTaxi - Guía de Deployment

Esta carpeta contiene todos los archivos necesarios para el deployment de HelloTaxi con SSL automático.

## 📁 Estructura

```
deployment/
├── nginx/
│   ├── nginx.conf          # Configuración Nginx con SSL
│   └── nginx-temp.conf     # Configuración temporal para SSL  
├── scripts/
│   └── deploy.sh # Script único que hace TODO
├── env/
│   └── .env.example        # Variables de entorno ejemplo
└── README.md              # Esta guía
```

## 🚀 Deployment Rápido

### 1. Preparar Variables de Entorno

```bash
# Copiar ejemplo y configurar
cp deployment/env/.env.example .env.local

# Editar con tus valores reales
nano .env.local
```

### 2. Ejecutar Deployment

**Un solo comando:**
```bash
chmod +x deployment/scripts/deploy.sh
./deployment/scripts/deploy.sh
```

**¡Eso es todo!** El script hace:
-  Verifica DNS automáticamente
-  Construye la imagen Docker
-  Genera certificados SSL con Let's Encrypt
-  Configura Nginx con HTTPS
-  Inicia todos los servicios

## 🔧 Variables de Entorno Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase | `AIza...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación | `tu-proyecto.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | `tu-proyecto-id` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | API Key de Google Maps | `AIza...` |
| `NEXT_PUBLIC_APP_URL` | URL de tu aplicación | `https://hellotaxi.pe` |

## 🌐 DNS Configuration

Antes del deployment, configura tu DNS:

```
hellotaxi.pe       A    TU_IP_SERVIDOR
www.hellotaxi.pe   A    TU_IP_SERVIDOR
```

## 🔐 SSL Automático

El sistema incluye:
-  Certificados Let's Encrypt automáticos
-  Renovación automática cada 30 días
-  Redirección HTTP → HTTPS
-  Headers de seguridad modernos

## 📊 Monitoreo

### Verificar servicios:
```bash
docker-compose -f docker-compose.prod.yml ps
```

### Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

### Verificar SSL:
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot certificates
```

## 🔄 Actualizaciones

```bash
git pull
./deployment/scripts/deploy.sh
```

## 🆘 Troubleshooting

### SSL no funciona
1. Verificar DNS apunta al servidor
2. Verificar puertos 80 y 443 abiertos
3. Revisar logs de certbot:
   ```bash
   docker-compose -f docker-compose.prod.yml logs certbot
   ```

### App no responde
1. Verificar que el contenedor esté corriendo:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   ```
2. Revisar logs de la app:
   ```bash
   docker-compose -f docker-compose.prod.yml logs hellotaxi-web
   ```

### Error de variables de entorno
1. Verificar archivo `.env.local` existe
2. Verificar todas las variables requeridas están configuradas
3. Reiniciar servicios:
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

## 📞 Soporte

Para problemas específicos, revisar:
- Logs de Docker: `docker-compose logs`
- Estado de servicios: `docker-compose ps`
- Uso de recursos: `docker stats`
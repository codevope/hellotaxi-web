# 🚨 SOLUCIÓN: Error de SSL en Producción

## ❌ **Problema Detectado:**
- Los certificados SSL no existen
- Nginx no puede arrancar sin certificados
- El script de renovación está malformado

## ✅ **Solución Paso a Paso:**

### 1️⃣ En tu servidor VPS, ejecuta:

```bash
# Detener todo
docker-compose -f docker-compose.prod.yml down

# Limpiar contenedores
docker system prune -f
```

### 2️⃣ Subir archivos corregidos:

Sube estos archivos al servidor:
- `deployment/nginx/nginx-temp.conf` (nuevo)
- `deployment/scripts/setup-ssl-step-by-step.sh` (nuevo)
- `docker-compose.prod.yml` (corregido)
- `deployment/nginx/nginx.conf` (corregido)

### 3️⃣ Ejecutar configuración SSL paso a paso:

```bash
# Hacer ejecutable
chmod +x deployment/scripts/setup-ssl-step-by-step.sh

# Ejecutar configuración SSL
./deployment/scripts/setup-ssl-step-by-step.sh
```

## 🔍 **¿Qué hace el script?**

1. **Inicia nginx temporal** sin SSL (solo HTTP)
2. **Verifica que el dominio responde** en HTTP
3. **Genera certificados SSL** usando Let's Encrypt
4. **Cambia a nginx con SSL** completo
5. **Verifica que HTTPS funciona**

## 📋 **Requisitos Previos:**

- ✅ DNS configurado: `hellotaxi.pe` → IP del servidor
- ✅ DNS configurado: `www.hellotaxi.pe` → IP del servidor  
- ✅ Puertos 80 y 443 abiertos en el firewall
- ✅ No otros servicios usando puerto 80/443

## 🛠️ **Si hay problemas:**

### Verificar DNS:
```bash
dig hellotaxi.pe
dig www.hellotaxi.pe
```

### Verificar puertos:
```bash
netstat -tlnp | grep :80
netstat -tlnp | grep :443
```

### Ver logs:
```bash
docker-compose -f docker-compose.prod.yml logs nginx
docker-compose -f docker-compose.prod.yml logs certbot
```

## 🎯 **Resultado Esperado:**

Después del script:
- ✅ `https://hellotaxi.pe` funciona
- ✅ `http://hellotaxi.pe` redirige a HTTPS
- ✅ Certificados SSL válidos
- ✅ Renovación automática configurada
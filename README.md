# 🚕 HelloTaxi Web Application

Aplicación web PWA para servicio de taxi desarrollada con Next.js 15 y Firebase.

## 🚀 Deployment con Docker + SSL Automático

**Deployment completo con UN SOLO comando:**

```bash
# En tu servidor VPS:
git clone https://github.com/codevope/hellotaxi-web.git
cd hellotaxi-web

# Configurar variables de entorno:
cp deployment/env/.env.example .env.production

# Deployment completo:
chmod +x deployment/scripts/deploy-everything.sh
./deployment/scripts/deploy-everything.sh
```

**🎯 El script hace TODO:**
- ✅ Construye la imagen Docker
- ✅ Genera certificados SSL automáticamente
- ✅ Configura Nginx con HTTPS
- ✅ Inicia todos los servicios

⚠️ **Requisito**: Configura tu DNS antes del deployment:
```
hellotaxi.pe      A    TU_IP_SERVIDOR
www.hellotaxi.pe  A    TU_IP_SERVIDOR
```

## 🛠️ Desarrollo Local

```bash
npm install
npm run dev
```

## 📁 Estructura del Proyecto

- `src/app/` - Páginas y rutas Next.js
- `src/components/` - Componentes React reutilizables  
- `src/hooks/` - Custom hooks
- `src/lib/` - Utilidades y configuración
- `deployment/` - Archivos de deployment Docker + SSL

## 🔧 Tecnologías

- **Framework:** Next.js 15.3.3
- **Backend:** Firebase (Firestore, Auth)
- **Maps:** Google Maps API
- **Styling:** Tailwind CSS
- **Deployment:** Docker + Nginx + Let's Encrypt SSL

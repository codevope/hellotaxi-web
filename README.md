# 🚕 HelloTaxi Web Application

Aplicación web PWA para servicio de taxi desarrollada con Next.js 15 y Firebase.

## 🚀 Deployment con Docker + SSL

**Deployment completo con un comando:**

Ver → [`DEPLOY.md`](./DEPLOY.md) para instrucciones de deployment

```bash
# Linux/Mac
./deployment/scripts/deploy.sh

# Windows
.\deployment\scripts\deploy.ps1
```

⚠️ **Importante**: Esta aplicación requiere **HTTPS** para funcionar completamente. Las funciones de geolocalización y notificaciones no están disponibles en HTTP por razones de seguridad del navegador.

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

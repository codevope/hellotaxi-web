# Dockerfile para HelloTaxi Web App (Next.js + Firebase)

# Etapa 1: Construcción
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache libc6-compat

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar dependencias con npm ci (más determinista que npm install)
RUN npm ci

# Copiar código fuente
COPY . .

# Deshabilitar telemetría de Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Construir la aplicación
RUN npm run build

# Etapa 2: Producción (imagen mínima)
FROM node:22-alpine AS runner

WORKDIR /app

# Instalar solo herramientas necesarias
RUN apk add --no-cache curl tini

# Crear usuario no-root para seguridad
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos necesarios desde el builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Variables de entorno
ENV PORT=3000
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Usar tini para manejar signals correctamente
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
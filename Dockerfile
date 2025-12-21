# Dockerfile MEJORADO con seguridad reforzada
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ==========================================
# IMAGEN DE PRODUCCIÓN ENDURECIDA
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

# Solo herramientas esenciales
RUN apk add --no-cache curl tini dumb-init && \
    rm -rf /var/cache/apk/*

# Usuario sin privilegios
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar archivos con ownership correcto
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 🔒 HARDENING: Sistema de archivos read-only
RUN chmod -R 555 /app && \
    mkdir -p /tmp && \
    chown nextjs:nodejs /tmp

# Cambiar a usuario no-root
USER nextjs

# Variables de entorno
ENV PORT=3000 \
    NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_OPTIONS="--max-old-space-size=460 --no-warnings"

EXPOSE 3000

# Health check robusto
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Init system para manejar señales
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
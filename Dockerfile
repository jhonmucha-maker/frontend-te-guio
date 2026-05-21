# =====================================================================
# Dockerfile multi-stage para Marketplace Frontend (Vite + Express SPA).
# Reemplaza Nixpacks: builds reproducibles, sin dependencia de la red Nix
# (que ha fallado por timeouts intermitentes de github.com/NixOS/nixpkgs).
# =====================================================================

# -------- Stage 1: build estatico con Vite --------
FROM node:20.19-alpine AS builder
WORKDIR /app

# Instalar deps con cache eficiente (lockfile primero)
COPY package.json package-lock.json* ./
RUN npm ci --include=dev

# Copiar fuente y compilar
COPY . .
RUN npm run build


# -------- Stage 2: runtime minimo (Express SPA fallback) --------
FROM node:20.19-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000

# Solo deps de produccion (server.js solo necesita express)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

# Artefacto del build + servidor
COPY --from=builder /app/dist ./dist
COPY server.js ./server.js

EXPOSE 3000
CMD ["node", "server.js"]

# =========================================================
# STAGE 1 : BUILD - compile l'app Angular
# =========================================================
FROM node:22-alpine AS build
WORKDIR /app

# Cache des dépendances : on copie package*.json en premier
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

ARG BUILD_CONFIG=production
ENV NODE_ENV=production
RUN npm run build -- --configuration=$BUILD_CONFIG

# =========================================================
# STAGE 2 : RUNTIME - sert les fichiers statiques via Nginx (non-root)
# =========================================================
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime

LABEL org.opencontainers.image.description="Frontend Angular servi par Nginx (non-root)"

# Nettoie la conf par défaut et met la nôtre (support routing Angular + proxy API)
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build --chown=nginx:nginx /app/dist/frontend-microservice/browser /usr/share/nginx/html

# L'image nginx-unprivileged tourne déjà en utilisateur "nginx" (uid 101),
# on le rend explicite pour la clarté / cohérence avec les autres Dockerfiles
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- http://localhost:8080 || exit 1

CMD ["nginx", "-g", "daemon off;"]
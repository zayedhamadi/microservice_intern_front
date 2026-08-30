# syntax=docker/dockerfile:1

# ============================================================
# STAGE 1 — BUILD ANGULAR
# ============================================================

FROM node:22.14.0-alpine AS build

WORKDIR /app

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

# ============================================================
# DEPENDENCIES
# ============================================================

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm,id=npm-frontend \
    npm ci --legacy-peer-deps --include=dev

# ============================================================
# SOURCE
# ============================================================

COPY . .

# ============================================================
# BUILD CONFIGURATION
# ============================================================

ARG BUILD_CONFIG=production

# ============================================================
# ANGULAR CLI
# ============================================================

RUN ./node_modules/.bin/ng version

# ============================================================
# BUILD ANGULAR
# ============================================================

RUN npm run build -- --configuration=${BUILD_CONFIG}

# ============================================================
# NORMALIZE ANGULAR OUTPUT
# ============================================================

RUN if [ -f /app/dist/frontend-microservice/browser/index.csr.html ]; then \
        mv \
        /app/dist/frontend-microservice/browser/index.csr.html \
        /app/dist/frontend-microservice/browser/index.html; \
    fi

RUN test -f /app/dist/frontend-microservice/browser/index.html


# ============================================================
# STAGE 2 — NGINX RUNTIME
# ============================================================

FROM nginxinc/nginx-unprivileged:1.27.5-alpine AS runtime

ARG GIT_COMMIT=unknown
ARG BUILD_DATE=unknown
ARG APP_VERSION=unknown

LABEL org.opencontainers.image.title="hirely-frontend" \
      org.opencontainers.image.description="Hirely Angular frontend served by Nginx" \
      org.opencontainers.image.vendor="Hirely" \
      org.opencontainers.image.source="https://github.com/zayedhamadi/microservice_intern" \
      org.opencontainers.image.licenses="Proprietary" \
      org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.version="${APP_VERSION}"

# ============================================================
# NGINX CONFIGURATION
# ============================================================

# nginx.conf COMPLET
COPY nginx.conf /etc/nginx/nginx.conf

# Configuration du virtual host
COPY default.conf /etc/nginx/conf.d/default.conf

# ============================================================
# ANGULAR BUILD
# ============================================================

COPY --from=build \
    /app/dist/frontend-microservice/browser/ \
    /usr/share/nginx/html/

# ============================================================
# PORT
# ============================================================

EXPOSE 8080

# ============================================================
# HEALTHCHECK
# ============================================================

HEALTHCHECK \
    --interval=30s \
    --timeout=5s \
    --start-period=15s \
    --retries=5 \
    CMD wget \
        --no-verbose \
        --tries=1 \
        --spider \
        http://127.0.0.1:8080/health \
        || exit 1

# ============================================================
# GRACEFUL SHUTDOWN
# ============================================================

STOPSIGNAL SIGTERM

# ============================================================
# NGINX
# ============================================================

ENTRYPOINT ["nginx", "-g", "daemon off;"]
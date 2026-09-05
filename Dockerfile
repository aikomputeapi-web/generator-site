# syntax=docker/dockerfile:1.6
# generator-site: multi-runtime container (nginx static + Node Express backend + Python/Flask ReportLab backend)
# Single image coordinated by supervisord. nginx (port 80) fronts all traffic:
#   /api/bankstatement/*  -> Flask gunicorn on 5001
#   /api/*               -> Node Express on 5000
#   everything else       -> static React build (Vite dist)

FROM node:20-bookworm-slim AS build

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Build-time system deps
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-venv \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node deps first for better layer caching
COPY package.json package-lock.json* ./
RUN npm install --no-audit --no-fund

# Install Python deps into a venv (kept for runtime copy below)
COPY bankstatement/requirements.txt ./bankstatement/requirements.txt
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/pip install --upgrade pip \
    && /opt/venv/bin/pip install -r bankstatement/requirements.txt

# Build the frontend
COPY tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts index.html ./
COPY public ./public
COPY src ./src
RUN npm run build

# -------------------------------------------------------------------
# Runtime stage: nginx + node + python, orchestrated by supervisord
# -------------------------------------------------------------------
FROM node:20-bookworm-slim

ENV NODE_ENV=production \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Runtime system packages: nginx + supervisord + python runtime + fonts for ReportLab
RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor unzip \
    python3 python3-venv python3-minimal \
    fonts-liberation fonts-dejavu fonts-freefont-ttf \
    libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 \
    libcairo2 libasound2 libatspi2.0-0 libnspr4 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Production Node deps (needed for runtime backend; tsx runs server.ts)
COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund
RUN npm install -g tsx@^4.22.1 --no-audit --no-fund

# Copy backend source + built frontend
COPY server.ts tsconfig.node.json ./
COPY public ./public
COPY --from=build /app/dist ./dist
COPY bankstatement ./bankstatement

# Copy the pre-built Python venv from build stage
COPY --from=build /opt/venv /opt/venv

# Wire nginx
RUN rm -f /etc/nginx/sites-enabled/default
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Wire supervisord
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Entrypoint templates nginx.conf with Render's $PORT at startup
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Render routes HTTP to $PORT; nginx binds it (templated in entrypoint.sh).
# 80 is kept as a fallback for local `docker run -p 80:80`.
EXPOSE 80

CMD ["/app/entrypoint.sh"]

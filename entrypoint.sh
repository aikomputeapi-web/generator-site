#!/bin/sh
# Render entrypoint: Render routes HTTP to the port in $PORT (default 10000).
# Layout:
#   nginx   -> $PORT        (Render routes here; serves static + proxies /api)
#   Express -> 5000         (internal; nginx proxy_pass target for /api)
#   Flask   -> 5001         (internal; nginx proxy_pass target for /api/bankstatement)
set -e

: "${PORT:=80}"
export PORT

# Template the nginx vhost so it listens on Render's $PORT.
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/conf.d/default.conf

# Express (server.ts) reads INTERNAL_PORT (falls back to PORT, then 5000).
# Force it internal so it doesn't collide with nginx on $PORT.
export INTERNAL_PORT=5000

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

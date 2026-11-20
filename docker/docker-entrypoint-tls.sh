#!/bin/sh
set -eu

DOMAIN="${DOMAIN:?DOMAIN must be set}"

sed -i "s/__DOMAIN__/$DOMAIN/g" /etc/nginx/conf.d/default.conf

CERT_DIR="/etc/letsencrypt/live/$DOMAIN"
mkdir -p "$CERT_DIR"

if [ ! -s "$CERT_DIR/fullchain.pem" ] || [ ! -s "$CERT_DIR/privkey.pem" ]; then
    openssl req -x509 -nodes -newkey rsa:2048 \
        -days 1 \
        -subj "/CN=$DOMAIN" \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" >/dev/null 2>&1
fi

nginx -t
(while :; do
    sleep 12h
    nginx -t && nginx -s reload
done) &
exec nginx -g "daemon off;"

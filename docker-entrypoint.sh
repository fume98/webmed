#!/bin/sh
# Algunos servicios (Railway, Render, etc.) montan el disco de datos como root.
# Le damos la carpeta al usuario "node" y corremos el servidor sin permisos de root.
set -e
mkdir -p "$DATA_DIR"
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_DIR" 2>/dev/null || true
  exec su-exec node "$@"
fi
exec "$@"

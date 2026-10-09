#!/bin/sh
# Entrada do container de desenvolvimento da tela.
# Reinstala dependências só se package.json/package-lock.json mudaram
# (o volume de node_modules não é atualizado pelo rebuild da imagem).
set -e

STAMP=node_modules/.deps-hash
HASH=$(cat package.json package-lock.json | md5sum | cut -d' ' -f1)

if [ ! -f "$STAMP" ] || [ "$(cat "$STAMP")" != "$HASH" ]; then
  echo "Dependências mudaram: instalando..."
  npm ci
  echo "$HASH" > "$STAMP"
fi

exec npm run dev

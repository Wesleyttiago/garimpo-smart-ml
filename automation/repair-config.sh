#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
. scripts/docker.sh
. scripts/storage.sh
require_docker
if [ ! -f .env ] || ! grep -Eq '^N8N_ENCRYPTION_KEY=[A-Za-z0-9_-]{32,}$' .env; then
  echo "A chave existente precisa estar disponível em .env. Não gere outra chave." >&2
  exit 1
fi
compose stop n8n
check_storage
compose run -T --rm --no-deps -v "$PWD/scripts:/repair:ro" --entrypoint node n8n /repair/repair-config.mjs
exec bash setup.sh

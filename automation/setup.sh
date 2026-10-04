#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "Instale Docker Engine e o plugin Docker Compose: https://docs.docker.com/engine/install/"
  exit 1
fi
if [ ! -f .env ]; then
  cp .env.example .env
  key="$(docker run --rm node:24.19.0-alpine node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
  sed -i "s/^N8N_ENCRYPTION_KEY=$/N8N_ENCRYPTION_KEY=$key/" .env
  chmod 600 .env
fi
mkdir -p output
# UID do usuário node do container.
docker run --rm -v "$PWD/output:/output" node:24.19.0-alpine chown 1000:1000 /output
docker compose up -d --wait --wait-timeout 180
docker compose exec -T n8n n8n import:workflow --input=/workflows/garimpo-smart.json
echo "n8n: http://localhost:5678"
echo "Prévia: http://localhost:8078"
echo "Crie seu usuário local e execute Garimpo Smart - pesquisa e rascunho (inativo)."


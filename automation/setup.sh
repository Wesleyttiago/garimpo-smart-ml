#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
. scripts/docker.sh
. scripts/storage.sh
require_docker
check_storage
umask 077
if [ ! -f .env ]; then
  key="$("${DOCKER[@]}" run --rm node:24.19.0-alpine node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
  if [[ ! "$key" =~ ^[a-f0-9]{64}$ ]]; then
    echo "Não foi possível gerar a chave do n8n." >&2
    exit 1
  fi
  sed "s/^N8N_ENCRYPTION_KEY=$/N8N_ENCRYPTION_KEY=$key/" .env.example > .env
  chmod 600 .env
fi
if ! grep -Eq '^N8N_ENCRYPTION_KEY=[A-Za-z0-9_-]{32,}$' .env; then
  echo ".env não contém uma chave válida. Não substitua a chave de uma instalação existente; precisamos revisar." >&2
  exit 1
fi
mkdir -p output
"${DOCKER[@]}" run --rm -v "$PWD/output:/output" node:24.19.0-alpine chown 1000:1000 /output
# O processo node precisa atravessar a pasta e gravar rascunhos.
"${DOCKER[@]}" run --rm -v "$PWD/output:/output" node:24.19.0-alpine chmod 755 /output
compose up -d --wait --wait-timeout 300
check_log="$(mktemp)"
trap 'rm -f "$check_log"' EXIT
if compose exec -T n8n n8n export:workflow --id=garimpoSmartDraft01 --output=/tmp/garimpo-onboarding-check.json >"$check_log" 2>&1; then
  echo "Fluxo já existente: suas edições foram preservadas."
elif grep -q 'No workflows found with specified filters' "$check_log"; then
  compose exec -T n8n n8n import:workflow --input=/workflows/garimpo-smart.json
else
  echo "Não foi possível conferir os fluxos existentes. Nenhum fluxo foi sobrescrito." >&2
  echo "Confira os serviços com bash manage.sh status e os erros com bash manage.sh logs." >&2
  exit 1
fi
echo "n8n: http://localhost:5678"
echo "Prévia: http://localhost:8078"
echo "Crie seu usuário local, abra Garimpo Smart - pesquisa e rascunho e execute o teste."
echo "Depois: bash manage.sh test"

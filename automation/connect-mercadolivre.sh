#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
. scripts/docker.sh
. scripts/storage.sh
require_docker
check_storage
if [ ! -f .env ]; then
  echo "Execute bash setup.sh primeiro." >&2
  exit 1
fi
echo "O cadastro da aplicação precisa de Authorization Code, Refresh Token e PKCE."
echo "Digite as chaves apenas neste terminal. Elas não serão exibidas."
"${DOCKER[@]}" run --rm -it --user "$(id -u):$(id -g)" -v "$PWD:/app" -w /app node:24.19.0-alpine node scripts/connect-mercadolivre.mjs
compose up -d --wait --wait-timeout 300
echo "Conexão salva. Próxima etapa: conferir acesso à pesquisa real."

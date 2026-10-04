#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  echo "Docker e Compose já instalados. Próximo comando: bash setup.sh"
  exit 0
fi
if [ ! -r /etc/os-release ]; then
  echo "Sistema não reconhecido. Este instalador é para Ubuntu 22.04, 24.04 ou 26.04." >&2
  exit 1
fi
# Arquivo do próprio sistema, não um arquivo de credenciais.
. /etc/os-release
if [ "${ID:-}" != ubuntu ]; then
  echo "Distribuição detectada: ${PRETTY_NAME:-desconhecida}. Envie esse nome para adaptarmos a instalação." >&2
  exit 1
fi
case "${VERSION_ID:-}" in
  22.04|24.04|26.04) ;;
  *) echo "Versão do Ubuntu não coberta pelo instalador: ${VERSION_ID:-desconhecida}." >&2; exit 1 ;;
esac
arch="$(dpkg --print-architecture)"
case "$arch" in
  amd64|arm64) ;;
  *) echo "Arquitetura não coberta pelo ambiente n8n: $arch." >&2; exit 1 ;;
esac
# Não remove Docker, containerd ou runtimes já instalados.
conflicts=()
for package in docker.io docker-compose docker-compose-v2 docker-doc docker-buildx podman-docker containerd runc; do
  installed="$(dpkg-query -W -f='${Status}' "$package" 2>/dev/null || true)"
  if [ "$installed" = "install ok installed" ]; then conflicts+=("$package"); fi
done
if [ "${#conflicts[@]}" -gt 0 ]; then
  echo "Há pacotes que precisam de revisão antes da instalação: ${conflicts[*]}." >&2
  echo "Nenhum pacote foi removido. Envie essa mensagem para continuarmos." >&2
  exit 1
fi
for source_file in /etc/apt/sources.list.d/docker.list /etc/apt/sources.list.d/docker.sources; do
  if [ -f "$source_file" ] && ! grep -q '^# Garimpo Smart: repositório oficial Docker$' "$source_file"; then
    echo "Já existe configuração Docker em $source_file. Vamos revisar antes de substituir." >&2
    exit 1
  fi
done
if ! command -v sudo >/dev/null 2>&1; then
  echo "Execute a instalação em uma conta normal com acesso ao sudo." >&2
  exit 1
fi
echo "Instalando Docker e Compose pelo repositório oficial. O sudo pedirá sua senha local."
sudo -v
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
temporary_key="$(mktemp)"
trap 'rm -f "$temporary_key"' EXIT
curl --fail --silent --show-error --location https://download.docker.com/linux/ubuntu/gpg -o "$temporary_key"
sudo install -m 0755 -d /etc/apt/keyrings
sudo install -m 0644 "$temporary_key" /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources >/dev/null <<EOF
# Garimpo Smart: repositório oficial Docker
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: ${UBUNTU_CODENAME:-$VERSION_CODENAME}
Components: stable
Architectures: $arch
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable --now docker
sudo docker run --rm hello-world
echo "Docker instalado. Próximo comando: bash setup.sh"
echo "Seu usuário não foi adicionado ao grupo docker; os scripts usarão sudo quando necessário."

#!/usr/bin/env bash
# Biblioteca compartilhada; não importa nem executa o conteúdo de .env.
require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker não instalado. No Ubuntu, execute: bash install-ubuntu.sh" >&2
    return 1
  fi
  DOCKER=(docker)
  if ! docker info >/dev/null 2>&1; then
    if ! command -v sudo >/dev/null 2>&1; then
      echo "Sem acesso ao Docker. Inicie o serviço e confira suas permissões." >&2
      return 1
    fi
    echo "O Docker precisa de permissão administrativa; a senha será pedida no terminal."
    sudo -v
    DOCKER=(sudo docker)
    if ! "${DOCKER[@]}" info >/dev/null 2>&1; then
      echo "Docker indisponível. No Ubuntu, confira: sudo systemctl status docker" >&2
      return 1
    fi
  fi
  if ! "${DOCKER[@]}" compose version >/dev/null 2>&1; then
    echo "Falta o plugin Docker Compose v2. Execute bash install-ubuntu.sh no Ubuntu." >&2
    return 1
  fi
}
compose() { "${DOCKER[@]}" compose "$@"; }

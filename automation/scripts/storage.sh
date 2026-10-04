#!/usr/bin/env bash
check_storage() {
  local data_root free_kb free_inodes
  data_root="$("${DOCKER[@]}" info --format '{{.DockerRootDir}}')"
  if [ -z "$data_root" ]; then
    echo "Não foi possível localizar o armazenamento do Docker." >&2
    return 1
  fi
  free_kb="$(df -Pk "$data_root" | awk 'NR == 2 {print $4}')"
  free_inodes="$(df -Pi "$data_root" | awk 'NR == 2 {print $4}')"
  if [[ ! "$free_kb" =~ ^[0-9]+$ ]]; then
    echo "Não foi possível medir o espaço livre em $data_root." >&2
    return 1
  fi
  # Reserva mínima para o banco, arquivos temporários e rascunhos.
  # O download inicial das imagens exige espaço adicional.
  if [ "$free_kb" -lt 2097152 ]; then
    echo "Pouco espaço no disco do Docker: reserve pelo menos 2 GiB livres antes de iniciar." >&2
    echo "Confira: df -h $data_root e sudo docker system df" >&2
    return 1
  fi
  if [[ "$free_inodes" =~ ^[0-9]+$ ]] && [ "$free_inodes" -lt 1000 ]; then
    echo "Poucos inodes livres: o disco não tem capacidade para criar novos arquivos." >&2
    echo "Confira: df -i $data_root" >&2
    return 1
  fi
}

# Falha ENOSPC e arquivo config inválido

Os logs mostram falta de espaço para gravar e, em seguida, JSON inválido em `/home/node/.n8n/config`. O arquivo pode ter ficado vazio ou incompleto durante a gravação.

## Primeiro: medir, sem apagar arquivos

Dentro de `garimpo-smart-ml/automation`:

```bash
sudo docker compose stop n8n
df -h / /var/lib/docker
df -i /var/lib/docker
sudo docker system df
```

`df -h` mostra capacidade e espaço livre. `df -i` mostra a disponibilidade para criar arquivos. `docker system df` mostra o consumo do Docker. Esses comandos de diagnóstico não removem dados.

Libere espaço após conferir o resultado. Reserve ao menos **2 GiB livres** no disco do Docker para iniciar; baixar novas imagens exige espaço adicional. Esse limite é uma margem definida por este projeto, não um requisito oficial de memória RAM do n8n.

Não use `docker compose down -v`, `docker volume prune` ou comandos para apagar `/var/lib/docker`: os volumes guardam os dados do n8n. Podemos orientar uma limpeza específica depois de ver o diagnóstico.

## Depois de liberar espaço: reparar

Atualize o projeto e execute:

```bash
git pull --ff-only
bash repair-config.sh
```

Se o Git avisar de alterações locais, preserve seus arquivos e envie a mensagem.

O reparo:

- Para o serviço n8n antes de mexer na configuração.
- Confere espaço livre e a presença da chave original em `.env`.
- Mantém arquivos válidos e bloqueia se detectar uma chave diferente.
- Guarda uma cópia privada do arquivo inválido no próprio volume.
- Recria somente o JSON de configuração, com a mesma chave existente.
- Preserva banco de dados e fluxos e executa a inicialização normal.

**Não substitua nem apague `.env`.** Se a chave original não estiver disponível, interrompa a recuperação para revisarmos.

Depois:

```bash
bash manage.sh status
bash manage.sh test
```

Abra http://localhost:5678 para o n8n e http://localhost:8078 para a prévia. Se ainda falhar, envie `bash manage.sh logs`, sem expor credenciais.

A configuração passou a limitar os logs a três arquivos de 5 MB por serviço. Isso reduz crescimento futuro dos logs; não libera automaticamente o espaço que já está ocupado.

Fonte dos comandos Docker: https://docs.docker.com/reference/cli/docker/system/df/ e https://docs.docker.com/engine/logging/configure/

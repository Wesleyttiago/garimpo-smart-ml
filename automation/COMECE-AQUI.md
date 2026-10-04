# Seu n8n do zero

> **Está no Windows 11?** Comece pelo [guia para Windows e WSL](WINDOWS-11.md).

Wesley, este guia prepara o n8n no seu computador. Você executa a instalação no seu Linux; a configuração e o fluxo foram testados antes de chegarem aqui.

## O que vamos instalar

**Docker** executa os serviços separadamente. **n8n** é o editor onde conectamos as etapas. **Worker Garimpo** pesquisa e filtra candidatos. O **painel de revisão** mostra os resultados.

Você poderá criar outros fluxos nesse mesmo n8n. Quando explicar a outra busca, faremos uma automação separada, sem reconstruir a instalação.

O computador precisa ficar ligado, com Docker e serviços funcionando, para executar os horários automáticos. Para rodar com o notebook desligado, depois precisaremos de um servidor ou de n8n Cloud.

## 1. Conferir seu Linux

Abra o terminal com Ctrl + Alt + T:

```bash
cat /etc/os-release
```

O instalador atende **Ubuntu 22.04, 24.04 e 26.04**, em amd64 ou arm64. Ele confere a versão antes de alterar o sistema. Se você usa outra distribuição, envie seu nome para adaptarmos a instalação.

## 2. Baixar o projeto

Execute os comandos abaixo:

```bash
sudo apt-get update
sudo apt-get install -y git
git clone https://github.com/Wesleyttiago/garimpo-smart-ml.git
cd garimpo-smart-ml/automation
```

O terminal pode pedir sua senha do Linux. Os caracteres não aparecem quando você digita; isso é normal.

Se já baixou esse repositório, entre na pasta dele, rode `git pull --ff-only` e depois `cd automation`. Se o Git avisar sobre alterações locais, preserve seus arquivos e envie a mensagem.

## 3. Instalar e iniciar

Na pasta `automation`, execute um comando por vez:

```bash
bash install-ubuntu.sh
bash setup.sh
```

O primeiro instala Docker Engine e Compose pelo repositório oficial, sem remover runtimes existentes. O segundo cria a configuração privada, baixa as imagens, inicia os serviços e importa o fluxo de teste.

A primeira execução pode demorar para baixar as imagens. Aguarde aparecerem os endereços do n8n e da prévia. O instalador não pede senha do Mercado Livre nem cria sua conta do n8n.

Para conferir:

```bash
bash manage.sh status
```

Os serviços `n8n` e `worker` devem aparecer em execução e saudáveis.

## 4. Criar sua conta local

Abra **http://localhost:5678** no navegador desse mesmo computador.

Na tela inicial, crie seu usuário local e uma senha forte. Essa conta acessa a sua instalação do n8n; é independente da conta do Mercado Livre.

Encontre o fluxo **Garimpo Smart - pesquisa e rascunho**.

## 5. Fazer o primeiro teste

No editor, selecione a execução manual do fluxo:

1. **Testar agora** inicia.
2. **Modo de teste** envia `mode: demo`.
3. **Pesquisar e preparar rascunho** chama o worker.
4. **Conferir em localhost 8078** recebe os resultados.

Abra **http://localhost:8078**. Devem aparecer **cinco cards DEMO**, com preços fictícios e sem links de afiliado. O fluxo fica inativo para não rodar sozinho.

Você também pode verificar a comunicação dos serviços pelo terminal:

```bash
bash manage.sh test
```

Esse comando sempre gera uma simulação e substitui o rascunho local anterior. Não executa busca real, não transmite URLs ao provedor e não altera a vitrine.

## 6. Usar no dia a dia

Dentro da pasta `automation`:

| Ação | Comando |
| --- | --- |
| Iniciar ou recuperar os serviços | `bash manage.sh start` |
| Conferir funcionamento | `bash manage.sh status` |
| Fazer teste DEMO | `bash manage.sh test` |
| Ver últimas mensagens de erro | `bash manage.sh logs` |
| Parar por enquanto | `bash manage.sh stop` |

Iniciar novamente preserva seu usuário e os fluxos salvos. Se o fluxo já existe, suas edições não são sobrescritas.

Os dados do n8n ficam no volume Docker. A chave usada para as credenciais fica em `.env`. Guarde ambos: não publique `.env`, não substitua a chave de uma instalação já usada e não remova o volume.

Use a opção de baixar/exportar JSON no editor para salvar uma cópia de um fluxo. Esse JSON guarda o desenho do fluxo; não substitui um backup do volume e da chave.

## 7. Conectar fontes reais depois

**A demonstração não comprova que podemos pesquisar ou gerar links reais na sua conta.**

A pesquisa real exige uma aplicação e um token autorizado do Mercado Livre, com permissão para os endpoints. A conversão automática exige escolher e autorizar um provedor compatível.

Os campos estão preparados em `.env`; não precisa preenchê-los para o teste. As instruções técnicas estão em [README.md](README.md). Configure credenciais no seu computador ou na interface local do n8n; não envie senhas, cookies ou tokens pelo chat.

A agenda e a publicação na vitrine são etapas posteriores. Quando explicar a outra busca, precisaremos saber a fonte, o que procurar, a frequência e onde mostrar ou entregar o resultado.

## Se algo travar

| Situação | Próximo passo |
| --- | --- |
| Sistema não reconhecido | Envie o nome mostrado em `/etc/os-release`. |
| Pacotes precisam de revisão | Envie os nomes; o instalador não os removeu. |
| Repositório Docker já configurado | Envie a mensagem para preservarmos a instalação atual. |
| Docker indisponível | No Ubuntu, rode `sudo systemctl status docker`. |
| Porta 5678 ou 8078 ocupada | Envie a mensagem; ajustaremos a porta. |
| Página não abre | Rode `bash manage.sh status` e `bash manage.sh logs`. |
| Senha parece não ser digitada | Digite normalmente e pressione Enter. |

Quando terminar, envie **“abriu e apareceram os 5 produtos DEMO”**, ou a mensagem de erro. Assim seguimos para conectar a primeira fonte real.

Fontes: https://docs.docker.com/engine/install/ubuntu/ e https://docs.n8n.io/deploy/host-n8n/install-options/install-using-docker-compose.md

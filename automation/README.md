# Garimpo Smart — teste de automação no n8n

Este módulo encontra **candidatos para os cinco produtos novos da vitrine**, confirma critérios e gera um rascunho local. Não altera os arquivos do site nem publica anúncios.

## O que está pronto

- Fluxo importável, inicialmente **inativo**, com execução manual e horário diário às 9h em America/Recife.
- Demonstração sem credenciais: cinco produtos e preços **fictícios**, identificados como DEMO, sem URLs de afiliado.
- Pesquisa real preparada para a API do Mercado Livre, condicionada às permissões da sua aplicação.
- Filtro de título, acessórios, produto novo, anúncio ativo, disponibilidade e reputação verde.
- Conversor opcional de serviço externo, desligado por padrão.
- Painel local de revisão e arquivo `output/latest.json`, sem publicação automática.

## Iniciar no Linux com Docker

Pré-requisitos: Git, Docker Engine e Docker Compose v2. Instalação oficial: https://docs.docker.com/engine/install/

Se já clonou este repositório, faça `git pull`. Em uma cópia nova:

```bash
git clone https://github.com/Wesleyttiago/garimpo-smart-ml.git
cd garimpo-smart-ml/automation
bash setup.sh
```

O script cria `.env` com chave aleatória, inicia os dois serviços e importa o fluxo. Abra **http://localhost:5678**, crie seu usuário local do n8n e abra **Garimpo Smart - pesquisa e rascunho**. Clique para executar. Veja a prévia em **http://localhost:8078**.

Os serviços escutam apenas no seu computador. Essa configuração usa HTTP local; para hospedagem pública, configure HTTPS, autenticação e cookies seguros antes de expor portas. Não abra portas no roteador para este teste.

Para parar: `docker compose stop`. Para iniciar novamente: `docker compose up -d`. Não repita a importação depois de editar o fluxo: ela pode sobrescrever suas alterações.

## Testar sem Docker

Node.js 22 ou superior; o módulo não tem dependências.

```bash
cd automation
npm test
npm run demo
npm start
```

Abra http://localhost:8080. Esse comando inicia o painel, **não instala o n8n**. Se usar um n8n já instalado, importe `workflow.json` e troque a URL do nó HTTP para o endereço do worker acessível pela sua instalação.

## Pesquisa real: acesso necessário

1. Cadastre uma aplicação e obtenha um token OAuth autorizado, conforme https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao
2. Confira se a sua aplicação pode consultar os endpoints usados. A presença de um token não garante permissão para busca ampla.
3. Edite `.env` localmente: `ENABLE_LIVE_SEARCH=true` e `ML_ACCESS_TOKEN=...`.
4. Recrie o worker com `docker compose up -d --force-recreate worker`.
5. No nó **Modo de teste**, mude o JSON para `{"mode":"live"}`. Execute manualmente primeiro.

O código consulta `/sites/MLB/search`, `/items/{id}` e `/users/{seller_id}`. Respostas 401/403 interrompem a consulta correspondente; não há tentativa de obter cookies nem contornar restrições. Tokens vencidos precisam ser renovados; esta versão ainda não faz refresh OAuth.

A amostra é pequena (até cinco anúncios por consulta). A disponibilidade é um sinal, não uma contagem exata de estoque. O filtro não comprova qualidade, comissão ou elegibilidade por categoria. Reveja o anúncio e as regras do programa antes de usar o link.

## Links de afiliado: o que falta autorizar

Não encontramos uma API pública oficial documentada para gerar links de afiliado. O Mercado Livre orienta a geração pela Central ou Barra de Afiliados:
https://www.mercadolivre.com.br/l/comece-a-recomendar

Para testar uma rota automática, há um adaptador **opcional e desligado** para o serviço externo Bot do Afiliado. Ele não é uma integração oficial do Mercado Livre. Documentação do fornecedor:
https://botdoafiliado.com/blog/api-de-afiliados-do-mercado-livre/

O fornecedor exige uma conta própria, módulo de API, identificação de afiliado e configuração da sessão do Mercado Livre no painel dele. Avalie acesso, custos e termos antes de autorizar. Este projeto não coleta nem envia cookies do Mercado Livre. Não envie senhas, cookies ou tokens pelo chat.

Somente depois de escolher e autorizar o provedor, configure localmente:

```dotenv
AFFILIATE_PROVIDER_ENABLED=true
AFFILIATE_API_KEY=sua_chave_do_provedor
AFFILIATE_TRACKING_ID=seu_identificador_confirmado_no_provedor
```

Recrie o worker. O adaptador chama `POST /api/v1/convert-links` com `X-API-Key` e a URL selecionada, verifica a URL original, domínio de destino e identificador retornados, e salva `affiliateUrl` para revisão. Essa verificação **não confirma o pagamento de comissão**: valide o link e a atribuição na sua própria Central.

Sem essa configuração, a pesquisa ainda pode produzir candidatos reais, mas o campo `affiliateUrl` fica vazio. Nenhum link comum é apresentado como link de afiliado.

## Depois do teste

Confira os produtos no painel e os links na sua conta. Só então ative a agenda do n8n. Ela gera rascunhos, sem publicar na vitrine. Publicação automática, renovação OAuth, alertas e retirada de anúncios expirados ficam para uma próxima etapa.

## Arquivos

- `workflow.json`: fluxo n8n sem credenciais.
- `compose.yaml`, `setup.sh`, `.env.example`: ambiente local.
- `src/config.mjs`: nomes, buscas e termos exigidos.
- `src/core.mjs`: pesquisa, filtro e conversor opcional.
- `src/server.mjs`, `public/`: painel de revisão.
- `fixtures/products.json`: amostra fictícia.
- `test/core.test.mjs`: testes de filtros, autorização e vínculos dos links.

`.env`, saídas e dependências estão ignorados no Git. Nunca versione credenciais ou sessões.


# Conectar a conta do Mercado Livre

Esta etapa usa OAuth oficial para consultar produtos. Ela não gera links de afiliado por si só e não confirma acesso à busca pública: cada recurso precisa ser testado com a autorização da conta.

## Cadastro da aplicação

Em Minhas aplicações, configure:

- URI de redirect: `https://wesleyttiago.github.io/garimpo-smart-ml/automation/oauth-callback.html` (sem barra adicional no fim). Clique em Adicionar URI de redirect.
- Authorization Code e Refresh Token: ativados.
- Client Credentials: desativado. A conexão usa autorização da conta.
- PKCE: ativado. O configurador implementa S256.
- Unidade de negócio: Mercado Livre. VIS fica desativado.
- Usuários: Somente leitura, se o painel permitir editar; se for obrigatório e fixo, mantenha a opção exigida pelo painel e confira o consentimento.
- Publicação e sincronização: Somente leitura, para consultar items e prices.
- Demais permissões: Sem acesso.
- Tópicos: todos desmarcados. São assinaturas de notificações, não permissões para consultar produtos.
- URL de retorno de notificações: vazia.

Leia os termos e complete o captcha no próprio painel antes de criar a aplicação.

## Conectar no computador

No Ubuntu, um comando por vez:

```bash
cd ~/garimpo-smart-ml
git pull --ff-only
cd automation
bash connect-mercadolivre.sh
```

O terminal pede Client ID e Client Secret sem exibir o que foi digitado. Esses valores são obtidos no painel da aplicação e ficam no arquivo privado `.env` da instalação. Não cole as chaves no chat, GitHub ou formulário público.

1. Abra a URL de autorização que o terminal imprimir.
2. Entre com a conta proprietária e revise as permissões antes de autorizar.
3. O navegador volta à página HTTPS do seu projeto.
4. Clique em **Copiar resposta** e cole no terminal que iniciou a conexão.
5. O configurador valida o state, faz a troca com PKCE e confirma a conta via `/users/me`.

A página HTTPS não possui analytics, dependências externas ou conexão de rede via JavaScript. Remove code/state da barra de endereço após carregá-los e conserva a resposta apenas na memória dessa aba para cópia local. A hospedagem HTTPS recebe a requisição inicial com o código de uso único; PKCE impede a troca sem o verifier privado mantido no configurador local. A página não recebe tokens nem Client Secret.

Os tokens ficam em `output/mercadolivre-oauth.json`, com permissão 600; o servidor não disponibiliza esse arquivo por HTTP. Após reiniciar o worker, a pesquisa real continua **desativada**. O n8n e a vitrine não são publicados por esta etapa.

## Próxima etapa: testar o acesso

Depois da conexão, precisamos conferir o acesso real aos endpoints. Só então alteramos `ENABLE_LIVE_SEARCH` e o modo do fluxo. Respostas 401/403 são tratadas como falta de acesso, sem contornar bloqueios. A geração de links de afiliado permanece separada.

Quando o token estiver próximo do vencimento, o worker usa o refresh token uma única vez e guarda o substituto retornado pelo Mercado Livre. Uma conta revogada ou uma renovação recusada exige nova conexão. Faça a reconexão com o fluxo parado para não haver renovação simultânea entre configurador e worker.

Fontes oficiais:

- https://developers.mercadolivre.com.br/pt_br/crie-uma-aplicacao-no-mercado-livre
- https://developers.mercadolivre.com.br/pt_br/permissoes-funcionais/
- https://developers.mercadolivre.com.br/pt_br/autenticacao-e-autorizacao

Testes locais cobrem PKCE, state, validação de conta, gravação privada e renovação concorrente. A conexão com a conta real precisa ser concluída pelo proprietário.

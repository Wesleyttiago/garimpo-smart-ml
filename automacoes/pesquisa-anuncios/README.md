# Pesquisa de anúncios

Fluxo do n8n para buscar anúncios de Facebook e Instagram pela Apify e gerar um relatório.

## Usar

1. Importe `workflow.json` no n8n.
2. Configure uma credencial Header Auth: nome `Authorization` e valor `Bearer SEU_TOKEN_APIFY`.
3. Use essa credencial nos três nós HTTP da Apify.
4. Em **Parametros do piloto**, escolha o `produtoId` e informe o `runId` da coleta que quer consultar.
5. Execute o fluxo e baixe o JSON em **Baixar relatorio JSON**.

Deixe `criarNovaColeta=false` para reutilizar a coleta. Para uma nova pesquisa, use `true`: ela pode consumir saldo da Apify, com limite configurado de 10 resultados e US$ 0,25 por coleta.

Produtos: `mini-mop`, `dispenser-pasta` e `mini-processador`. Consulte uma coleta do mesmo produto escolhido. O relatório organiza anúncios, não comprova vendas.

Com Node.js 22 ou superior, `node build.mjs` gera o fluxo e `node --test test/*.test.mjs` roda os testes. Guarde o token nas credenciais do n8n, fora dos arquivos do projeto.

# Garimpo Smart · Casa & rotina

Blog em português com visual acolhedor, nove guias originais e uma aba de recomendações com 18 ideias: os dez itens da vitrine anterior e oito novas seleções de pesquisa. HTML, CSS e JavaScript puro. Sem avaliações, preços, testes de uso ou descontos inventados.

## Conteúdo

- `content.json`: três guias iniciais.
- `more-content.json`: seis guias de expansão.
- `products.json`: nomes, categorias, fotos, links principais e alternativos, finalidade e pontos de atenção dos dez produtos iniciais.
- `research-products.json`: oito novas ideias, fontes, modelos de referência e hipóteses de anúncio.
- `rooms.json`: ambientes usados pelos filtros e atalhos.
- `CURADORIA.md`: critérios de pesquisa e prioridades para testes de anúncio.
- `build.mjs`: gera as treze páginas, o sitemap e o arquivo de publicação estática.
- `dist/assets/`: estilos, filtros e imagens.

Execute `node build.mjs` para regenerar as páginas em `dist/`. Não há dependências a instalar. Para conferir localmente, use `python3 -m http.server 8000 --directory dist`.

## Recomendações

Os filtros agrupam os itens por Sala, Cozinha, Banheiro, Quarto, Área de serviço, Escritório e Entrada. Um produto pode aparecer em mais de um ambiente. Os atalhos da página inicial abrem a seleção correspondente.

Cinco produtos possuem os links fornecidos pelo responsável. Os cinco itens iniciais pendentes e as oito novas ideias ficam na seção **Em curadoria**, sem foto ou compra habilitada. Não foram substituídos por links genéricos. Para completar um item, edite seu `url` em `products.json` ou `research-products.json`, adicione a foto do modelo escolhido em `dist/assets/` e preencha `image`, `alt`, `width` e `height`. Revise título e características junto com o anúncio e regenere as páginas.

Os links são preservados com `rel="sponsored noopener noreferrer"`. Destino, preço, modelo, vendedor e disponibilidade devem ser conferidos no Mercado Livre. A existência de um link não comprova uma comissão. As imagens de cinco produtos vieram dos anúncios enviados pelo responsável; a imagem da cozinha é uma ambientação criada digitalmente.

## Publicação no GitHub

O blog público está em `Wesleyttiago/garimpo-smart-ml`, na pasta `blog/`. Nesse espelho, os dados e o gerador ficam na própria pasta `blog`; `node blog/build.mjs` escreve as páginas diretamente nela. A raiz do repositório é a área de curadoria, e `automation/` mantém o ambiente local do n8n e do servidor de revisão.

Blog: https://wesleyttiago.github.io/garimpo-smart-ml/blog/

## Curadoria e automação

O blog não chama a API do Mercado Livre e não recebe tokens. A área de curadoria pode importar `automation/output/latest.json`, sem enviar o arquivo para um servidor. O arquivo não fica salvo no navegador após o fechamento da página. Simulações são identificadas e não exibem links de compra. A seleção do backend é uma comparação por critérios técnicos; não prevê vendas ou conversão.

O erro 403 da pesquisa real continua pendente. Nenhuma busca real, geração de link, publicação automática, newsletter, pixel ou integração nova ao n8n foi ativada nesta entrega. A automação permanece separada e exige revisão antes de atualizar as recomendações públicas.
# Medição e primeiro teste

A integração de Google Analytics 4 está ativada para o fluxo `G-W03Z68ENB9` em `dist/assets/analytics-config.js`. A coleta depende da aceitação do visitante; o recebimento no painel deve ser conferido. O guia [PRIMEIRO-TESTE.md](PRIMEIRO-TESTE.md) contém a seleção inicial provisória, os passos de ativação, os eventos, os links por canal e três pautas de divulgação. Uma nova conta Analytics foi criada com autorização do responsável, com seis dimensões personalizadas de evento. A propriedade anterior foi preservada. Nenhuma campanha ou publicação em rede social foi criada.

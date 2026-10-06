# Garimpo Smart · Casa & rotina

Nove guias e 18 ideias de produtos, filtradas por sete ambientes.

Edite content.json ou more-content.json para os artigos, products.json para os produtos iniciais e research-products.json para as oito novas ideias. rooms.json define os ambientes. Execute `node blog/build.mjs` a partir da raiz para gerar as páginas.

CURADORIA.md registra fontes, modelos, critérios e prioridades de testes. As cinco ofertas existentes mantêm seus links; os 13 itens sem oferta definida ficam em curadoria. Os filtros aceitam mais de um ambiente por produto.

## Medição e primeiro teste

A integração GA4 está preparada e desativada em `assets/analytics-config.js`, aguardando o ID público da propriedade. Veja [PRIMEIRO-TESTE.md](PRIMEIRO-TESTE.md) para ativar, validar os eventos e preparar os três conteúdos iniciais. Não há resultados reais registrados ainda. A medição fica restrita ao blog público, após a aceitação do visitante.

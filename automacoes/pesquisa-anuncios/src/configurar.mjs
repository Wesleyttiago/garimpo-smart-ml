export function configurarPesquisa(config) {
  const terms = {'mini-mop':'mini mop','dispenser-pasta':'dispenser pasta','mini-processador':'mini processador'};
  if (!Object.prototype.hasOwnProperty.call(terms, config.produtoId)) throw new Error('Selecione um produto do piloto.');
  if (typeof config.criarNovaColeta !== 'boolean') throw new Error('criarNovaColeta deve ser verdadeiro ou falso.');
  if (!Number.isInteger(config.limite) || config.limite < 1 || config.limite > 10) throw new Error('O piloto permite de 1 a 10 anúncios.');
  if (!Number.isFinite(config.custoMaximoUsd) || config.custoMaximoUsd <= 0 || config.custoMaximoUsd > 0.25) throw new Error('O teto do piloto é US$ 0,25 por coleta.');
  if (!config.criarNovaColeta && !/^[a-zA-Z0-9]{17}$/.test(config.runId || '')) throw new Error('Informe o Run ID privado da Apify ou escolha criarNovaColeta=true.');
  const term = terms[config.produtoId];
  return {...config, input:{
    startUrls:[{url:'https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=' + encodeURIComponent(term) + '&search_type=keyword_unordered'}],
    resultsLimit: config.limite, onlyTotal:false, includeAboutPage:false,
    isDetailsPerAd:false, enrichWithEcommerceData:false
  }};
}

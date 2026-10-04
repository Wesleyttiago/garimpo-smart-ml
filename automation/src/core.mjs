import { readFile } from 'node:fs/promises';
import { queries } from './config.mjs';

const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const approvedHosts = new Set(['www.mercadolivre.com.br', 'mercadolivre.com.br', 'produto.mercadolivre.com.br', 'www.mercadolivre.com', 'mercadolivre.com', 'meli.la']);
export function marketUrl(value) {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && approvedHosts.has(url.hostname); }
  catch { return false; }
}
export function selectCandidate(items, specification, seen = new Set()) {
  const eligible = items.filter(item => {
    const words = normalize(item.title).split(/[^a-z0-9]+/);
    return !seen.has(item.id) && item.condition === 'new' && item.status === 'active'
      && Number(item.available_quantity) > 0 && item.seller_green === true
      && Number.isFinite(item.price) && item.price > 0
      && specification.terms.every(term => words.includes(normalize(term)))
      && !/\b(capa|refil|suporte|adesivo|pelicula|peca)\b/.test(normalize(item.title));
  });
  // Menor preço entre candidatos equivalentes. Não inventa avaliações nem vendas.
  eligible.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  return eligible[0] ?? null;
}
async function requestJson(fetcher, url, options = {}) {
  const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('API respondeu HTTP ' + response.status + '. Verifique permissões e credenciais.');
  return response.json();
}
export async function searchLive(specification, env, fetcher = fetch) {
  if (env.ENABLE_LIVE_SEARCH !== 'true' || !env.ML_ACCESS_TOKEN) {
    throw new Error('Pesquisa real bloqueada: configure acesso autorizado à API e ENABLE_LIVE_SEARCH=true.');
  }
  const headers = { Authorization: 'Bearer ' + env.ML_ACCESS_TOKEN };
  const search = await requestJson(fetcher, 'https://api.mercadolibre.com/sites/MLB/search?q=' + encodeURIComponent(specification.query) + '&limit=10', { headers });
  if (!Array.isArray(search.results)) throw new Error('Resposta de busca sem resultados reconhecidos.');
  const items = [];
  // Limite pequeno para o teste; reputação e estoque precisam de confirmação.
  for (const candidate of search.results.slice(0, 5)) {
    if (!/^MLB\d+$/.test(candidate.id ?? '')) continue;
    const item = await requestJson(fetcher, 'https://api.mercadolibre.com/items/' + candidate.id, { headers });
    if (!Number.isSafeInteger(item.seller_id) || item.id !== candidate.id) continue;
    const seller = await requestJson(fetcher, 'https://api.mercadolibre.com/users/' + item.seller_id, { headers });
    items.push({ ...item, seller_green: ['4_light_green', '5_green'].includes(seller.seller_reputation?.level_id) });
  }
  return items;
}
export function validateConversion(result, original, trackingId) {
  if (result.success !== true || result.url_original !== original || !trackingId
      || result.tracking_id !== trackingId || result.site !== 'mercadolivre'
      || result.provider !== 'mercadolivre' || !marketUrl(result.affiliate_url)) {
    throw new Error('Conversão não confirmou o produto, provedor e identificador configurados.');
  }
  return result.affiliate_url;
}
export async function convertLink(original, env, fetcher = fetch) {
  if (env.AFFILIATE_PROVIDER_ENABLED !== 'true') return { url: null, state: 'pending_authorization' };
  if (!env.AFFILIATE_API_KEY || !env.AFFILIATE_TRACKING_ID) {
    throw new Error('Provedor ativado sem chave de API e identificador de afiliado.');
  }
  if (!marketUrl(original)) throw new Error('URL do produto fora dos domínios permitidos.');
  // Serviço externo opcional. A sessão do Mercado Livre é configurada pelo usuário no provedor.
  const result = await requestJson(fetcher, 'https://botdoafiliado.com/api/v1/convert-links', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-API-Key': env.AFFILIATE_API_KEY },
    body: JSON.stringify({ url: original }),
  });
  return { url: validateConversion(result, original, env.AFFILIATE_TRACKING_ID), state: 'provider_generated_review_required' };
}
export async function runCatalog({ mode = 'demo' } = {}, env = process.env, fetcher = fetch) {
  if (!['demo', 'live'].includes(mode)) throw new Error('Modo inválido. Use demo ou live.');
  if (mode === 'live' && (env.ENABLE_LIVE_SEARCH !== 'true' || !env.ML_ACCESS_TOKEN)) {
    throw new Error('Pesquisa real bloqueada: falta configurar o acesso autorizado à API.');
  }
  const fixture = mode === 'demo' ? JSON.parse(await readFile(new URL('../fixtures/products.json', import.meta.url), 'utf8')) : null;
  const selected = new Set();
  const deadline = AbortSignal.timeout(150000);
  const boundedFetcher = (url, options) => fetcher(url, { ...options, signal: AbortSignal.any([deadline, options.signal]) });
  const products = [];
  const issues = [];
  for (const specification of queries) {
    if (deadline.aborted) { issues.push({ id: specification.id, message: 'Limite de tempo atingido. Execute novamente mais tarde.' }); break; }
    try {
      const items = fixture ?? await searchLive(specification, env, boundedFetcher);
      const item = selectCandidate(items, specification, selected);
      if (!item) { issues.push({ id: specification.id, message: 'Nenhum candidato elegível nesta consulta.' }); continue; }
      if (mode === 'live' && !marketUrl(item.permalink)) throw new Error('Produto sem URL válida do Mercado Livre.');
      selected.add(item.id);
      let conversion = { url: null, state: mode === 'demo' ? 'demo_no_commission' : 'pending_authorization' };
      if (mode === 'live') {
        try { conversion = await convertLink(item.permalink, env, boundedFetcher); }
        catch { issues.push({ id: specification.id, message: 'Falha na conversão: verifique a conta e as configurações do provedor.' }); conversion.state = 'conversion_failed'; }
      }
      const image = typeof item.thumbnail === 'string' && /^https:\/\/[^/]+\.mlstatic\.com\//.test(item.thumbnail) ? item.thumbnail : null;
      products.push({
        id: specification.id, itemId: item.id, title: item.title, category: specification.category,
        price: item.price, image, productUrl: item.permalink, affiliateUrl: conversion.url,
        linkState: conversion.state, reasons: ['Título compatível', 'Produto novo e ativo', 'Disponível', 'Reputação verde'],
        simulation: mode === 'demo', reviewRequired: true, publishable: false,
      });
    } catch { issues.push({ id: specification.id, message: 'Consulta bloqueada ou indisponível. Verifique o acesso à API; nenhum link foi criado.' }); }
  }
  return {
    mode, status: issues.length ? (products.length ? 'partial' : 'blocked') : 'draft',
    createdAt: new Date().toISOString(), count: products.length, products, issues,
    notice: mode === 'demo' ? 'SIMULAÇÃO. Produtos e preços fictícios. Sem links de afiliado e sem comissões.' : 'Rascunho para revisão. Preço e disponibilidade devem ser conferidos no anúncio. Comissão não foi verificada.',
    published: false,
  };
}

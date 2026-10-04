import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCatalog, selectCandidate, marketUrl, searchLive, convertLink, validateConversion } from '../src/core.mjs';
import { queries } from '../src/config.mjs';

const original = 'https://produto.mercadolivre.com.br/MLB-123-item-_JM';
const item = {id:'MLB123',title:'Mini impressora térmica portátil Bluetooth',price:80,condition:'new',status:'active',available_quantity:2,seller_green:true};
const conversion = {success:true,url_original:original,affiliate_url:'https://meli.la/example-test',tracking_id:'test-tag',site:'mercadolivre',provider:'mercadolivre'};
test('demo seleciona cinco candidatos sem links, comissão ou publicação',async()=>{
  const result=await runCatalog({mode:'demo'}, {AFFILIATE_PROVIDER_ENABLED:'true'},()=>{throw Error('Não deve chamar serviços externos');});
  assert.equal(result.count,5);assert.equal(result.published,false);
  assert.ok(result.products.every(p=>p.simulation && p.affiliateUrl===null && p.publishable===false));
  assert.equal(new Set(result.products.map(p=>p.itemId)).size,5);
});
test('rejeita usado, inativo, indisponível e reputação fora do verde',()=>{
  for(const change of [{condition:'used'},{status:'paused'},{available_quantity:0},{seller_green:false},{seller_green:undefined}]){
    assert.equal(selectCandidate([{...item,...change}],queries[0]),null);
  }
});
test('rejeita acessórios e títulos incompatíveis',()=>{
  for(const title of ['Capa para mini impressora térmica Bluetooth','Garrafa Bluetooth','Adesivo para impressora térmica Bluetooth']){
    assert.equal(selectCandidate([{...item,title}],queries[0]),null);
  }
});
test('não repete o mesmo anúncio em outra seleção',()=>{
  assert.equal(selectCandidate([item],queries[0],new Set([item.id])),null);
});
test('prioriza menor preço e rejeita preço ausente ou inválido',()=>{
  assert.equal(selectCandidate([item,{...item,id:'MLB124',price:60}],queries[0]).id,'MLB124');
  for(const price of [0,-1,NaN,undefined,'10'])assert.equal(selectCandidate([{...item,price}],queries[0]),null);
});
test('pesquisa real exige ativação e acesso autorizado',async()=>{
  await assert.rejects(runCatalog({mode:'live'},{}),/bloqueada/);
  await assert.rejects(searchLive(queries[0],{ML_ACCESS_TOKEN:'test'}),/bloqueada/);
});
test('401 e 403 são erros, sem tentar reaproveitar cookies',async()=>{
  for(const status of [401,403])await assert.rejects(
    searchLive(queries[0],{ENABLE_LIVE_SEARCH:'true',ML_ACCESS_TOKEN:'test'},async()=>({ok:false,status})),new RegExp(String(status)));
});
test('consulta autenticada confirma item e reputação do vendedor',async()=>{
  const calls=[];
  const result=await searchLive(queries[0],{ENABLE_LIVE_SEARCH:'true',ML_ACCESS_TOKEN:'test'},async(url,options)=>{
    calls.push(url);assert.equal(options.headers.Authorization,'Bearer test');
    const data=url.includes('/search?')?{results:[{id:'MLB123'}]}:url.endsWith('/items/MLB123')?{...item,seller_id:12}:{seller_reputation:{level_id:'5_green'}};
    return {ok:true,json:async()=>data};
  });
  assert.equal(calls.length,3);assert.equal(result[0].seller_green,true);
});
test('domínios enganosos, protocolos e credenciais na URL são rejeitados',()=>{
  for(const url of ['https://meli.la.evil.example/a','http://meli.la/a','javascript:alert(1)','https://u:p@meli.la/a'])assert.equal(marketUrl(url),false);
  assert.equal(marketUrl(original),true);
});
test('conversão desligada não transmite dados a terceiros',async()=>{
  assert.deepEqual(await convertLink(original,{},()=>{throw Error('Sem autorização');}),{url:null,state:'pending_authorization'});
});
test('conversão valida produto original, domínio e identificador do afiliado',()=>{
  assert.equal(validateConversion(conversion,original,'test-tag'),conversion.affiliate_url);
  for(const change of [{url_original:original+'other'},{tracking_id:'wrong'},{affiliate_url:'https://evil.example/x'},{success:false},{site:'other'},{provider:'other'}]){
    assert.throws(()=>validateConversion({...conversion,...change},original,'test-tag'),/não confirmou/);
  }
});
test('adaptador usa somente chave de API e exige identificador de rastreamento',async()=>{
  await assert.rejects(convertLink(original,{AFFILIATE_PROVIDER_ENABLED:'true',AFFILIATE_API_KEY:'test'}),/identificador/);
  const result=await convertLink(original,{AFFILIATE_PROVIDER_ENABLED:'true',AFFILIATE_API_KEY:'test',AFFILIATE_TRACKING_ID:'test-tag'},async(url,options)=>{
    assert.equal(url,'https://botdoafiliado.com/api/v1/convert-links');
    assert.deepEqual(JSON.parse(options.body),{url:original});
    assert.equal(options.headers['X-API-Key'],'test');
    assert.equal(options.headers.Cookie,undefined);
    return {ok:true,json:async()=>conversion};
  });
  assert.equal(result.state,'provider_generated_review_required');
});
test('modo desconhecido é rejeitado',async()=>await assert.rejects(runCatalog({mode:'production'}),/Modo inválido/));


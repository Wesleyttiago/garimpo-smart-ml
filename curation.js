'use strict';
const $=id=>document.getElementById(id);
const root=document.documentElement;
const themeButton=$('theme-toggle');
function theme(value){root.dataset.theme=value;themeButton.setAttribute('aria-pressed',String(value==='dark'));themeButton.setAttribute('aria-label',value==='dark'?'Ativar tema claro':'Ativar tema escuro');}
try{theme(localStorage.getItem('garimpo-smart:theme')==='dark'?'dark':'light');}catch{theme('light');}
themeButton.addEventListener('click',()=>{const next=root.dataset.theme==='dark'?'light':'dark';theme(next);try{localStorage.setItem('garimpo-smart:theme',next);}catch{}});
const marketHosts=new Set(['meli.la','www.mercadolivre.com.br','mercadolivre.com.br','produto.mercadolivre.com.br','www.mercadolivre.com','mercadolivre.com']);
function safeMarket(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&marketHosts.has(u.hostname)?u.href:null;}catch{return null;}}
function safeImage(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&u.hostname.endsWith('.mlstatic.com')?u.href:null;}catch{return null;}}
function element(tag,text,cls){const n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
const currency=new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
const labels={pending_authorization:'Link de afiliado ainda não gerado',conversion_failed:'Conversão pendente',provider_generated_review_required:'Link gerado pelo provedor: confira na sua conta'};
let records=[];let importGeneration=0;
function filter(){const q=$('candidate-search').value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();let count=0;for(const card of $('products').children){card.hidden=!card.dataset.search.includes(q);if(!card.hidden)count++;}$('result-count').textContent=count+' '+(count===1?'candidato':'candidatos');$('empty').hidden=count!==0;const title=$('empty').querySelector('h3'),text=$('empty').querySelector('p');title.textContent=records.length?'Nenhum candidato com esse termo.':'Sua próxima seleção aparece aqui.';text.textContent=records.length?'Tente outro nome ou categoria.':'Rode o fluxo no ambiente local e carregue os resultados para comparar. Nenhum produto é publicado no blog automaticamente.';}
function render(data){
  records=data.products;
  $('products').replaceChildren();$('issues').replaceChildren();
  const demo=data.mode==='demo';
  for(const p of records){
    const simulated=demo||p.simulation===true;
    const card=element('article',null,'product-card');card.dataset.search=(p.title+' '+(p.category||'')).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const visual=element('div',null,'product-visual');const image=safeImage(p.image);
    if(image){const img=element('img');img.src=image;img.alt=p.title;img.loading='lazy';img.decoding='async';visual.append(img);}else visual.textContent='◇';
    const body=element('div',null,'product-body');body.append(element('p',simulated?'DEMO · SEM COMISSÃO':'SELECIONADO PARA REVISÃO','product-tag'),element('h3',p.title));
    body.append(element('p',Number.isFinite(p.price)&&p.price>0?(simulated?'Preço fictício: ':'Preço consultado: ')+currency.format(p.price):'Preço não informado','price'));
    if(Array.isArray(p.reasons)){const list=element('ul');for(const reason of p.reasons.filter(x=>typeof x==='string').slice(0,8))list.append(element('li',reason.slice(0,200)));body.append(list);}
    body.append(element('p',simulated?'Simulação. Este resultado não comprova uma oferta real.':(labels[p.linkState]||'Revise anúncio, disponibilidade e vínculo de afiliado. Comissão não confirmada.'),'link-state'));
    if(!simulated){for(const [value,label,affiliate] of [[p.productUrl,'Conferir anúncio no Mercado Livre',false],[p.affiliateUrl,'Conferir link de afiliado',true]]){const href=safeMarket(value);if(href){const a=element('a',label,'button'+(affiliate?' outline':''));a.href=href;a.target='_blank';a.rel=(affiliate?'sponsored ':'')+'noopener noreferrer';body.append(a);}}}
    card.append(visual,body);$('products').append(card);
  }
  for(const issue of (data.issues||[]).slice(0,20))if(typeof issue.message==='string')$('issues').append(element('p',(typeof issue.id==='string'?issue.id+': ':'')+issue.message.slice(0,500)));
  $('status').textContent=demo?'SIMULAÇÃO. Produtos e preços fictícios, sem links de compra e sem comissões.':records.some(p=>p.simulation===true)?'Arquivo com simulações. Confira os rótulos de cada candidato; resultados não publicados.':'Resultados importados para revisão. Nenhuma oferta, comissão ou vencedor comercial foi confirmado por esta página.';
  $('clear').disabled=false;$('results-toolbar').hidden=false;$('candidate-search').value='';filter();
}
$('result-file').addEventListener('change',async event=>{
  const file=event.target.files[0];if(!file)return;
  const generation=++importGeneration;
  try{
    if(file.size>1024*1024)throw Error('Use um arquivo de resultados com até 1 MB.');
    const data=JSON.parse(await file.text());
    if(!data||!['demo','live','empty'].includes(data.mode)||!Array.isArray(data.products)||data.products.length>100||(data.mode==='empty'&&data.products.length)||!data.products.every(p=>p&&typeof p.title==='string'&&p.title.length>0&&p.title.length<=500)||(data.issues!==undefined&&(!Array.isArray(data.issues)||!data.issues.every(x=>x&&typeof x.message==='string'))))throw Error('Selecione latest.json gerado pela automação. O arquivo precisa conter mode e products válidos.');
    if(generation===importGeneration)render(data);
  }catch(error){if(generation===importGeneration)$('status').textContent=error instanceof SyntaxError?'JSON inválido. Selecione o arquivo de resultados da automação.':error.message;}
  finally{if(generation===importGeneration)event.target.value='';}
});
$('candidate-search').addEventListener('input',filter);
$('clear').addEventListener('click',()=>{importGeneration++;records=[];$('products').replaceChildren();$('issues').replaceChildren();$('candidate-search').value='';$('result-file').value='';$('clear').disabled=true;$('results-toolbar').hidden=true;$('status').textContent='Nenhum resultado carregado.';filter();});

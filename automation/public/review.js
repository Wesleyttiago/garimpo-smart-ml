const status = document.querySelector('#status');
const grid = document.querySelector('#products');
const issues = document.querySelector('#issues');
const labels = { demo_no_commission:'Simulação · sem comissão', pending_authorization:'Link pendente de autorização', conversion_failed:'Conversão pendente', provider_generated_review_required:'Link gerado · confira na sua conta' };
const currency = new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'});
function el(tag,text,cls){const node=document.createElement(tag);if(text)node.textContent=text;if(cls)node.className=cls;return node;}
function render(data){
  status.textContent=data.notice || 'Sem resultados.';
  grid.replaceChildren();issues.replaceChildren();
  for(const p of data.products){
    const card=el('article',null,'card'),visual=el('div',null,'visual');
    if(p.image){const img=el('img');img.src=p.image;img.alt=p.title;img.loading='lazy';visual.append(img);}else visual.textContent='◇';
    const content=el('div',null,'content');content.append(el('span',p.simulation?'DEMO':'CANDIDATO','tag'),el('h2',p.title),el('div',(p.simulation?'Preço fictício: ':'Preço consultado: ')+currency.format(p.price),'price'));
    const list=el('ul');for(const reason of p.reasons)list.append(el('li',reason));content.append(list,el('p',labels[p.linkState]||'Revisão pendente'));
    if(!p.simulation){
      const link=el('a','Conferir anúncio no Mercado Livre');link.href=p.productUrl;link.target='_blank';link.rel='noopener noreferrer';content.append(link);
      if(p.affiliateUrl){const affiliate=el('a','Conferir link de afiliado');affiliate.href=p.affiliateUrl;affiliate.target='_blank';affiliate.rel='sponsored noopener noreferrer';content.append(affiliate);}
    }
    card.append(visual,content);grid.append(card);
  }
  for(const issue of data.issues)issues.append(el('p',issue.id+': '+issue.message));
}
async function refresh(){const r=await fetch('/api/results');if(!r.ok)throw Error();render(await r.json());}
document.querySelector('#refresh').addEventListener('click',()=>refresh().catch(()=>status.textContent='Não foi possível atualizar.'));
document.querySelector('#run').addEventListener('click',async event=>{
  const button=event.currentTarget;button.disabled=true;status.textContent='Selecionando candidatos de demonstração…';
  try{const r=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mode:'demo'})});const data=await r.json();if(!r.ok)throw Error(data.error);render(data);}
  catch(error){status.textContent=error.message||'Falha ao executar.';}finally{button.disabled=false;}
});
refresh().catch(()=>status.textContent='Inicie o servidor para carregar os resultados.');


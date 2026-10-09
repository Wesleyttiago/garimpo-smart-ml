'use strict';
const cards=[...document.querySelectorAll('.guide-card[data-category]')];
const search=document.getElementById('search');
const buttons=[...document.querySelectorAll('[data-filter]')];
let category='Todos';
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function filter(){if(!search)return;const q=normalize(search.value.trim());let count=0;for(const card of cards){const visible=(category==='Todos'||card.dataset.category===category)&&normalize(card.dataset.search).includes(q);card.hidden=!visible;if(visible)count++;}document.getElementById('search-status').textContent=count===1?'1 guia encontrado.':count+' guias encontrados.';document.getElementById('empty').hidden=count!==0;}
for(const button of buttons)button.addEventListener('click',()=>{category=button.dataset.filter;for(const b of buttons){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));}filter();});
search?.addEventListener('input',filter);
document.getElementById('reset-search')?.addEventListener('click',()=>{search.value='';category='Todos';for(const b of buttons){const active=b.dataset.filter==='Todos';b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}filter();search.focus();});

// Os produtos possuem filtros próprios, independentes da busca dos artigos.
const productCards=[...document.querySelectorAll('[data-product-card]')];
const productSearch=document.getElementById('product-search');
const productButtons=[...document.querySelectorAll('[data-product-filter]')];
let productRoom='Todas';
const roomSlug=s=>normalize(s).replace(/\s+/g,'-');
function filterProducts(){
  if(!productSearch)return;
  const q=normalize(productSearch.value.trim());let total=0,offers=0;
  for(const card of productCards){
    const rooms=JSON.parse(card.dataset.productRooms);
    const show=(productRoom==='Todas'||rooms.includes(productRoom))&&normalize(card.dataset.productSearch).includes(q);
    card.hidden=!show;if(show){total++;if(card.querySelector('a[rel~="sponsored"]'))offers++;}
  }
  for(const section of document.querySelectorAll('[data-product-section]'))section.hidden=![...section.querySelectorAll('[data-product-card]')].some(card=>!card.hidden);
  document.getElementById('product-status').textContent=total+' '+(total===1?'ideia':'ideias')+' · '+offers+' com link de oferta · '+(total-offers)+' em curadoria';
  document.getElementById('product-empty').hidden=total!==0;
}
function setProductRoom(button,updateUrl=true){
  productRoom=button.dataset.productFilter;
  for(const b of productButtons){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));}
  if(updateUrl){const url=new URL(location.href);if(productRoom==='Todas')url.searchParams.delete('ambiente');else url.searchParams.set('ambiente',roomSlug(productRoom));history.replaceState(null,'',url);}
  filterProducts();
}
for(const button of productButtons)button.addEventListener('click',()=>setProductRoom(button));
productSearch?.addEventListener('input',filterProducts);
document.getElementById('reset-products')?.addEventListener('click',()=>{productSearch.value='';productButtons[0].click();productSearch.focus();});
if(productSearch){
  const requested=new URLSearchParams(location.search).get('ambiente');
  const button=productButtons.find(b=>roomSlug(b.dataset.productFilter)===requested)||productButtons[0];
  setProductRoom(button,false);
}

// Compartilha a URL pública da página, sem buscas ou parâmetros do visitante.
const shareButton=document.querySelector('[data-share-page]');
const shareStatus=document.querySelector('[data-share-status]');
const copyField=document.querySelector('[data-share-copy]');
shareButton?.addEventListener('click',async()=>{
  const url=shareButton.dataset.sharePage;
  if(!url||!shareStatus)return;
  shareStatus.textContent='';
  if(copyField)copyField.hidden=true;
  try{
    if(typeof navigator.share==='function'){
      await navigator.share({title:document.title,url});
      shareStatus.textContent='Compartilhamento concluído.';
    }else if(navigator.clipboard?.writeText){
      await navigator.clipboard.writeText(url);
      shareStatus.textContent='Link copiado. Cole onde quiser compartilhar.';
    }else{
      throw new Error('Copiar manualmente');
    }
  }catch(error){
    if(error.name==='AbortError')return;
    shareStatus.textContent='Copie o link abaixo para compartilhar.';
    if(copyField){copyField.hidden=false;copyField.value=url;copyField.focus();copyField.select();}
  }
});

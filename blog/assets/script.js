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
let productCategory='Todas';
function filterProducts(){
  if(!productSearch)return;
  const q=normalize(productSearch.value.trim());let total=0,offers=0;
  for(const card of productCards){
    const show=(productCategory==='Todas'||card.dataset.productCategory===productCategory)&&normalize(card.dataset.productSearch).includes(q);
    card.hidden=!show;if(show){total++;if(card.querySelector('a[rel~="sponsored"]'))offers++;}
  }
  for(const section of document.querySelectorAll('[data-product-section]'))section.hidden=![...section.querySelectorAll('[data-product-card]')].some(card=>!card.hidden);
  document.getElementById('product-status').textContent=total+' '+(total===1?'ideia':'ideias')+' · '+offers+' com link de oferta · '+(total-offers)+' em curadoria';
  document.getElementById('product-empty').hidden=total!==0;
}
for(const button of productButtons)button.addEventListener('click',()=>{
  productCategory=button.dataset.productFilter;
  for(const b of productButtons){b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));}
  filterProducts();
});
productSearch?.addEventListener('input',filterProducts);
document.getElementById('reset-products')?.addEventListener('click',()=>{productSearch.value='';productButtons[0].click();productSearch.focus();});
if(productSearch)filterProducts();

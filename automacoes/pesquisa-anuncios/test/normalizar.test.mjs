import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizarAnuncios} from '../src/normalizar.mjs';
import {configurarPesquisa} from '../src/configurar.mjs';
const options={coletadoEm:'2026-10-06T03:32:35.848Z'};
const ad=(id,body,rest={})=>({adArchiveId:id,pageName:'Loja de teste',isActive:true,snapshot:{body:{text:body}},...rest});
test('catalogo com mini e mop em cartoes diferentes nao vira mini mop',()=>{
  const result=normalizarAnuncios([ad('1','Casa organizada',{snapshot:{cards:[{title:'Mop de chão com balde'},{title:'Mini ar portátil'}]}})],options);
  assert.equal(result.resumo.relevantes,0);
});
test('correspondencia, inativos e duplicatas sao tratados separadamente',()=>{
  const result=normalizarAnuncios([ad('1','Mini mop para pia'),ad('1','Mini mop para pia'),ad('2','Mini mop portátil',{isActive:false}),ad('3','Projetor de luz')],options);
  assert.deepEqual(result.resumo,{recebidos:4,duplicadosPorId:1,relevantes:1,descartados:2,anunciantesDistintos:1});
  assert.equal(result.anuncios[0].desempenho.vendas,null);
});
test('cartao relevante e URL segura funcionam com texto dinamico de catalogo',()=>{
  const result=normalizarAnuncios([ad('1','{{product.description}}',{snapshot:{title:'{{product.name}}',cards:[{title:'Mini Mop de pia',linkUrl:'https://loja.example/mop',body:'Praticidade'}]}})],options);
  assert.equal(result.anuncios[0].destinoUrl,'https://loja.example/mop');
});
test('campos ausentes, datas futuras e URLs invalidas nao sao fabricados',()=>{
  const result=normalizarAnuncios([ad('1','Mini-mop',{startDateFormatted:'2030-01-01',isActive:undefined,snapshot:{body:{text:'Mini-mop'},linkUrl:'javascript:alert(1)'}})],options);
  assert.equal(result.anuncios[0].inicioInformado,null);
  assert.equal(result.anuncios[0].diasDesdeInicioInformado,null);
  assert.equal(result.anuncios[0].ativo,null);
  assert.equal(result.anuncios[0].destinoUrl,null);
});
test('limites impedem nova coleta exagerada e reutilizacao sem ID',()=>{
  const config={criarNovaColeta:true,produtoId:'mini-mop',limite:10,custoMaximoUsd:0.25};
  assert.throws(()=>configurarPesquisa({...config,limite:11}),/1 a 10/);
  assert.throws(()=>configurarPesquisa({...config,custoMaximoUsd:2}),/0,25/);
  assert.throws(()=>configurarPesquisa({...config,criarNovaColeta:false,runId:''}),/Run ID/);
  assert.equal(configurarPesquisa(config).input.startUrls.length,1);
  assert.match(configurarPesquisa(config).input.startUrls[0].url,/country=BR/);
});

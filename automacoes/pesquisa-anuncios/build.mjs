import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {configurarPesquisa} from './src/configurar.mjs';
import {normalizarAnuncios} from './src/normalizar.mjs';

await mkdir(new URL('./dist/',import.meta.url),{recursive:true});
const node = (id,name,type,version,position,parameters,extra={}) => ({id,name,type:'n8n-nodes-base.'+type,typeVersion:version,position,parameters,...extra});
const http = {authentication:'genericCredentialType',genericAuthType:'httpHeaderAuth',options:{timeout:30000,response:{response:{responseFormat:'json'}}}};
const condition = field => ({conditions:{boolean:[{value1:'={{ $json.'+field+' }}',operation:'equal',value2:true}]},combineOperation:'all'});
const config = {criarNovaColeta:false,runId:'',produtoId:'mini-mop',limite:10,custoMaximoUsd:0.25};
const configCode = configurarPesquisa.toString() + '\nreturn [{json:configurarPesquisa($input.first().json)}];';
const classifyCode = `const run = $input.first().json.data;
if (!run || !/^[a-zA-Z0-9]{17}$/.test(run.id || '')) throw new Error('Resposta de execução inválida.');
if (run.status === 'SUCCEEDED') {
  if (!/^[a-zA-Z0-9]{17}$/.test(run.defaultDatasetId || '')) throw new Error('Dataset ausente.');
  return [{json:{...run,pronto:true}}];
}
if (!['READY','RUNNING'].includes(run.status)) throw new Error('Coleta encerrada com status ' + run.status + '. Confira a execução na Apify; não reinicie automaticamente.');
if ($runIndex >= 19) throw new Error('Limite de espera atingido. Consulte a mesma execução depois, sem iniciar outra coleta.');
return [{json:{...run,pronto:false}}];`;
const normalizeCode = normalizarAnuncios.toString() + `
const records = $input.all().flatMap(item => Array.isArray(item.json) ? item.json : Object.keys(item.json).length ? [item.json] : []);
const params = $('Validar limites').first().json;
return [{json:normalizarAnuncios(records,{produtoId:params.produtoId})}];`;
const workflow = {
  id:'garimpoAdsPilot01',name:'Garimpo Smart - pesquisa de anuncios (piloto)',active:false,
  nodes:[
    node('manual','Testar pesquisa','manualTrigger',1,[0,180],{}),
    node('params','Parametros do piloto','set',3.4,[240,180],{mode:'raw',jsonOutput:JSON.stringify(config,null,2),options:{}}),
    node('validate','Validar limites','code',2,[480,180],{jsCode:configCode}),
    node('new','Criar nova coleta?','if',1,[720,180],condition('criarNovaColeta')),
    node('start','Iniciar coleta Apify','httpRequest',4.2,[960,40],{...http,method:'POST',url:'https://api.apify.com/v2/actors/apify~facebook-ads-scraper/runs',sendQuery:true,queryParameters:{parameters:[{name:'timeout',value:'300'},{name:'maxTotalChargeUsd',value:'={{ $json.custoMaximoUsd }}'},{name:'restartOnError',value:'false'}]},sendBody:true,contentType:'json',specifyBody:'json',jsonBody:'={{ JSON.stringify($json.input) }}'},{retryOnFail:false}),
    node('get','Consultar execucao Apify','httpRequest',4.2,[1200,180],{...http,url:'={{ "https://api.apify.com/v2/actor-runs/" + ($json.data?.id || $json.id || $json.runId) }}',sendQuery:true,queryParameters:{parameters:[{name:'waitForFinish',value:'10'}]}},{retryOnFail:false}),
    node('status','Conferir status','code',2,[1440,180],{jsCode:classifyCode}),
    node('ready','Coleta concluida?','if',1,[1680,180],condition('pronto')),
    node('wait','Aguardar 5 segundos','wait',1.1,[1680,420],{resume:'timeInterval',amount:5,unit:'seconds'},{webhookId:randomUUID()}),
    node('dataset','Buscar anuncios Apify','httpRequest',4.2,[1920,100],{...http,url:'={{ "https://api.apify.com/v2/datasets/" + $json.defaultDatasetId + "/items" }}',sendQuery:true,queryParameters:{parameters:[{name:'format',value:'json'},{name:'clean',value:'true'},{name:'limit',value:'={{ $("Validar limites").first().json.limite }}'}]}},{retryOnFail:false,alwaysOutputData:true}),
    node('normalize','Filtrar e organizar','code',2,[2160,100],{jsCode:normalizeCode}),
    node('download','Baixar relatorio JSON','convertToFile',1.1,[2400,100],{operation:'toJson',mode:'each',binaryPropertyName:'data',options:{fileName:'garimpo-pesquisa-anuncios.json',format:true}}),
    node('guide','Como conectar','stickyNote',1,[240,-260],{content:'## Primeiro uso\n1. Importe e abra Parametros do piloto.\n2. A cópia pessoal reutiliza a coleta já feita.\n3. Nos 3 nós Apify, escolha a mesma credencial Header Auth: Authorization / Bearer + sua chave (somente no n8n).\n4. Execute Testar pesquisa.\n5. Baixe o relatório no último nó.\nSem agenda. US$ 0,25 e 10 resultados por nova coleta.\nNão copie Run IDs ou chaves para o GitHub.',height:340,width:660}),
    node('evidence','Sobre os resultados','stickyNote',1,[1920,360],{content:'## Critério de revisão\nA busca pode trazer itens sem relação. O filtro confere nome, texto e cartões, removendo IDs duplicados da mesma coleta.\nA pontuação só ajuda a revisar referências; vendas/lucro/ROAS ficam desconhecidos.\nHistórico entre consultas e agenda serão configurados após validar a instalação local.',height:270,width:660})
  ],connections:{},settings:{executionOrder:'v1',timezone:'America/Recife',executionTimeout:600,saveManualExecutions:true},pinData:{},tags:[]
};
const connect=(from,to,index=0)=>{
  const entry=workflow.connections[from] ||= {main:[]};
  entry.main[index] ||= [];
  entry.main[index].push({node:to,type:'main',index:0});
};
connect('Testar pesquisa','Parametros do piloto');connect('Parametros do piloto','Validar limites');
connect('Validar limites','Criar nova coleta?');connect('Criar nova coleta?','Iniciar coleta Apify');connect('Criar nova coleta?','Consultar execucao Apify',1);
connect('Iniciar coleta Apify','Consultar execucao Apify');connect('Consultar execucao Apify','Conferir status');connect('Conferir status','Coleta concluida?');
connect('Coleta concluida?','Buscar anuncios Apify');connect('Coleta concluida?','Aguardar 5 segundos',1);connect('Aguardar 5 segundos','Consultar execucao Apify');
connect('Buscar anuncios Apify','Filtrar e organizar');connect('Filtrar e organizar','Baixar relatorio JSON');
await writeFile(new URL('./dist/workflow.json',import.meta.url),JSON.stringify(workflow,null,2)+'\n');
const runId=process.env.GARIMPO_PILOT_RUN_ID;
if (runId) {
  const personal=structuredClone(workflow);
  personal.nodes.find(n=>n.id==='params').parameters.jsonOutput=JSON.stringify({...config,runId},null,2);
  await writeFile(new URL('./dist/garimpo-pesquisa-anuncios-n8n.json',import.meta.url),JSON.stringify(personal,null,2)+'\n');
}
if (process.env.GARIMPO_ADS_DATASET) {
  const records=JSON.parse(await readFile(process.env.GARIMPO_ADS_DATASET,'utf8'));
  const report=normalizarAnuncios(records,{coletadoEm:'2026-10-06T03:32:35.848Z'});
  await writeFile(new URL('./dist/primeira-pesquisa.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify(report.resumo));
}

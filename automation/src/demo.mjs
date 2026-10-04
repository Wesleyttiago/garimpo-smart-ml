import { runCatalog } from './core.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const result = await runCatalog({mode:'demo'});
await mkdir('output', {recursive:true});
await writeFile('output/latest.json', JSON.stringify(result,null,2)+'\n', {mode:0o600});
console.log('Simulação concluída: '+result.count+' candidatos; links de afiliado: 0; publicação: não.');


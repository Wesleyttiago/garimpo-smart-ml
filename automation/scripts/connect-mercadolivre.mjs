import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createAttempt, exchangeCode, privateWrite } from '../src/oauth.mjs';

const muted = new Writable({ write(_chunk, _encoding, done) { done(); } });
muted.isTTY = process.stdin.isTTY;
const input = createInterface({ input: process.stdin, output: muted, terminal: Boolean(process.stdin.isTTY) });
async function ask(prompt) {
  process.stdout.write(prompt);
  const answer = (await input.question('')).trim();
  process.stdout.write('\n');
  return answer;
}
try {
  const original = await readFile('.env', 'utf8');
  if (!/^N8N_ENCRYPTION_KEY=[A-Za-z0-9_-]{32,}$/m.test(original)) throw new Error('Execute bash setup.sh antes de conectar.');
  const clientId = await ask('Client ID da aplicação (entrada oculta): ');
  const clientSecret = await ask('Client Secret da aplicação (entrada oculta): ');
  if (!/^[A-Za-z0-9._~-]{10,512}$/.test(clientSecret)) throw new Error('Client Secret inválido.');
  const attempt = createAttempt(clientId);
  console.log('\nAbra este endereço no navegador e autorize a aplicação:\n' + attempt.url);
  console.log('\nNa página de retorno, clique em Copiar resposta. Cole aqui no terminal, sem enviar ao chat.');
  const callback = await ask('Resposta copiada (entrada oculta): ');
  const record = await exchangeCode({ clientId, clientSecret, attempt, callback });
  const updates = { ML_CLIENT_ID: clientId, ML_CLIENT_SECRET: clientSecret, ML_ACCESS_TOKEN: '', ENABLE_LIVE_SEARCH: 'false' };
  let text = original;
  for (const [key, value] of Object.entries(updates)) {
    const pattern = new RegExp('^' + key + '=.*$', 'gm');
    text = pattern.test(text) ? text.replace(pattern, key + '=' + value) : text.trimEnd() + '\n' + key + '=' + value + '\n';
  }
  await mkdir('output', { recursive: true });
  await privateWrite(resolve('.env'), text);
  await privateWrite(resolve('output/mercadolivre-oauth.json'), JSON.stringify(record) + '\n');
  console.log('Conta autorizada. Credenciais guardadas somente neste computador. A pesquisa real continua desativada até o teste de acesso.');
} catch (error) {
  // Somente erros controlados são exibidos; nunca imprime respostas da API ou segredos.
  const safe = /^(Client |Retorno |Código |Cole |Autorização |A resposta |Resposta |Autenticação |Não foi |Execute )/.test(error.message);
  console.error(safe ? error.message : 'Não foi possível concluir a conexão. Confira o acesso à internet e as configurações da aplicação.');
  process.exitCode = 1;
} finally { input.close(); }

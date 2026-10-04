import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAttempt, callbackCode, exchangeCode, tokenRecord, privateWrite, createTokenLoader, redirectUri } from '../src/oauth.mjs';

const clientId = '123456789';
const credentials = { ML_CLIENT_ID: clientId, ML_CLIENT_SECRET: 'fake-secret-for-test-only' };
const token = { access_token: 'fake-access-token', refresh_token: 'fake-refresh-token', token_type: 'bearer', user_id: 123, expires_in: 21600 };
const response = (data, status = 200) => ({ ok: status === 200, status, json: async () => data });
const returned = attempt => redirectUri + '?' + new URLSearchParams({ code: 'TG-fake-code', state: attempt.state });
async function temporary(t) { const path = await mkdtemp(join(tmpdir(), 'garimpo-oauth-')); t.after(() => rm(path, { recursive: true, force: true })); return path; }

test('cada autorização possui PKCE S256 e state exclusivos sem expor o verifier', () => {
  const a = createAttempt(clientId), b = createAttempt(clientId), url = new URL(a.url);
  assert.notEqual(a.state, b.state); assert.notEqual(a.verifier, b.verifier);
  assert.equal(url.origin, 'https://auth.mercadolivre.com.br');
  assert.equal(url.searchParams.get('code_challenge'), createHash('sha256').update(a.verifier).digest('base64url'));
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
  assert.equal(url.searchParams.get('redirect_uri'), redirectUri);
  assert.equal(url.searchParams.has('client_secret'), false); assert.equal(url.searchParams.has('code_verifier'), false);
});
test('retorno bloqueia state divergente, duplicatas, origem falsa, fragmentos e expiração antes de trocar tokens', () => {
  const a = createAttempt(clientId);
  assert.equal(callbackCode(returned(a), a), 'TG-fake-code');
  for (const value of [returned(a).replace(a.state, 'wrong'), returned(a) + '&code=other', returned(a) + '&state=other',
    returned(a).replace('wesleyttiago.github.io', 'example.invalid'), returned(a) + '#secret', returned(a) + '&error=access_denied'])
    assert.throws(() => callbackCode(value, a));
  assert.throws(() => callbackCode(returned(a), a, a.createdAt + 600001));
});
test('troca de código envia segredos somente ao endpoint oficial e confirma a conta autorizada', async () => {
  const attempt = createAttempt(clientId), calls = [];
  const fetcher = async (url, options) => {
    calls.push({ url, options });
    return response(url.endsWith('/oauth/token') ? token : { id: 123 });
  };
  const record = await exchangeCode({ clientId, clientSecret: credentials.ML_CLIENT_SECRET, attempt, callback: returned(attempt) }, fetcher);
  assert.equal(record.user_id, 123); assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://api.mercadolibre.com/oauth/token');
  assert.equal(calls[0].options.body.get('code_verifier'), attempt.verifier);
  assert.equal(calls[0].options.body.get('client_secret'), credentials.ML_CLIENT_SECRET);
  assert.equal(calls[0].options.redirect, 'error');
  assert.equal(calls[1].url, 'https://api.mercadolibre.com/users/me');
});
test('falhas de autenticação e conta divergente não expõem respostas do provedor', async () => {
  const attempt = createAttempt(clientId), input = { clientId, clientSecret: credentials.ML_CLIENT_SECRET, attempt, callback: returned(attempt) };
  await assert.rejects(exchangeCode(input, async () => response({ error: 'secret-value' }, 403)), error => !error.message.includes('secret-value') && error.message.includes('403'));
  await assert.rejects(exchangeCode(input, async url => response(url.endsWith('/oauth/token') ? token : { id: 999 })), /confirmar a conta/);
  assert.throws(() => tokenRecord({ ...token, refresh_token: null }, clientId));
});
test('tokens e configurações são gravados com permissão privada e substituição atômica', async t => {
  const dir = await temporary(t), path = join(dir, 'private.json');
  await privateWrite(path, 'original'); await privateWrite(path, 'updated');
  assert.equal(await readFile(path, 'utf8'), 'updated'); assert.equal((await stat(path)).mode & 0o777, 0o600);
});
test('token válido é reutilizado sem chamadas externas; arquivo ausente mantém compatibilidade', async t => {
  const output = await temporary(t); let calls = 0;
  const fetcher = async () => { calls++; throw new Error('unexpected'); };
  assert.equal(await createTokenLoader({ output, env: { ML_ACCESS_TOKEN: 'legacy-token' }, fetcher })(), 'legacy-token');
  await privateWrite(join(output, 'mercadolivre-oauth.json'), JSON.stringify(tokenRecord(token, clientId)));
  assert.equal(await createTokenLoader({ output, env: credentials, fetcher })(), token.access_token); assert.equal(calls, 0);
});
test('renovação concorrente usa refresh token uma única vez e preserva o novo token para próximas execuções', async t => {
  const output = await temporary(t); let calls = 0;
  await privateWrite(join(output, 'mercadolivre-oauth.json'), JSON.stringify({ ...tokenRecord(token, clientId), expires_at: Date.now() - 1000 }));
  const load = createTokenLoader({ output, env: credentials, fetcher: async (url, options) => {
    calls++; assert.equal(url, 'https://api.mercadolibre.com/oauth/token');
    assert.equal(options.body.get('grant_type'), 'refresh_token'); assert.equal(options.body.get('refresh_token'), token.refresh_token);
    return response({ ...token, access_token: 'fake-new-access', refresh_token: 'fake-new-refresh' });
  } });
  assert.deepEqual(await Promise.all([load(), load(), load()]), ['fake-new-access', 'fake-new-access', 'fake-new-access']);
  assert.equal(calls, 1); assert.equal(await load(), 'fake-new-access'); assert.equal(calls, 1);
  const saved = JSON.parse(await readFile(join(output, 'mercadolivre-oauth.json'), 'utf8'));
  assert.equal(saved.refresh_token, 'fake-new-refresh');
});
test('aplicação divergente ou renovação recusada não substituem o token guardado', async t => {
  const output = await temporary(t), path = join(output, 'mercadolivre-oauth.json');
  const saved = JSON.stringify({ ...tokenRecord(token, clientId), expires_at: Date.now() - 1000 });
  await privateWrite(path, saved);
  await assert.rejects(createTokenLoader({ output, env: { ...credentials, ML_CLIENT_ID: '987654321' } })(), /corresponde/);
  await assert.rejects(createTokenLoader({ output, env: credentials, fetcher: async () => response({}, 401) })(), /401/);
  assert.equal(await readFile(path, 'utf8'), saved);
});

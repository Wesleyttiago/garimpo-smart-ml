import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { open, readFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';

export const redirectUri = 'https://wesleyttiago.github.io/garimpo-smart-ml/automation/oauth-callback.html';
const endpoint = 'https://api.mercadolibre.com/oauth/token';
export async function privateWrite(path, text) {
  const temporary = path + '.' + randomBytes(8).toString('hex') + '.tmp';
  try {
    const file = await open(temporary, 'wx', 0o600);
    try { await file.writeFile(text); await file.sync(); } finally { await file.close(); }
    await rename(temporary, path);
  } finally { await unlink(temporary).catch(() => {}); }
}
export function createAttempt(clientId, now = Date.now()) {
  if (!/^\d{5,30}$/.test(clientId)) throw new Error('Client ID inválido.');
  const state = randomBytes(32).toString('base64url');
  const verifier = randomBytes(48).toString('base64url');
  const url = new URL('https://auth.mercadolivre.com.br/authorization');
  url.search = new URLSearchParams({ response_type: 'code', client_id: clientId, redirect_uri: redirectUri,
    state, code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256' });
  return { state, verifier, createdAt: now, url: url.href };
}
export function callbackCode(value, attempt, now = Date.now()) {
  if (now - attempt.createdAt > 600000 || now < attempt.createdAt) throw new Error('Autorização expirada. Comece novamente.');
  if (typeof value !== 'string' || value.length > 8192) throw new Error('Retorno inválido.');
  let url;
  try { url = new URL(value); } catch { throw new Error('Cole a resposta completa copiada da página de retorno.'); }
  const base = new URL(redirectUri);
  if (url.origin !== base.origin || url.pathname !== base.pathname || url.username || url.password || url.hash
      || url.searchParams.has('error') || url.searchParams.getAll('code').length !== 1 || url.searchParams.getAll('state').length !== 1)
    throw new Error('Retorno inválido ou autorização recusada.');
  const state = Buffer.from(url.searchParams.get('state') || '');
  const expected = Buffer.from(attempt.state);
  if (state.length !== expected.length || !timingSafeEqual(state, expected)) throw new Error('A resposta não pertence a esta tentativa.');
  const code = url.searchParams.get('code');
  if (!/^[A-Za-z0-9._~-]{5,2048}$/.test(code)) throw new Error('Código de autorização inválido.');
  return code;
}
export function tokenRecord(data, clientId, now = Date.now()) {
  const safeToken = value => typeof value === 'string' && /^[A-Za-z0-9._~-]{5,4096}$/.test(value);
  if (!safeToken(data.access_token) || !safeToken(data.refresh_token)
      || String(data.token_type).toLowerCase() !== 'bearer' || !Number.isSafeInteger(data.user_id) || data.user_id <= 0
      || !Number.isFinite(data.expires_in) || data.expires_in < 60 || data.expires_in > 604800)
    throw new Error('Resposta de autenticação inválida. Confira Refresh Token nas configurações.');
  return { client_id: clientId, user_id: data.user_id, access_token: data.access_token,
    refresh_token: data.refresh_token, expires_at: now + data.expires_in * 1000 };
}
async function tokenRequest(fields, clientId, fetcher = fetch) {
  const response = await fetcher(endpoint, { method: 'POST', redirect: 'error',
    headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(fields), signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error('Autenticação recusada (HTTP ' + response.status + '). Confira aplicação, permissões e autorização.');
  return tokenRecord(await response.json(), clientId);
}
export async function exchangeCode({ clientId, clientSecret, attempt, callback }, fetcher = fetch) {
  const code = callbackCode(callback, attempt);
  const record = await tokenRequest({ grant_type: 'authorization_code', client_id: clientId,
    client_secret: clientSecret, code, redirect_uri: redirectUri, code_verifier: attempt.verifier }, clientId, fetcher);
  const me = await fetcher('https://api.mercadolibre.com/users/me', {
    headers: { Authorization: 'Bearer ' + record.access_token }, redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!me.ok || (await me.json()).id !== record.user_id) throw new Error('Não foi possível confirmar a conta autorizada.');
  return record;
}
export function createTokenLoader({ env = process.env, output, fetcher = fetch, now = Date.now } = {}) {
  let active;
  async function load() {
    let record;
    try { record = JSON.parse(await readFile(resolve(output, 'mercadolivre-oauth.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return env.ML_ACCESS_TOKEN || ''; throw new Error('Arquivo de autorização inválido. Reconecte sua conta.'); }
    if (!env.ML_CLIENT_ID || !env.ML_CLIENT_SECRET || record.client_id !== env.ML_CLIENT_ID
        || !Number.isFinite(record.expires_at) || !Number.isSafeInteger(record.user_id)
        || typeof record.access_token !== 'string' || typeof record.refresh_token !== 'string')
      throw new Error('A autorização não corresponde à aplicação configurada.');
    if (record.expires_at > now() + 60000) return record.access_token;
    // Refresh tokens são de uso único; chamadas concorrentes compartilham uma renovação.
    const updated = await tokenRequest({ grant_type: 'refresh_token', client_id: env.ML_CLIENT_ID,
      client_secret: env.ML_CLIENT_SECRET, refresh_token: record.refresh_token }, env.ML_CLIENT_ID, fetcher);
    if (updated.user_id !== record.user_id) throw new Error('A renovação não confirmou a mesma conta.');
    await privateWrite(resolve(output, 'mercadolivre-oauth.json'), JSON.stringify(updated) + '\n');
    return updated.access_token;
  }
  return () => {
    if (!active) active = load().finally(() => { active = undefined; });
    return active;
  };
}

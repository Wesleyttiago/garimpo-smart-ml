import { createServer } from 'node:http';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runCatalog } from './core.mjs';

const output = resolve(process.env.OUTPUT_DIR || 'output');
await mkdir(output, { recursive: true });
let running = false;
const reply = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(JSON.stringify(data));
};
const server = createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/health') return reply(res, 200, { ok: true });
    if (req.method === 'GET' && req.url === '/api/results') {
      try { return reply(res, 200, JSON.parse(await readFile(resolve(output, 'latest.json'), 'utf8'))); }
      catch { return reply(res, 200, { mode: 'empty', count: 0, products: [], issues: [], notice: 'Execute o fluxo de teste no n8n.', published: false }); }
    }
    if (req.method === 'POST' && req.url === '/api/run') {
      // Nada de chaves enviadas pelo navegador: somente configurações de ambiente.
      if (req.headers.origin) {
        const origin = new URL(req.headers.origin);
        if (origin.host !== req.headers.host) return reply(res, 403, { error: 'Origem não permitida.' });
      }
      if (!req.headers['content-type']?.startsWith('application/json')) return reply(res, 415, { error: 'Envie JSON.' });
      if (running) return reply(res, 409, { error: 'Uma execução já está em andamento.' });
      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
        if (Buffer.byteLength(body) > 4096) return reply(res, 413, { error: 'Requisição muito grande.' });
      }
      let input;
      try { input = JSON.parse(body); }
      catch { return reply(res, 400, { error: 'JSON inválido.' }); }
      if (!input || !['demo', 'live'].includes(input.mode)) return reply(res, 400, { error: 'Informe mode: demo ou live.' });
      running = true;
      try {
        const result = await runCatalog({ mode: input.mode });
        const temporary = resolve(output, 'latest.tmp');
        await writeFile(temporary, JSON.stringify(result, null, 2) + '\n', { mode: 0o600 });
        await rename(temporary, resolve(output, 'latest.json'));
        return reply(res, 200, result);
      } finally { running = false; }
    }
    const assets = new Map([['/', ['index.html', 'text/html']], ['/review.js', ['review.js', 'text/javascript']], ['/style.css', ['style.css', 'text/css']]]);
    if (req.method === 'GET' && assets.has(req.url)) {
      const [file, type] = assets.get(req.url);
      res.writeHead(200, {
        'Content-Type': type + '; charset=utf-8', 'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy': "default-src 'self'; img-src 'self' https://*.mlstatic.com; style-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      });
      return res.end(await readFile(new URL('../public/' + file, import.meta.url)));
    }
    return reply(res, 404, { error: 'Não encontrado.' });
  } catch {
    // Não divulga mensagens do provedor, tokens ou respostas de autenticação.
    return reply(res, 400, { error: 'Não foi possível executar. Confira o modo e o acesso autorizado às integrações.' });
  }
});
server.listen(Number(process.env.PORT || 8080), process.env.HOST || '0.0.0.0', () => console.log('Garimpo: servidor de revisão iniciado.'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));


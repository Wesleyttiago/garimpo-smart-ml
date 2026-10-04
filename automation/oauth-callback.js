const heading = document.querySelector('#heading');
const message = document.querySelector('#message');
const copy = document.querySelector('#copy');
const params = new URLSearchParams(location.search);
// Remove o código da URL antes de qualquer interação ou navegação.
history.replaceState(null, '', location.pathname);
const code = params.get('code');
const state = params.get('state');
let response;
if (params.has('error')) {
  heading.textContent = 'Autorização não concluída.';
  message.textContent = 'Volte ao terminal e inicie uma nova tentativa de conexão.';
} else if (params.getAll('code').length === 1 && params.getAll('state').length === 1
    && /^[A-Za-z0-9._~-]{5,2048}$/.test(code || '') && /^[A-Za-z0-9_-]{43}$/.test(state || '')) {
  response = new URL(location.origin + location.pathname);
  response.search = new URLSearchParams({ code, state });
  heading.textContent = 'Resposta recebida.';
  message.textContent = 'Clique em Copiar resposta e cole no terminal que iniciou a conexão. O configurador local validará esta tentativa e confirmará sua conta.';
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(response.href); message.textContent = 'Copiado. Cole no terminal que iniciou a conexão.'; }
    catch {
      const fallback = document.querySelector('#fallback');
      document.querySelector('#fallback-label').hidden = false;
      fallback.hidden = false; fallback.value = response.href; fallback.focus(); fallback.select();
      message.textContent = 'Selecione e copie a resposta abaixo para o terminal.';
    }
  });
} else {
  heading.textContent = 'Página de retorno pronta.';
  message.textContent = 'Inicie a conexão pelo configurador local do Garimpo Smart. Esta página será aberta ao final da autorização no Mercado Livre.';
}

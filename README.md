# Garimpo Smart

O projeto agora tem duas áreas:

| Área | Endereço | Finalidade |
| --- | --- | --- |
| Casa & rotina | https://wesleyttiago.github.io/garimpo-smart-ml/blog/ | Blog público com nove guias e recomendações dos dez produtos da vitrine anterior. |
| Curadoria | https://wesleyttiago.github.io/garimpo-smart-ml/ | Página para comparar resultados importados da automação, somente no navegador. |
| Revisão local | http://localhost:8078 | Servidor da automação no computador configurado; acesso aos resultados e ao teste DEMO. |
| n8n local | http://localhost:5678 | Execução e edição dos fluxos no computador configurado. |

## Rodar o site localmente

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000/blog/` para o blog ou `http://localhost:8000/` para a curadoria. O blog e a importação funcionam sem servidor de API. Os links de revisão e n8n só abrem quando esses serviços estão ativos no seu computador.

## Atualizar o blog

- Edite `blog/content.json` ou `blog/more-content.json` para alterar os guias.
- Edite `blog/products.json` para atualizar produtos, links e contexto.
- Coloque as fotos confirmadas em `blog/assets/`, incluindo texto alternativo e dimensões nos dados.
- Execute `node blog/build.mjs`, confira as páginas alteradas e faça o commit dos dados e HTML gerados.

As cinco ofertas antigas mantêm seus links principais e alternativos, exatamente como foram fornecidos. Os cinco itens sem anúncio escolhido continuam **Em curadoria**, sem link de compra ou foto fictícia. Todos os dez estão em `blog/recomendacoes.html`. Confira modelo, destino e condições antes de anunciar. Os links de afiliado usam `rel="sponsored noopener noreferrer"`.

## Vitrine de candidatos

Depois de executar o fluxo no ambiente local, abra a curadoria e selecione **`automation/output/latest.json`**. A página mostra os candidatos, razões da seleção, preço consultado ou fictício e pendências. A busca filtra nome e categoria; **Limpar resultados** remove os itens carregados.

O arquivo é lido só na memória deste navegador: não há upload, consulta à API ou publicação no blog. Ao recarregar ou fechar a página, os resultados são descartados. A página é pública; resultados não são compartilhados com outros visitantes. Não carregue arquivos de credenciais. Apenas a preferência de tema usa `localStorage`.

Arquivos DEMO e produtos marcados como simulação não exibem links de compra. Arquivos reais mostram links HTTPS dos domínios permitidos do Mercado Livre e meli.la; não comprovam comissão. Os candidatos escolhidos pelo backend são os que atendem aos critérios configurados, com comparação de preço entre opções elegíveis. Isso não comprova potencial de venda ou taxa de conversão.

## Situação da API

No último diagnóstico, autenticação e consultas de catálogo responderam; a pesquisa geral e consultas de anúncios retornaram 403. Essa entrega não altera scopes, IPs, tokens nem ativa pesquisa real. Não é possível afirmar que há ofertas vencedoras reais enquanto o acesso necessário não estiver liberado. Consulte a documentação em [`automation/`](automation/).

As credenciais, o servidor e o n8n permanecem no ambiente local. O callback OAuth continua em `automation/oauth-callback.html`. A publicação do blog não muda esse endereço. Nenhuma publicação automática de candidatos foi ativada.

## Arquivos principais

- `index.html`, `curation.css`, `curation.js`: curadoria e importação de resultados.
- `blog/`: páginas do blog, artigos, recomendações, dados e gerador.
- `automation/`: ambiente local e integração existente.
- `assets/`: marca e imagens originais da vitrine anterior.

## GitHub Pages

Mantenha **Settings → Pages → Deploy from a branch → main → / (root)**. O blog fica disponível no caminho `/blog/`, sem mudar a configuração existente. O arquivo `.nojekyll` permite servir os arquivos estáticos.

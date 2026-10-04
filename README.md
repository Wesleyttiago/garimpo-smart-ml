# Garimpo Smart

**Site publicado:** [Abrir o Garimpo Smart](https://wesleyttiago.github.io/garimpo-smart-ml/)

Vitrine mobile-first de achadinhos: casa, cozinha, decoração e tecnologia. Feita com HTML5, CSS3 e JavaScript puro, sem dependências, fontes externas ou etapa de build.

## Rodar localmente

```sh
python3 -m http.server 8000
```

Abra `http://localhost:8000`. Também é possível abrir o `index.html` diretamente, pois a página não depende de chamadas a APIs.

## Arquivos

- `index.html`: conteúdo, cards, links de afiliado e perguntas sobre a compra.
- `style.css`: estilos mobile-first, modos claro/escuro e redução de movimento.
- `script.js`: filtros, preferência de tema e ativação opcional do grupo VIP.
- `site-config.js`: configuração do grupo VIP.
- `assets/`: marca SVG e fotografias WebP extraídas das imagens de anúncios fornecidas pelo proprietário. As capturas originais de conversa não fazem parte do projeto.

## Atualizar um produto

Edite o `<article>` correspondente no `index.html`. Cada card contém título, descrição, imagem, categoria e o link de oferta. Os links começam com `https://meli.la/` e devem ser preservados exatamente, inclusive letras maiúsculas. Se substituir uma oferta, confira o modelo, a foto e a descrição juntos. Preserve `rel="sponsored noopener noreferrer"` nos links de afiliado.

Para cadastrar outro produto, duplique um card, escolha `data-category="casa"`, `"cozinha"`, `"decoracao"` ou `"tecnologia"`, e use identificadores exclusivos em `id` e `aria-labelledby`. Atualize o número do botão Todos e a contagem inicial. O filtro calcula as contagens após cada interação.

## Novos achados — links e fotos pendentes

A vitrine contém **10 produtos**. Os cinco novos cards estão no `index.html`, com `href=""`:

- `mini-impressora`: Mini Impressora Térmica Portátil Bluetooth.
- `difusor-chama`: Umidificador Difusor de Ar Efeito Chama 3D.
- `garrafa-termica-led`: Garrafa Térmica Inteligente Termômetro LED.
- `camera-lampada`: Câmera Lâmpada de Segurança Wi-Fi 360º.
- `mini-liquidificador`: Mini Liquidificador Portátil USB Fresh Juice.

Cole o link encurtado **meli.la** no `href` do botão do produto e recarregue a página. O JavaScript remove o estado desativado e troca “Link em breve” por “no Mercado Livre”. Enquanto o endereço estiver vazio, o botão não navega nem recarrega o site. Os nove links das ofertas anteriores foram preservados.

As fotos dos novos modelos ainda não foram fornecidas. Para adicioná-las, substitua o conteúdo do `div.product-image-placeholder` por um `img` com caminho local, texto alternativo, largura, altura, `loading="lazy"` e `decoding="async"`; mantenha a tag de novidade se desejar e troque a classe `product-image-placeholder` por `product-image-contain`.

Se usar o site sem JavaScript após preencher um link, remova também `aria-disabled="true"` e `tabindex="-1"` e altere o texto “Link em breve” no HTML.

## Grupo VIP

O grupo fica oculto enquanto não há um endereço. Quando estiver pronto, coloque o convite em `vipGroupUrl` no `site-config.js`. São aceitos links HTTPS de `chat.whatsapp.com`, `t.me` ou `telegram.me`. O botão do cabeçalho e a seção VIP aparecerão automaticamente.

## Catálogo inicial

| Produto | Oferta principal | Outra opção |
| --- | --- | --- |
| Mini mop dobrável | https://meli.la/2JufCci | https://meli.la/31ZB3Gp — kit com 3 refis |
| Lixeira com sensor, 12 L | https://meli.la/1vrfdF4 | https://meli.la/1GvgSVt — preta, 13 L |
| Dispenser preto, 6 níveis | https://meli.la/1ke989s | https://meli.la/1gPKyUW — branco, suporte para 5 escovas |
| Projetor astronauta | https://meli.la/2h4eeLT | — |
| Mini processador verde USB | https://meli.la/1eCVpPD | https://meli.la/1N4gRYH — Knup branco, 250 ml |

Os endereços e as informações acima foram transcritos dos prints fornecidos. Os links encurtados não puderam ser consultados pelo ambiente de desenvolvimento; confira os destinos em um navegador comum antes de investir em anúncios. A página exibe os preços na origem e usa “Ver oferta”, pois os prints não incluem desconto ou preço confirmado. Os rótulos descrevem o uso e a categoria, sem afirmar popularidade não verificada no TikTok.

## Publicação no GitHub Pages

No repositório, abra **Settings → Pages → Deploy from a branch**. Selecione `main` e `/ (root)`. O arquivo `.nojekyll` permite servir os arquivos estáticos diretamente.

## Privacidade e acessibilidade

Não há formulários, cookies de rastreamento ou pixels instalados. A preferência de tema fica apenas no dispositivo (`localStorage`), e o site continua funcionando quando o armazenamento é bloqueado. Os links de compra funcionam sem JavaScript; os filtros dependem de JavaScript. Há links de salto, foco visível, controles nativos, textos alternativos, contagem acessível e respeito a `prefers-reduced-motion`.

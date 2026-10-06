# Primeiro teste de interesse — Garimpo Smart

Preparado em 5 de outubro de 2026. A integração está publicada **desativada**, sem uma propriedade GA4 configurada. Não há resultados de visitantes ou vendas nesta entrega.

## Seleção inicial provisória

Usaremos os três produtos que já têm foto, link e destaque na página inicial. A seleção testa três tarefas diferentes da casa; não representa um ranking de vendas.

| Produto | Situação para o conteúdo | O que precisa ser confirmado antes de divulgar |
| --- | --- | --- |
| Mini mop portátil | Pequenos respingos e superfícies compactas | Destino do link, medidas, superfície indicada e reposição do refil |
| Dispenser de pasta | Organização do uso da pasta no banheiro | Modelo preto de seis níveis, fixação, limpeza e compatibilidade do tubo |
| Mini processador USB | Preparo de pequenas porções | Capacidade útil, alimentos permitidos, alimentação, recarga e limpeza |

Os links encurtados não puderam ser abertos pela ferramenta de consulta nesta sessão. Isso não demonstra que estejam quebrados, mas impede confirmar o anúncio, o preço, o vendedor e o frete. Os destinos recebidos foram preservados. No processador, confira a especificação elétrica: a referência anterior incluía “USB” e “127v” no mesmo título.

Abra cada link principal e confirme nome, modelo, foto, vendedor, valor final, prazo e elegibilidade na sua Central de Afiliados. Se a oferta estiver diferente, forneça o novo link e a foto correspondente. Não divulgue como produto testado enquanto não houver teste real.

## Ativar a medição

1. Entre em https://analytics.google.com/ com sua conta Google e escolha **Começar a medir**.
2. Crie a conta Garimpo Smart e uma propriedade Garimpo Smart Blog. Use Brasil, fuso de Recife/São Paulo (UTC−3) e real brasileiro.
3. Crie um fluxo **Web** para `https://wesleyttiago.github.io/garimpo-smart-ml/blog/`.
4. **Desative Medição otimizada / Enhanced measurement** nesse fluxo. Nosso código já envia as páginas e os cliques necessários com URLs filtradas. Não instale outro trecho de gtag ou Google Tag Manager em paralelo.
5. Copie o **ID de medição**, no formato `G-XXXXXXXXXX`, e envie somente esse identificador público. Não é necessária senha, chave de API ou acesso ao seu login.
6. Na integração, coloque o ID em `assets/analytics-config.js` e altere `enabled` para `true`. A versão do GitHub usa `blog/assets/analytics-config.js`; a fonte da prévia usa `dist/assets/analytics-config.js`. Sincronize as duas versões ao publicar.
7. Abra o blog público, aceite a medição e confira **Tempo real** no Analytics. Clique em uma oferta principal e, depois, em uma alternativa. A confirmação real no painel precisa acontecer depois da ativação; testes locais não provam recebimento pelo Google.

O visitante pode recusar ou rever a decisão no rodapé. O Google só é carregado depois da aceitação. A medição fica restrita ao caminho do blog no domínio público do GitHub; a curadoria, a prévia privada e localhost não são medidos.

## Eventos preparados

| Evento | O que representa | Dados úteis |
| --- | --- | --- |
| `page_view` | Uma página aberta após a aceitação | Página e origem/campanha permitidas |
| `product_impression` | Pelo menos metade de um card de oferta entrou na tela | Produto, posição e grupo do teste |
| `affiliate_click` | Clique em uma oferta para o Mercado Livre | Produto, posição e opção principal/alternativa |

Uma impressão é contada uma vez por produto/posição em cada carregamento da página. Somente produtos com link são observados. Se o navegador não oferece IntersectionObserver, os cliques continuam sendo medidos, mas impressões não são presumidas. Buscas digitadas, telefone, e-mail e URLs completas de afiliado não são enviados pelos eventos personalizados. A medição não envia eventos de compra.

Crie dimensões personalizadas **com escopo de evento** para `product_id`, `product_name`, `placement`, `offer_variant`, `cohort` e `experiment_id`, usando os mesmos nomes como parâmetros. Elas ajudam a comparar os eventos em Explorações. Novas dimensões não recuperam automaticamente dados anteriores à sua criação.

Para ler os resultados, compare visitantes medidos, usuários que viram cada produto e usuários que clicaram nele. Use usuários únicos em ambos os lados para calcular a proporção de interessados. A contagem bruta de cliques pode incluir várias tentativas da mesma pessoa. Pessoas que recusam ou bloqueiam Analytics ficam fora dessa amostra. Um clique indica interesse; vendas elegíveis e comissões são verificadas na Central de Afiliados.

Não preencha receitas ou vendas fictícias no Analytics. Um pico de cliques com poucas compras pode exigir revisar oferta, preço final, frete, prazo ou correspondência entre o conteúdo e o produto. Uma amostra pequena orienta o próximo teste; não comprova um vencedor.

## Links para divulgação

Esses links apontam para a recomendação existente e registram a origem no blog após ativação e aceitação. Não alteram os links de afiliado nem acrescentam parâmetros ao Mercado Livre.

| Canal | Produto | Link |
| --- | --- | --- |
| Instagram | Mini mop | https://wesleyttiago.github.io/garimpo-smart-ml/blog/recomendacoes.html?utm_source=instagram&utm_medium=social&utm_campaign=primeiro-teste-2026-10&utm_content=mini-mop#mini-mop |
| TikTok | Dispenser | https://wesleyttiago.github.io/garimpo-smart-ml/blog/recomendacoes.html?utm_source=tiktok&utm_medium=social&utm_campaign=primeiro-teste-2026-10&utm_content=dispenser-pasta#dispenser-pasta |
| WhatsApp | Mini processador | https://wesleyttiago.github.io/garimpo-smart-ml/blog/recomendacoes.html?utm_source=whatsapp&utm_medium=message&utm_campaign=primeiro-teste-2026-10&utm_content=mini-processador#mini-processador |

As origens aceitas são instagram, tiktok e whatsapp; os meios são social e message. A campanha é primeiro-teste-2026-10. `utm_content` aceita somente os três IDs acima. Outras consultas e fragmentos ficam fora da URL enviada pelo código ao Analytics. Isso inclui a busca do site.

## Três conteúdos para preparar

Estes são rascunhos de pauta, sem postagem automática. Use imagens próprias ou material autorizado do modelo anunciado. Só mostre desempenho que você consiga demonstrar; confirme antes as informações do anúncio.

- **Mini mop:** abra com um pequeno respingo perto da pia, mostre o tamanho real do utensílio e sua forma de guardar. Texto: “Respingos perto da pia fazem parte da rotina. Este mini mop é uma opção compacta para conferir — veja tamanho, material e refis na recomendação.”
- **Dispenser:** mostre o espaço disponível no banheiro e como a peça é instalada, conforme o manual. Texto: “Quer organizar o uso da pasta na bancada? Antes de escolher um dispenser, confira o encaixe do tubo e a fixação. Deixei os detalhes na recomendação.”
- **Mini processador:** mostre a quantidade real de uma porção, os ingredientes permitidos e as partes que podem ser lavadas. Texto: “Para pequenas porções, o tamanho do aparelho faz diferença. Confira a capacidade e os usos permitidos deste mini processador antes de escolher.”

Divulgue inicialmente em um canal que você já usa. Registre canal, produto, data e conteúdo publicado. Reveja os primeiros resultados com tráfego real antes de escolher o próximo produto. Não existe meta de conversão comprovada para este blog ainda.

## Fontes da integração

- Criação da propriedade, fluxo e ID: https://support.google.com/analytics/answer/9304153
- Eventos GA4: https://developers.google.com/analytics/devguides/collection/ga4/events
- Estados de consentimento: https://developers.google.com/tag-platform/security/guides/consent


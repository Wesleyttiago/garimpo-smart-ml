# Pesquisa de anúncios — piloto Garimpo Smart

Status atualizado em 06/10/2026: coleta real concluída na Apify (10 registros, 7 relevantes do mesmo anunciante, consumo informado US$ 0,058). Workflow criado e validado no n8n com API simulada; falta importar e conectar a credencial na instalação local do usuário. Nenhuma campanha identificada como vencedora, assinatura paga ou agendamento criado.

Consulte o [guia do workflow n8n](pesquisa-anuncios/README.md), o [workflow público para importar](pesquisa-anuncios/workflow.json) e a [primeira pesquisa analisada](pesquisa-anuncios/PRIMEIRA-PESQUISA.md). A cópia pessoal entregue na conversa já reutiliza a primeira coleta, sem token.

## Primeiro teste: até 10 anúncios

1. Crie uma conta Free em https://apify.com/pricing (sem cartão).
2. Abra https://apify.com/apify/facebook-ads-scraper — confira o identificador apify/facebook-ads-scraper, mantido pela Apify.
3. Abra a entrada JSON do coletor e cole a configuração abaixo. Ela é entrada do Apify, NÃO um workflow importável do n8n.
4. Confira o plano Free e o saldo antes de executar uma única vez. Não habilite agendamento ou enriquecimentos extras.
5. Quando terminar, confira o status, os resultados e o consumo. Exporte o Dataset em JSON para montarmos o mapeamento com os campos reais. Não compartilhe tokens ou cookies.

```json
{
  "startUrls": [
    {
      "url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=BR&q=mini%20mop&search_type=keyword_unordered"
    }
  ],
  "resultsLimit": 10,
  "onlyTotal": false,
  "includeAboutPage": false,
  "isDetailsPerAd": false,
  "enrichWithEcommerceData": false
}
```

O limite é por URL; este teste usa uma única URL. O crédito gratuito é limitado (US$ 5/mês conforme a página consultada), não uso ilimitado. Se não houver resultados, revise a busca na biblioteca; não repita automaticamente uma chamada que falhou.

## Automação planejada no n8n local

Após validar a primeira coleta:
1. Gatilho manual durante o teste.
2. Nó Apify: executar o coletor com a mesma entrada.
3. Aguardar o término e verificar sucesso; em falha, encerrar sem repetir cobranças automaticamente.
4. Buscar os itens do Dataset da execução.
5. Normalizar ID, anunciante, texto, produto, link do anúncio, início informado, status e data da coleta. Campos ausentes ficam vazios.
6. Remover duplicatas pelo ID e guardar histórico persistente de primeira/última observação.
7. Gerar uma lista para revisão com motivos explícitos: correspondência com o produto, demonstração do uso, oferta e chamada para ação.
8. Somente depois de validar qualidade e consumo, habilitar agenda compatível com o crédito disponível.

No n8n instalado no computador, salve a chave na credencial Apify API, conforme a documentação da integração. Não coloque a chave no JSON, no GitHub ou em mensagens. O computador, Docker e n8n precisam estar funcionando nos horários agendados. Ainda não há acesso remoto configurado a essa instalação.

## Produtos e análise

Começar pelo mini mop. Depois, adicionar pesquisas separadas para dispenser de pasta e mini processador USB, mantendo os links de afiliado existentes. Cada nova consulta aumenta o consumo.

Não atribuir vendas, lucro, ROAS ou público demográfico sem dados que comprovem. Anúncio ativo e tempo desde a data de início são sinais de pesquisa, não prova de rentabilidade nem de veiculação contínua. Variações de anúncio também não provam sucesso.

Na primeira fase, analisar os resultados aqui na conversa, sem contratar outra API de IA. Mais tarde, uma IA no n8n poderá resumir argumentos e sugerir roteiros originais, sempre apontando a fonte e as incertezas. Não copiar vídeos de concorrentes.

Facebook/Instagram são a hipótese inicial de canal. TikTok Top Ads pode complementar a pesquisa, mas é uma seleção de criativos autorizados, não todo o mercado. Google Chrome é o navegador; campanhas do Google seriam outra fonte.

## Critérios para considerar o piloto validado

- Execução concluída e consumo dentro do crédito disponível.
- Resultados com links verificáveis e produtos relevantes.
- Campos reais conferidos antes de gerar o workflow.
- Repetir a importação dos mesmos dados não duplica os anúncios no histórico.
- Nenhuma publicação, mensagem ou campanha paga automática.

## Fontes

- Entrada oficial do coletor: https://apify.com/apify/facebook-ads-scraper/input-schema
- Preços e limites: https://apify.com/pricing
- Integração n8n: https://docs.apify.com/integrations/n8n
- Cobertura da API oficial Meta (não oferece busca geral de anúncios comerciais brasileiros): https://pt-br.facebook.com/ads/library/api
- TikTok Top Ads: https://ads.tiktok.com/resources/help/article/top-ads

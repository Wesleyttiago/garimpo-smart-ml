# Garimpo Smart — pesquisa de anúncios no n8n

Piloto de Facebook/Instagram, com uma busca brasileira por execução, até 10 resultados e teto de US$ 0,25 do saldo Apify para novas coletas. O fluxo usa apenas nós padrão do n8n; não precisa instalar o nó comunitário da Apify.

## O que já foi validado

Em 06/10/2026, uma execução real de `apify/facebook-ads-scraper` concluiu em 34 segundos e retornou 10 registros. O painel informou US$ 0,058 consumidos. O filtro encontrou 7 anúncios de mini mop, todos do anunciante Fácil Lar, e descartou 3 itens diferentes. Isso valida a coleta e a organização; não comprova vendas dos anunciantes.

Os filtros têm testes de correspondência, catálogo com produtos diferentes, duplicatas, inativos, campos ausentes e limites de consumo. A importação e a execução foram validadas no n8n 2.41.6 com uma API simulada local e os 10 registros da coleta real: reutilização sem iniciar outra coleta, criação de uma única coleta, espera por conclusão, filtro e arquivo para baixar. A conexão à Apify no n8n do usuário ainda depende da credencial cadastrada naquela instalação.

## Importar e conectar

1. Abra seu n8n em `http://localhost:5678` e crie um workflow.
2. No menu de três pontos, escolha **Import from File** e selecione `garimpo-pesquisa-anuncios-n8n.json`, entregue na conversa. A cópia pessoal já reutiliza a primeira execução; ela não contém token.
3. Se usar a versão pública `workflow.json`, abra **Parametros do piloto** e preencha `runId` com o Run ID da sua coleta, obtido na própria Apify. Esse identificador permanece local.
4. Abra **Consultar execucao Apify**. Em Authentication, selecione **Generic Credential Type**, depois **Header Auth** e **Create new credential**.
5. Dê à credencial o nome **Apify — Garimpo Smart**. No campo **Name** escreva `Authorization`. No campo **Value** escreva `Bearer ` (com espaço depois) seguido do seu token da Apify. Copie o token dentro da sua conta Apify, na área de configurações/API, e cole somente no campo de credencial do n8n. Salve.
6. Escolha a mesma credencial nos outros dois nós HTTP: **Iniciar coleta Apify** e **Buscar anuncios Apify**.
7. Salve o workflow e clique **Execute workflow**. Confira **Filtrar e organizar**. No nó **Baixar relatorio JSON**, aba Binary, baixe o arquivo.

Não envie a chave em prints ou mensagens. O token não pertence aos parâmetros, à URL nem aos arquivos versionados.

## Como executar novas pesquisas

Em **Parametros do piloto**, mude `criarNovaColeta` para `true`. Assim o n8n inicia uma coleta limitada e usa o Dataset daquela execução. Deixe `false` para consultar novamente o Run ID indicado: isso evita uma nova execução do coletor, embora leituras de dados também contem para o uso da plataforma.

Produtos disponíveis no parâmetro `produtoId`:

| Valor | Busca |
| --- | --- |
| `mini-mop` | mini mop |
| `dispenser-pasta` | dispenser pasta |
| `mini-processador` | mini processador |

Ao reutilizar uma execução, mantenha o produto correspondente à busca original. O piloto busca um produto por vez, não executa três coletas automaticamente. Os limites de 10 registros e US$ 0,25 são verificados antes do POST; enriquecimentos ficam desligados. Não há nova tentativa automática de iniciar uma coleta após erro.

## Como interpretar

A prioridade de revisão soma 4 pontos por correspondência textual, 1 pelo status ativo informado, 1 por vídeo disponível e 1 por CTA. Esse critério ajuda a organizar referências, sem estimar vendas, lucro ou ROAS. Data de início não comprova veiculação contínua. A mídia deve ser vista antes de concluir que demonstra o mesmo modelo de produto.

O relatório remove IDs repetidos dentro da coleta e conserva anúncios distintos do mesmo anunciante. Não confunda sete anúncios com sete concorrentes. Cada execução fica no histórico normal do n8n; a tabela persistente de primeira/última observação entre consultas ainda não está configurada.

Não há agenda habilitada. Depois de validar a conexão e a qualidade com novos produtos, configurar armazenamento persistente e frequência compatível com o crédito mensal. A etapa de IA integrada ao n8n também fica para depois; por enquanto, os relatórios podem ser analisados na conversa.

## Desenvolvimento

Node.js 22 ou superior. `node build.mjs` gera `dist/workflow.json`; `node --test test/*.test.mjs` valida os filtros. A cópia `workflow.json` na raiz é o arquivo para importar. O arquivo gerado incorpora as funções dos nós Code. Não edite essas funções manualmente em duas cópias diferentes.

Dados reais, cópias pessoais com Run ID, dependências e saídas locais não são versionados. Testes com API simulada não consomem saldo da Apify.

Fontes: [HTTP Request do n8n](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/), [API Apify](https://docs.apify.com/api/v2/actors-runs-post), [entrada do coletor](https://apify.com/apify/facebook-ads-scraper/input-schema) e [plano Free](https://apify.com/pricing).

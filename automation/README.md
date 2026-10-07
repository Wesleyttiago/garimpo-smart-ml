# Automação do Garimpo Smart

Teste de pesquisa de produtos com n8n e Mercado Livre. Gera resultados para revisar, sem publicar no site.

[Guia de instalação](COMECE-AQUI.md)

## Testar no computador

Com Node.js 22 ou superior, na raiz do repositório:

```bash
cd automation
npm test
npm run demo
npm start
```

Abra http://localhost:8080. O teste usa dados fictícios e não instala o n8n.

Para usar com Docker e n8n, tenha Docker e Compose instalados e execute `bash setup.sh` nesta pasta. O n8n abre em http://localhost:5678 e a revisão em http://localhost:8078.

A pesquisa real depende de token e permissão da API do Mercado Livre; a busca ainda tem erro 403 pendente. Guarde as credenciais somente no `.env` local. Links de afiliado exigem configuração própria.

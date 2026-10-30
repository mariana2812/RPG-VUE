# FrontD — Vue 3

Comunidade de RPG feita com Vue 3, Vue Router e Vite 8. O site usa o JSON Server original em `http://localhost:3001`.

## Executar

Com Node.js 20.19+, 22.12+ ou 24+, abra um terminal na pasta do projeto:

```powershell
npm.cmd install
npm.cmd run dev
```

Inicie também seu JSON Server antigo na porta 3001. Abra o endereço exibido pelo Vite.
Para mudar a URL da API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.
Login usa `/login`, cadastro usa `/register` e as demais chamadas mantêm as rotas e o token Bearer originais.

## Arquivos

- `src/view`: telas do site.
- `src/components`: componentes compartilhados.
- `src/controller`: comunicação com a API.
- `src/composables`: ações, modais e notificações compartilhados.
- `src/routes`: navegação e proteção das telas.
- `src/assets/styles` e `public/media`: estilos e imagens usados pelo site.
- `tests`: testes da API e dos fluxos no navegador.

## Verificar

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
npm.cmd run format:check
```

Os testes de navegador precisam do Chrome instalado e usam uma API simulada sem alterar seus dados reais.
O site usa o JSON Server real. O build é gerado em `dist`; a hospedagem deve redirecionar as rotas para `index.html`.

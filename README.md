# FrontD — Vue 3

Projeto de RPG feito com Vue 3 e TypeScript, seguindo a estrutura das aulas: componentes com `script setup`, props com interfaces, formulários com `v-model` e controllers com funções simples.

## Executar

```powershell
npm.cmd install
npm.cmd run dev
```

Inicie seu JSON Server anterior em `http://localhost:3001` e abra o endereço exibido pelo Vite.

Login usa `/login`, cadastro usa `/register` e as demais operações usam as coleções do seu servidor. A sessão salva o `accessToken` e o `idUser`; as requisições às coleções enviam o token Bearer.

Para mudar o endereço, copie `.env.example` para `.env` e ajuste `VITE_API_URL`.

## Organização

- `src/view`: páginas.
- `src/components`: componentes reutilizados.
- `src/controller`: operações com dados e perfis.
- `src/interfaces`: interfaces TypeScript.
- `src/composables`: ações, imagens, modais e notificações.
- `src/routes`: rotas.
- `src/assets/styles` e `public/media`: estilos e imagens.

## Verificar

```powershell
npm.cmd run build
npm.cmd run format:check
```

O build é gerado em `dist`. A hospedagem deve redirecionar as rotas para `index.html`.

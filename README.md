# FrontD — Vue 3

Reestruturação da comunidade de RPG usando os conceitos das três aulas: componentes `.vue`, `<script setup>`, `ref`, `computed`, `v-model`, `v-if`, `v-for`, props, eventos, slots, Vue Router e controllers para acessar a API. A implementação usa JavaScript para reduzir a configuração de tipos.

Esta versão tem repositório e histórico próprios em <https://github.com/mariana2812/RPG-VUE>. O histórico remoto do projeto original (`Front-JsonServer`) não foi alterado. A versão Vue também foi copiada para a pasta de trabalho `C:\Users\mariana\RPG-VUE`, conforme solicitado; os arquivos anteriores foram guardados em `C:\Users\mariana\RPG-VUE-backup-antes-da-migracao`.

## Executar

É necessário Node.js 20 ou superior e o servidor original ligado na porta 3001.

```powershell
cd C:\Users\mariana\RPG-VUE-refatorado
npm.cmd install
npm.cmd run dev
```

Abra o endereço mostrado pelo Vite, normalmente `http://127.0.0.1:5173`.

Para mudar o endereço da API, copie `.env.example` para `.env` e ajuste `VITE_API_URL`. O valor padrão continua sendo `http://localhost:3001`. O backend precisa permitir a origem do Vite no CORS.

```env
VITE_API_URL=http://localhost:3001
```

O backend não está incluído neste repositório. Os endpoints, os campos enviados, o token Bearer e as chaves de sessão (`accessToken` e `idUser`) foram mantidos. Login usa `/login`; cadastro usa `/register`.

## Organização

- `src/view`: páginas da aplicação.
- `src/components`: formulários, navegação, campos, avatares, cartões de publicação, modais e notificações reutilizáveis.
- `src/controller`: acesso HTTP e operações compartilhadas de usuários, amizades e comunidade.
- `src/composables`: estado e comportamento compartilhado de ações, modais e notificações.
- `src/routes`: rotas, proteção de páginas e seleção dos estilos originais de cada tela.
- `src/assets/styles`: estilos reaproveitados do projeto original.
- `public/media`: imagens originais da taverna.
- `tests`: verificações da API e dos fluxos no navegador.

Os estilos são selecionados ao trocar de rota porque o projeto antigo usava CSS global diferente em cada página. Isso evita que o estilo de login altere o feed, por exemplo. As telas agora usam estado reativo e templates, sem gerar cards e listas com `innerHTML`.

A imagem `img/fundo-rpg.jpg`, referenciada no login e cadastro antigos, não existia no projeto fornecido. Nessas duas telas foi utilizada a imagem da taverna que já fazia parte dos arquivos originais. O restante dos estilos e a estrutura visual foram reaproveitados.

## Funcionalidades

- Página inicial, cadastro, login, sessão persistida e logout.
- Feed com busca e regras de visibilidade de perfis privados.
- Publicações com imagem e sistema, edição, exclusão, curtidas, comentários e compartilhamento.
- Perfis, biografia, avatares, privacidade e sistemas de RPG.
- Seguir, solicitar acesso a perfil privado, aceitar, recusar, cancelar, seguir de volta e remover amizade.
- Criar, editar, excluir, abrir e fechar inscrições de campanhas; entrar, sair, consultar participantes e usar o mural.
- Criar e editar comunidades, entrar, sair, consultar participantes e abrir o chat.
- Mensagens diretas e de comunidades com pesquisa, filtros, contadores e marcação de mensagens lidas.
- Atualização a cada cinco segundos, com encerramento dos temporizadores e listeners ao sair da tela.
- Navegação responsiva e compatibilidade com links antigos como `/Blog/index.html`, `/campanhas/index.html` e `/perfil/index.html?id=...`.

## Verificação

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run test:e2e
npm.cmd run format:check
```

Os testes de navegador usam Chrome instalado e uma API simulada em memória. O servidor real não estava disponível durante a verificação (conexão recusada na porta 3001); por isso, a validação com seus dados reais depende de iniciar o backend. Eles não criam usuários nem alteram dados do servidor real. Se não houver Chrome, instale-o ou ajuste `channel` em `playwright.config.js` para um navegador disponível.

Para disponibilizar o build, execute `npm.cmd run build` e sirva a pasta `dist`. A hospedagem precisa redirecionar as rotas da aplicação para `index.html`, pois a navegação usa `createWebHistory`.

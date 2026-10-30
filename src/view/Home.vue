<template>
  <form>
    <p class="subtitulo">COMUNIDADE DE RPG</p>

    <h1>
      Conectando
      <span>aventureiros</span>
    </h1>

    <p class="descricao">
      Encontre jogadores, participe de campanhas, crie seu personagem e viva grandes histórias no
      mundo do RPG.
    </p>

    <nav>
      <button type="button" id="Cadastro" @click="$router.push('/cadastro')">Criar conta</button>

      <button type="button" id="Login" @click="$router.push('/login')">Entrar</button>
    </nav>

    <div class="recursos">
      <div>
        <h3>Encontre jogadores</h3>
        <p>Conheça pessoas que também gostam de RPG.</p>
      </div>

      <div>
        <h3>Crie campanhas</h3>
        <p>Organize suas aventuras e encontre grupos.</p>
      </div>

      <div>
        <h3>Faça parte</h3>
        <p>Compartilhe histórias com a comunidade.</p>
      </div>
    </div>
  </form>
</template>

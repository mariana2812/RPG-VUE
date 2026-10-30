<script setup>
import { ref, computed, onMounted } from 'vue'
import { serviceController as api } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
import { amigosDe, nomeUsuario, privado } from '../controller/community.controller.js'
import { useAction } from '../composables/useAction.js'
import Avatar from '../components/Avatar.vue'
import PageTitle from '../components/PageTitle.vue'
const users = ref([]),
  friends = ref(new Set()),
  search = ref('')
const { busy, message, run } = useAction()
const results = computed(() =>
  users.value.filter(
    (user) =>
      String(user.id) !== session.userId &&
      `${user.nome || ''} ${user.email || ''}`
        .toLowerCase()
        .includes(search.value.trim().toLowerCase()),
  ),
)
onMounted(() =>
  run(async () => {
    const [people, relations] = await Promise.all([api.get('/users'), api.get('/friends')])
    users.value = people
    friends.value = amigosDe(relations, session.userId)
  }),
)
</script>
<template>
  <main class="pagina">
    <PageTitle
      label="COMUNIDADE"
      title="Descobrir jogadores"
      description="Encontre novas pessoas para suas aventuras."
    />
    <p class="mensagem" role="status">{{ message }}</p>
    <section class="card">
      <input
        id="pesquisa"
        v-model="search"
        placeholder="Pesquisar por nome ou e-mail..."
        aria-label="Pesquisar jogadores"
      />
    </section>
    <section class="card">
      <div id="usuarios" class="lista">
        <p v-if="!results.length && !busy">Nenhum jogador encontrado.</p>
        <div v-for="user in results" :key="user.id" class="item-lista">
          <Avatar :user="user" class="avatar" />
          <div class="item-info">
            <strong>{{ nomeUsuario(user) }}</strong>
            <p>
              {{
                privado(user) && !friends.has(String(user.id))
                  ? 'Perfil privado'
                  : user.biografia || 'Sem biografia'
              }}
            </p>
          </div>
          <RouterLink class="botao" :to="{ path: '/perfil', query: { id: user.id } }"
            >Ver perfil</RouterLink
          >
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { serviceController as api, query, record } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
import { nomeUsuario } from '../controller/community.controller.js'
import { useAction } from '../composables/useAction.js'
import PageTitle from '../components/PageTitle.vue'
import FormField from '../components/FormField.vue'
import Avatar from '../components/Avatar.vue'
const userId = session.userId
const communities = ref([]),
  members = ref([]),
  users = ref([]),
  expanded = ref(new Set())
const name = ref(''),
  description = ref(''),
  editing = ref(null),
  nameField = ref(null)
const { busy, message, run } = useAction()
const title = computed(() => (editing.value != null ? 'Editar comunidade' : 'Criar comunidade'))
const owner = (community) => String(community.ownerId) === userId
const membership = (community) =>
  members.value.find(
    (item) => String(item.communityId) === String(community.id) && String(item.userId) === userId,
  )
const participantIds = (community) =>
  new Set([
    String(community.ownerId),
    ...members.value
      .filter((item) => String(item.communityId) === String(community.id))
      .map((item) => String(item.userId)),
  ])
async function load() {
  const [data, relations] = await Promise.all([
    api.get('/communities'),
    api.get('/communityMembers'),
  ])
  communities.value = data
  members.value = relations
}
function reset() {
  editing.value = null
  name.value = description.value = ''
}
async function edit(community) {
  editing.value = community.id
  name.value = community.nome
  description.value = community.descricao
  await nextTick()
  document.getElementById('nome')?.focus()
}
function save() {
  run(async () => {
    const nome = name.value.trim(),
      descricao = description.value.trim()
    if (!nome || !descricao) throw new Error('Preencha o nome e a descrição.')
    if (editing.value != null) {
      const current = await api.get(record('communities', editing.value))
      if (!owner(current)) throw new Error('Somente o criador pode editar a comunidade.')
      await api.patch(record('communities', editing.value), { nome, descricao })
    } else await api.post('/communities', { nome, descricao, ownerId: userId })
    reset()
    await load()
  })
}
function join(community) {
  run(async () => {
    const relations = await api.get(
      query('communityMembers', { communityId: community.id, userId }),
    )
    if (membership(community)) {
      for (const item of relations) await api.remove(record('communityMembers', item.id))
    } else if (!relations.length)
      await api.post('/communityMembers', { communityId: community.id, userId })
    await load()
  })
}
function showParticipants(community) {
  run(async () => {
    if (expanded.value.has(community.id)) expanded.value.delete(community.id)
    else {
      users.value = await api.get('/users')
      expanded.value.add(community.id)
    }
  })
}
onMounted(() => run(load))
</script>
<template>
  <main class="pagina">
    <PageTitle
      label="GRUPOS"
      title="Comunidades"
      description="Crie espaços para conversar sobre seus sistemas favoritos."
    />
    <p class="mensagem" role="status">{{ message }}</p>
    <section class="card">
      <h2>{{ title }}</h2>
      <form id="formComunidade" class="formulario" @submit.prevent="save">
        <FormField id="nome" v-model="name" label="Nome" required /><FormField
          id="descricao"
          v-model="description"
          label="Descrição"
          multiline
          required
        /><button class="botao" :disabled="busy">
          {{ editing != null ? 'Salvar alterações' : 'Criar comunidade' }}</button
        ><button v-if="editing != null" type="button" class="botao-secundario" @click="reset">
          Cancelar
        </button>
      </form>
    </section>
    <section class="card">
      <h2>Comunidades</h2>
      <div id="comunidades" class="grid">
        <p v-if="!communities.length && !busy">Nenhuma comunidade criada.</p>
        <article v-for="community in communities" :key="community.id" class="card">
          <h3>{{ community.nome }}</h3>
          <p>{{ community.descricao }}</p>
          <p>{{ participantIds(community).size }} participante(s)</p>
          <button class="botao" :disabled="busy || owner(community)" @click="join(community)">
            {{ owner(community) ? 'Sua comunidade' : membership(community) ? 'Sair' : 'Entrar' }}
          </button>
          <template v-if="owner(community) || membership(community)"
            ><RouterLink
              class="botao-secundario"
              :to="{ path: '/mensagens', query: { comunidade: community.id } }"
              >Abrir chat</RouterLink
            ><button v-if="owner(community)" class="botao-secundario" @click="edit(community)">
              Editar comunidade</button
            ><button
              type="button"
              class="botao-secundario ver-participantes"
              :aria-expanded="expanded.has(community.id)"
              :disabled="busy"
              @click="showParticipants(community)"
            >
              Ver participantes
            </button>
            <div v-if="expanded.has(community.id)" class="comunidade-participantes">
              <RouterLink
                v-for="user in users.filter((item) =>
                  participantIds(community).has(String(item.id)),
                )"
                :key="user.id"
                :to="{ path: '/perfil', query: { id: user.id } }"
                ><Avatar :user="user" /><span>{{ nomeUsuario(user) }}</span></RouterLink
              >
            </div></template
          >
        </article>
      </div>
    </section>
  </main>
</template>

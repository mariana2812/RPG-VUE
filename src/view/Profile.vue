<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { serviceController as api, record, query } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
import {
  nomeUsuario,
  avatarUsuario,
  criarAvatar,
  privado,
  relacaoEntre,
  isAcceptedFriendRelation,
  mestreId,
  excluirPublicacao,
  excluirCampanha,
} from '../controller/community.controller.js'
import { criarAmizadeMutua } from '../controller/friend.controller.js'
import { responderSolicitacao, notificationRevision } from '../composables/useNotifications.js'
import { abrirModal } from '../composables/useDialog.js'
import { useAction } from '../composables/useAction.js'
import Avatar from '../components/Avatar.vue'
import FormField from '../components/FormField.vue'
import PageTitle from '../components/PageTitle.vue'
const route = useRoute(),
  userId = session.userId,
  id = String(route.query.id || userId),
  mine = id === userId
const user = ref(null),
  relations = ref([]),
  people = ref([]),
  systems = ref([]),
  posts = ref([]),
  campaigns = ref([]),
  avatars = ref([])
const editing = ref(false),
  name = ref(''),
  biography = ref(''),
  privacy = ref('publico'),
  avatar = ref(''),
  systemName = ref('')
const { busy, message, run } = useAction()
const pair = computed(() => relations.value.filter((item) => relacaoEntre(item, userId, id)))
const friendship = computed(() => pair.value.find(isAcceptedFriendRelation))
const following = computed(() =>
  pair.value.find((item) => String(item.userId) === userId && String(item.friendId) === id),
)
const follower = computed(() =>
  pair.value.find((item) => String(item.userId) === id && String(item.friendId) === userId),
)
const visible = computed(() => mine || !privado(user.value) || !!friendship.value)
const requests = computed(() =>
  relations.value.filter(
    (item) =>
      String(item.friendId) === userId &&
      String(item.userId) !== userId &&
      ['pending', 'following'].includes(item.status),
  ),
)
const friendLabel = computed(() =>
  friendship.value
    ? 'Remover amizade'
    : following.value?.status === 'pending'
      ? 'Cancelar solicitação'
      : following.value?.status === 'following'
        ? 'Deixar de seguir'
        : follower.value?.status === 'pending'
          ? 'Solicitação recebida: veja no seu perfil'
          : follower.value?.status === 'following'
            ? 'Seguir de volta'
            : privado(user.value)
              ? 'Solicitar para seguir'
              : 'Seguir',
)
async function loadSystems() {
  const [all, links] = await Promise.all([
    api.get('/systems'),
    api.get(query('userSystems', { userId: id })),
  ])
  systems.value = all.filter((system) =>
    links.some((link) => String(link.systemId) === String(system.id)),
  )
}
async function loadPosts() {
  posts.value = (await api.get('/blog'))
    .filter((post) => String(post.userId ?? post.user?.id) === id)
    .reverse()
}
async function loadCampaigns() {
  campaigns.value = (await api.get('/campaigns'))
    .filter((item) => String(mestreId(item)) === id)
    .reverse()
}
async function load() {
  const [person, friends] = await Promise.all([api.get(record('users', id)), api.get('/friends')])
  user.value = person
  relations.value = friends
  if (visible.value) await Promise.all([loadSystems(), loadPosts(), loadCampaigns()])
  else {
    systems.value = []
    posts.value = []
    campaigns.value = []
  }
  if (mine) people.value = await api.get('/users')
  await nextTick()
  if (route.hash === '#solicitacoesCard')
    document
      .getElementById('solicitacoesCard')
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' })
}
async function startEdit() {
  if (!mine || !user.value) return
  name.value = user.value.nome || ''
  biography.value = user.value.biografia || ''
  privacy.value = privado(user.value) ? 'privado' : 'publico'
  avatar.value = avatarUsuario(user.value)
  let catalog
  try {
    catalog = await api.get('/avatar')
  } catch (error) {
    if (error.status !== 404) throw error
    catalog = ['novo', 'Mariana', 'Olivier'].map((name) => ({ url: criarAvatar(name) }))
  }
  if (!Array.isArray(catalog)) throw new Error('A lista de avatares está inválida.')
  avatars.value = [
    { url: avatar.value },
    ...catalog.filter(
      (item) => item?.url && typeof item.url === 'string' && item.url !== avatar.value,
    ),
  ]
  editing.value = true
  await nextTick()
  document.getElementById('nome')?.focus()
}
async function cancelEdit() {
  editing.value = false
  await nextTick()
  document.getElementById('abrirEdicao')?.focus()
}
function save() {
  run(async () => {
    if (!mine) return
    const nome = name.value.trim()
    if (!nome) throw new Error('Digite seu nome.')
    await api.patch(record('users', userId), {
      nome,
      biografia: biography.value.trim(),
      avatar: avatar.value,
      privado: privacy.value === 'privado',
    })
    editing.value = false
    await load()
    message.value = 'Perfil salvo com sucesso.'
  })
}
function addSystem() {
  run(async () => {
    if (!mine) return
    const nome = systemName.value.trim()
    if (!nome) return
    const all = await api.get('/systems')
    let system = all.find((item) => item.nome.toLowerCase() === nome.toLowerCase())
    if (!system) system = await api.post('/systems', { nome })
    const links = await api.get(query('userSystems', { userId, systemId: system.id }))
    if (!links.length) await api.post('/userSystems', { userId, systemId: system.id })
    systemName.value = ''
    await loadSystems()
  })
}
function removeSystem(system) {
  run(async () => {
    if (!mine || session.userId !== userId)
      throw new Error('Você só pode remover sistemas do seu próprio perfil.')
    const links = (await api.get(query('userSystems', { userId, systemId: system.id }))).filter(
      (item) => String(item.userId) === userId && String(item.systemId) === String(system.id),
    )
    if (links.some((item) => item.id == null || item.id === ''))
      throw new Error(
        'Não foi possível remover: o vínculo do sistema está sem identificador no servidor.',
      )
    for (const item of links) await api.remove(record('userSystems', item.id))
    await loadSystems()
    message.value = 'Sistema removido do perfil.'
  })
}
function toggleFriend() {
  run(async () => {
    if (friendship.value) {
      for (const item of pair.value)
        if (item.id != null) await api.remove(record('friends', item.id))
    } else if (['pending', 'following'].includes(following.value?.status))
      await api.remove(record('friends', following.value.id))
    else if (follower.value?.status === 'pending') return
    else if (follower.value?.status === 'following') await criarAmizadeMutua(id, relations.value)
    else
      await api.post('/friends', {
        userId,
        friendId: id,
        status: privado(user.value) ? 'pending' : 'following',
      })
    await load()
  })
}
function respond(request, accept) {
  run(async () => {
    await responderSolicitacao(request.id, accept)
    await load()
    message.value = accept ? 'Solicitação aceita.' : 'Solicitação recusada.'
  })
}
function followBack(request) {
  run(async () => {
    await criarAmizadeMutua(request.userId, await api.get('/friends'))
    await load()
    message.value = 'Agora vocês são amigos.'
  })
}
function removePost(post) {
  run(async () => {
    if (
      !(await abrirModal({
        titulo: 'Excluir publicação?',
        mensagem: 'A publicação será removida do mural. Essa ação não pode ser desfeita.',
        confirmar: 'Excluir publicação',
        perigo: true,
      }))
    )
      return
    await excluirPublicacao(post.id)
    await loadPosts()
  })
}
function removeCampaign(campaign) {
  run(async () => {
    if (
      !(await abrirModal({
        titulo: 'Excluir campanha?',
        mensagem:
          'A campanha, seus participantes e mensagens serão removidos. Essa ação não pode ser desfeita.',
        confirmar: 'Excluir campanha',
        perigo: true,
      }))
    )
      return
    await excluirCampanha(campaign.id)
    await loadCampaigns()
    message.value = 'Campanha removida do perfil.'
  })
}
watch(notificationRevision, () => run(load))
watch(
  () => route.hash,
  (hash) => {
    if (hash === '#editar' && mine) run(startEdit)
  },
)
onMounted(() =>
  run(async () => {
    await load()
    if (mine && route.hash === '#editar') await startEdit()
  }),
)
</script>
<template>
  <main class="pagina">
    <PageTitle label="AVENTUREIRO" :title="mine ? 'Meu perfil' : 'Perfil'" />
    <p class="mensagem" role="status">{{ message }}</p>
    <section class="card">
      <div class="perfil-grande">
        <Avatar id="avatarPerfil" :user="user" alt="Avatar" />
        <div>
          <h2 id="nomePerfil">{{ user ? nomeUsuario(user) : 'Carregando...' }}</h2>
          <p id="emailPerfil">{{ mine ? user?.email : '' }}</p>
          <p id="bioPerfil">
            {{ visible ? user?.biografia || 'Sem biografia' : 'Este perfil é privado.' }}
          </p>
          <div id="tagsPerfil" class="tags" style="margin-top: 12px">
            <span v-for="system in systems" :key="system.id" class="tag">{{ system.nome }}</span>
          </div>
        </div>
      </div>
      <div v-if="!mine && user" id="acoesPerfil" style="margin-top: 20px">
        <button
          class="botao"
          :disabled="busy || (!friendship && !following && follower?.status === 'pending')"
          @click="toggleFriend"
        >
          {{ friendLabel }}</button
        ><RouterLink
          v-if="!privado(user) || friendship"
          class="botao-secundario"
          :to="{ path: '/mensagens', query: { contato: id } }"
          >Enviar mensagem</RouterLink
        >
      </div>
      <button
        v-if="mine && !editing"
        id="abrirEdicao"
        class="botao"
        type="button"
        aria-controls="editarPerfil"
        :aria-expanded="editing"
        :disabled="busy"
        @click="run(startEdit)"
      >
        Editar perfil
      </button>
    </section>
    <section v-if="editing" id="editarPerfil" class="card">
      <h2>Editar perfil</h2>
      <form id="formPerfil" class="formulario" @submit.prevent="save">
        <FormField id="nome" v-model="name" label="Nome" required /><FormField
          id="biografia"
          v-model="biography"
          label="Biografia"
          multiline
        />
        <div class="campo">
          <label for="privacidadePerfil">Privacidade da conta</label
          ><select id="privacidadePerfil" v-model="privacy">
            <option value="publico">Pública</option>
            <option value="privado">Privada</option>
          </select>
        </div>
        <div class="campo">
          <label>Escolha um avatar</label>
          <div id="avatarOpcoes" class="avatar-opcoes">
            <button
              v-for="(option, index) in avatars"
              :key="option.url"
              type="button"
              class="avatar-escolha"
              :title="option.url === user.avatar ? 'Seu avatar atual' : 'Avatar ' + (index + 1)"
              :aria-pressed="option.url === avatar"
              @click="avatar = option.url"
            >
              <img
                :src="option.url"
                :alt="'Avatar ' + (index + 1)"
                :class="{ selecionado: option.url === avatar }"
              />
            </button>
          </div>
        </div>
        <button class="botao" :disabled="busy">Salvar perfil</button
        ><button id="cancelarEdicao" class="botao-secundario" type="button" @click="cancelEdit">
          Cancelar
        </button>
      </form>
    </section>
    <section v-if="mine" id="solicitacoesCard" class="card">
      <h2>Seguidores e solicitações</h2>
      <div id="solicitacoesPerfil" class="lista">
        <p v-if="!requests.length">Você não tem solicitações ou novos seguidores.</p>
        <div v-for="request in requests" :key="request.id" class="item-lista">
          <RouterLink class="item-info" :to="{ path: '/perfil', query: { id: request.userId } }"
            ><strong>{{
              nomeUsuario(people.find((person) => String(person.id) === String(request.userId)))
            }}</strong>
            <p>
              {{
                request.status === 'pending' ? 'Solicitou para seguir você' : 'Está seguindo você'
              }}
            </p></RouterLink
          >
          <div class="acoes-seguidor">
            <template v-if="request.status === 'pending'"
              ><button class="botao" :disabled="busy" @click="respond(request, true)">
                Aceitar</button
              ><button class="botao-secundario" :disabled="busy" @click="respond(request, false)">
                Recusar
              </button></template
            ><button v-else class="botao" :disabled="busy" @click="followBack(request)">
              Seguir de volta
            </button>
          </div>
        </div>
      </div>
    </section>
    <section v-if="!visible" id="perfilPrivadoAviso" class="card">
      <h2>Perfil privado</h2>
      <p>
        Envie uma solicitação para ver as publicações, os sistemas e as campanhas deste jogador.
      </p>
    </section>
    <section v-if="visible" id="sistemasCard" class="card">
      <h2>Sistemas de RPG</h2>
      <form v-if="editing" id="adicionarSistemaArea" class="comentar" @submit.prevent="addSystem">
        <input id="nomeSistema" v-model="systemName" placeholder="Ex: D&D 5e" /><button
          id="adicionarSistema"
          class="botao"
          :disabled="busy"
        >
          Adicionar
        </button>
      </form>
      <div id="sistemas" class="tags" style="margin-top: 15px">
        <span v-for="system in systems" :key="system.id" class="tag tag-removivel"
          ><span>{{ system.nome }}</span
          ><button
            v-if="mine"
            type="button"
            class="tag-remover"
            title="Remover sistema"
            :aria-label="'Remover sistema ' + system.nome"
            :disabled="busy"
            @click="removeSystem(system)"
          >
            ×
          </button></span
        >
      </div>
    </section>
    <section v-if="visible" id="campanhasCard" class="card">
      <h2>Campanhas criadas</h2>
      <div id="campanhasPerfil" class="lista">
        <p v-if="!campaigns.length">Nenhuma campanha criada.</p>
        <div v-for="campaign in campaigns" :key="campaign.id" class="item-lista">
          <RouterLink class="item-info" :to="{ path: '/campanha', query: { id: campaign.id } }"
            ><strong>{{ campaign.nome }}</strong>
            <p>
              {{ campaign.sistema || campaign.sistemaNome || 'Sistema não informado' }} ·
              {{ campaign.status || 'aberta' }}
            </p></RouterLink
          ><button
            v-if="mine"
            class="botao-perigo"
            :disabled="busy"
            @click="removeCampaign(campaign)"
          >
            Excluir
          </button>
        </div>
      </div>
    </section>
    <section class="card">
      <h2>Publicações</h2>
      <div id="postsPerfil" class="lista">
        <p v-if="!visible">Conteúdo disponível após aceitar sua solicitação.</p>
        <p v-else-if="!posts.length">Nenhuma publicação.</p>
        <div v-for="post in posts" :key="post.id" class="item-lista">
          <RouterLink class="item-info" :to="{ path: '/taverna', hash: '#post-' + post.id }">{{
            post.conteudo || post.body || ''
          }}</RouterLink
          ><button v-if="mine" class="botao-perigo" :disabled="busy" @click="removePost(post)">
            Excluir
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

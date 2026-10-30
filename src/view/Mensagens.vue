<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import { serviceController as api } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
import { nomeUsuario, privado, amigosDe } from "../controller/comunidade.controller.js"
import {
    contatosComConversa,
    atualizarResumoMensagens,
    marcarLidas,
    lerIds
} from "../composables/useNotificacoes.js"
import { useAcao } from "../composables/useAcao.js"
import TituloPagina from "../components/TituloPagina.vue"
import Avatar from "../components/Avatar.vue"
import Icone from "../components/Icone.vue"
import ContadorMensagens from "../components/ContadorMensagens.vue"
const route = useRoute(),
    userId = sessao.userId,
    contactsKey = "frontdContatosPerfil:" + userId
const users = ref([]),
    friends = ref(new Set()),
    companions = ref(new Set()),
    openedProfiles = ref(lerIds(contactsKey))
const communities = ref([]),
    members = ref([]),
    selected = ref(null),
    messages = ref([])
const search = ref(""),
    filter = ref("todos"),
    text = ref(""),
    chat = ref(null),
    loading = ref(false),
    refreshing = ref(false)
const { carregando, mensagem, executar } = useAcao()
let timer,
    version = 0,
    disposed = false
const queryText = computed(() => search.value.trim().toLowerCase())
const allowed = user =>
    String(user.id) !== userId &&
    (contatosComConversa.value.has(String(user.id)) ||
        friends.value.has(String(user.id)) ||
        companions.value.has(String(user.id)) ||
        (openedProfiles.value.has(String(user.id)) && !privado(user)))
const contacts = computed(() =>
    filter.value === "comunidade"
        ? []
        : users.value.filter(
              user =>
                  allowed(user) &&
                  (filter.value !== "amigos" || friends.value.has(String(user.id))) &&
                  `${user.nome || ""} ${user.email || ""}`.toLowerCase().includes(queryText.value)
          )
)
const groups = computed(() =>
    filter.value === "amigos"
        ? []
        : communities.value.filter(item => item.nome.toLowerCase().includes(queryText.value))
)
const selectedCommunityIds = () => new Set(communities.value.map(item => String(item.id)))
const groupParticipants = community => {
    const ids = new Set([
        String(community.ownerId),
        ...members.value
            .filter(item => String(item.communityId) === String(community.id))
            .map(item => String(item.userId))
    ])
    return users.value.filter(item => ids.has(String(item.id)))
}
const member = community =>
    String(community.ownerId) === userId ||
    members.value.some(
        item => String(item.communityId) === String(community.id) && String(item.userId) === userId
    )
const detail = computed(() => {
    if (!selected.value) return ""
    if (selected.value.type === "usuario") return "Conversa direta"
    const people = groupParticipants(selected.value.data)
    return `${people.length} participante(s): ${people.map(user => (String(user.id) === userId ? "Você" : nomeUsuario(user))).join(", ")}`
})
const isSelected = (type, id) =>
    selected.value?.type === type && String(selected.value.data.id) === String(id)
const author = id =>
    String(id) === userId ? "Você" : nomeUsuario(users.value.find(item => String(item.id) === String(id)))
async function load() {
    const [people, relations, groups, links, history] = await Promise.all(
        ["users", "friends", "communities", "communityMembers", "messages"].map(name => api.get("/" + name))
    )
    if (disposed) return
    users.value = people
    friends.value = amigosDe(relations, userId)
    members.value = links
    communities.value = groups.filter(item => member(item))
    const ids = new Set()
    communities.value.forEach(group => groupParticipants(group).forEach(person => ids.add(String(person.id))))
    ids.delete(userId)
    companions.value = ids
    atualizarResumoMensagens(history, selectedCommunityIds())
    const group = communities.value.find(item => String(item.id) === String(route.query.comunidade))
    if (group) {
        await select("comunidade", group)
        return
    }
    const contact = users.value.find(
        item => String(item.id) === String(route.query.contato) && String(item.id) !== userId
    )
    if (contact) {
        openedProfiles.value.add(String(contact.id))
        localStorage.setItem(contactsKey, JSON.stringify([...openedProfiles.value]))
        await select("usuario", contact)
    }
}
async function select(type, data) {
    if (type === "usuario" && !allowed(data)) return
    if (type === "comunidade" && !member(data))
        throw new Error("Você precisa participar da comunidade para abrir o chat.")
    selected.value = { type, data }
    text.value = ""
    messages.value = []
    loading.value = true
    await loadChat(true)
}
async function loadChat(forceScroll = false) {
    if (!selected.value) return
    const conversation = selected.value,
        current = ++version
    const id = String(conversation.data.id)
    try {
        const history = await api.get("/messages")
        if (disposed || selected.value !== conversation || current !== version) return
        const atEnd =
            !chat.value || chat.value.scrollHeight - chat.value.scrollTop - chat.value.clientHeight < 40
        messages.value = history
            .filter(item =>
                conversation.type === "comunidade"
                    ? String(item.communityId) === id
                    : item.communityId == null &&
                      ((String(item.senderId) === userId && String(item.receiverId) === id) ||
                          (String(item.senderId) === id && String(item.receiverId) === userId))
            )
            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        atualizarResumoMensagens(history, selectedCommunityIds())
        marcarLidas(messages.value)
        loading.value = false
        await nextTick()
        if (
            !disposed &&
            selected.value === conversation &&
            current === version &&
            chat.value &&
            (atEnd || forceScroll)
        )
            chat.value.scrollTop = chat.value.scrollHeight
    } finally {
        if (current === version) loading.value = false
    }
}
function send() {
    executar(async () => {
        const conteudo = text.value.trim(),
            conversation = selected.value
        if (!conversation || !conteudo) return
        let data
        if (conversation.type === "comunidade") {
            if (!member(conversation.data)) throw new Error("Você não participa desta comunidade.")
            data = {
                communityId: conversation.data.id,
                senderId: userId,
                conteudo,
                created_at: new Date().toISOString()
            }
        } else {
            if (!allowed(conversation.data))
                throw new Error("Abra o perfil do jogador para iniciar uma conversa.")
            data = {
                senderId: userId,
                receiverId: conversation.data.id,
                conteudo,
                created_at: new Date().toISOString()
            }
        }
        await api.post("/messages", data)
        if (disposed) return
        mensagem.value = `Mensagem enviada para ${nomeUsuario(conversation.data)}.`
        if (selected.value === conversation && text.value.trim() === conteudo) text.value = ""
        await loadChat(true)
    })
}
async function refresh() {
    if (document.hidden || refreshing.value || !selected.value) return
    refreshing.value = true
    try {
        await loadChat()
    } catch (error) {
        if (!disposed) mensagem.value = error.message
    } finally {
        refreshing.value = false
    }
}
const visible = () => {
    if (!document.hidden) refresh()
}
onMounted(() => {
    executar(load)
    timer = setInterval(refresh, 5000)
    document.addEventListener("visibilitychange", visible)
})
onUnmounted(() => {
    disposed = true
    version++
    clearInterval(timer)
    document.removeEventListener("visibilitychange", visible)
})
</script>
<template>
    <main class="pagina">
        <TituloPagina label="CONVERSAS" title="Mensagens" />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="mensagens-layout">
            <aside class="painel-contatos">
                <RouterLink class="nova-conversa" to="/descobrir">
                    <Icone name="user-plus" />
                    Encontrar jogador
                </RouterLink>
                <label class="busca-contatos" for="buscarContato">Buscar contatos</label>
                <input id="buscarContato" v-model="search" type="search" placeholder="Nome do jogador..." />
                <nav class="filtros-contatos" aria-label="Filtrar contatos">
                    <button
                        v-for="[value, label] in [
                            ['todos', 'Todos'],
                            ['amigos', 'Amigos'],
                            ['comunidade', 'Comunidades']
                        ]"
                        :key="value"
                        type="button"
                        :data-filtro="value"
                        :aria-pressed="filter === value"
                        @click="filter = value"
                    >
                        {{ label }}
                    </button>
                </nav>
                <div id="contatos" class="contatos">
                    <button
                        v-for="user in contacts"
                        :key="'user-' + user.id"
                        type="button"
                        class="contato"
                        :class="{ ativo: isSelected('usuario', user.id) }"
                        :title="nomeUsuario(user)"
                        :aria-pressed="isSelected('usuario', user.id)"
                        @click="executar(() => select('usuario', user))"
                    >
                        <Avatar :user="user" class="avatar" />
                        <span>{{ nomeUsuario(user) }}</span>
                        <ContadorMensagens type="usuario" :id="user.id" />
                    </button>
                    <button
                        v-for="group in groups"
                        :key="'community-' + group.id"
                        type="button"
                        class="contato contato-comunidade"
                        :class="{ ativo: isSelected('comunidade', group.id) }"
                        :title="'Chat da comunidade ' + group.nome"
                        :aria-pressed="isSelected('comunidade', group.id)"
                        @click="executar(() => select('comunidade', group))"
                    >
                        <span class="avatar avatar-comunidade" aria-hidden="true">#</span>
                        <span>{{ group.nome }}</span>
                        <ContadorMensagens type="comunidade" :id="group.id" />
                    </button>
                    <p v-if="!contacts.length && !groups.length" class="contatos-vazio">
                        {{
                            search
                                ? "Nenhuma conversa encontrada."
                                : filter === "comunidade"
                                  ? "Você ainda não participa de comunidades."
                                  : "Nenhum contato nesta lista."
                        }}
                    </p>
                </div>
                <RouterLink class="contatos-comunidades" to="/comunidades">Explorar comunidades</RouterLink>
            </aside>
            <section class="chat">
                <header class="chat-cabecalho">
                    <h3 id="nomeContato">
                        {{ selected ? nomeUsuario(selected.data) : "Mensagens diretas" }}
                    </h3>
                    <p id="detalheContato">{{ detail }}</p>
                </header>
                <div id="chat" ref="chat" class="chat-mensagens">
                    <div v-if="!selected" class="chat-vazio">
                        <Icone name="messages-square" />
                        <h2>A próxima aventura começa com uma conversa.</h2>
                        <p>Seus amigos e companheiros de comunidade estão ao lado.</p>
                        <RouterLink class="botao" to="/descobrir">Encontrar jogador</RouterLink>
                    </div>
                    <template v-else>
                        <p v-if="loading">Carregando conversa...</p>
                        <p v-else-if="!messages.length">Nenhuma mensagem nesta conversa.</p>
                        <div
                            v-for="item in messages"
                            :key="item.id"
                            class="balao"
                            :class="{ meu: String(item.senderId) === userId }"
                        >
                            <strong v-if="selected.type === 'comunidade'" class="mensagem-autor">
                                {{ author(item.senderId) }}
                            </strong>
                            <span>{{ item.conteudo }}</span>
                        </div>
                    </template>
                </div>
                <form class="enviar-mensagem" @submit.prevent="send">
                    <input
                        id="mensagem"
                        v-model="text"
                        placeholder="Digite uma mensagem..."
                        aria-label="Mensagem"
                        maxlength="5000"
                        :disabled="!selected"
                        @keydown.enter="
                            event => {
                                if (event.isComposing) event.preventDefault()
                            }
                        "
                    />
                    <button id="enviar" class="botao" :disabled="carregando || !selected">Enviar</button>
                </form>
            </section>
        </section>
    </main>
</template>

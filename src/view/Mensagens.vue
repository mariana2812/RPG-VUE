<script setup lang="ts">
// Aqui eu controlo a conversa selecionada e a atualização das mensagens.
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { useRoute } from "vue-router"
import { apiController as api } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import {
    nomeUsuario,
    privado,
    amigosDe,
    participantesDaComunidade,
    participaDaComunidade
} from "../controller/comunidade.controller.ts"
import {
    contatosComConversa,
    atualizarResumoMensagens,
    marcarLidas,
    lerIds
} from "../composables/useNotificacoes.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import TituloPagina from "../components/TituloPagina.vue"
import ListaContatos from "../components/mensagens/ListaContatos.vue"
import Icone from "../components/Icone.vue"
const route = useRoute()
const userId = sessao.userId
const contactsKey = "frontdContatosPerfil:" + userId
const users = ref([])
const friends = ref(new Set())
const companions = ref(new Set())
const openedProfiles = ref(lerIds(contactsKey))
const communities = ref([])
const members = ref([])
const selected = ref(null)
const messages = ref([])
const search = ref("")
const filter = ref("todos")
const text = ref("")
const chat = ref<HTMLElement | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const { carregando, mensagem, executar } = useOperacaoAssincrona()
let timer
let version = 0
let disposed = false
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
const conversas = computed(() => [
    ...contacts.value.map(data => ({ type: "usuario", data })),
    ...groups.value.map(data => ({ type: "comunidade", data }))
])
const communityIds = computed(() => new Set(communities.value.map(item => String(item.id))))
const groupParticipants = community => {
    const ids = participantesDaComunidade(community, members.value)
    return users.value.filter(item => ids.has(String(item.id)))
}
const member = community => participaDaComunidade(community, members.value, userId)
const detail = computed(() => {
    if (!selected.value) return ""
    if (selected.value.type === "usuario") return "Conversa direta"
    const people = groupParticipants(selected.value.data)
    return `${people.length} participante(s): ${people.map(user => (String(user.id) === userId ? "Você" : nomeUsuario(user))).join(", ")}`
})
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
    atualizarResumoMensagens(history, communityIds.value)
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
// Confiro se a conversa ainda é a mesma para não misturar respostas de consultas anteriores.
async function loadChat(forceScroll = false) {
    if (!selected.value) return
    const conversation = selected.value
    const current = ++version
    const id = String(conversation.data.id)
    const isCurrent = () => !disposed && selected.value === conversation && current === version
    try {
        const history = await api.get("/messages")
        if (!isCurrent()) return
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
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        atualizarResumoMensagens(history, communityIds.value)
        marcarLidas(messages.value)
        loading.value = false
        await nextTick()
        if (isCurrent() && chat.value && (atEnd || forceScroll))
            chat.value.scrollTop = chat.value.scrollHeight
    } finally {
        if (current === version) loading.value = false
    }
}
function send() {
    executar(async () => {
        const conteudo = text.value.trim()
        const conversation = selected.value
        if (!conversation || !conteudo) return
        const community = conversation.type === "comunidade"
        if (community && !member(conversation.data)) throw new Error("Você não participa desta comunidade.")
        if (!community && !allowed(conversation.data))
            throw new Error("Abra o perfil do jogador para iniciar uma conversa.")
        const destino = community
            ? { communityId: conversation.data.id }
            : { receiverId: conversation.data.id }
        await api.post("/messages", {
            ...destino,
            senderId: userId,
            conteudo,
            created_at: new Date().toISOString()
        })
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
            <ListaContatos
                v-model:search="search"
                v-model:filter="filter"
                :conversas="conversas"
                :selected="selected"
                @selecionar="(type, data) => executar(() => select(type, data))"
            />
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

<script setup lang="ts">
// Aqui eu controlo a conversa selecionada e a atualização das mensagens.
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue"
import { apiController as api } from "../controller/api.controller.ts"
import { nomeUsuario } from "../controller/comunidade.controller.ts"
import { atualizarResumoMensagens, marcarLidas } from "../composables/useNotificacoes.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import TituloPagina from "../components/TituloPagina.vue"
import ListaContatos from "../components/mensagens/ListaContatos.vue"
import PainelConversa from "../components/mensagens/PainelConversa.vue"
import { useContatosMensagens } from "../composables/useContatosMensagens.ts"
const { userId, users, search, filter, conversas, communityIds, groupParticipants, member, allowed, load } =
    useContatosMensagens(select, () => disposed)
const selected = ref(null)
const messages = ref([])
const text = ref("")
const chat = ref<InstanceType<typeof PainelConversa> | null>(null)
const loading = ref(false)
const refreshing = ref(false)
const { carregando, mensagem, executar } = useOperacaoAssincrona()
let timer
let version = 0
let disposed = false
const detail = computed(() => {
    if (!selected.value) return ""
    if (selected.value.type === "usuario") return "Conversa direta"
    const people = groupParticipants(selected.value.data)
    return `${people.length} participante(s): ${people.map(user => (String(user.id) === userId ? "Você" : nomeUsuario(user))).join(", ")}`
})
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
        const atEnd = chat.value?.estaNoFinal() ?? true
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
        if (isCurrent() && chat.value && (atEnd || forceScroll)) chat.value.rolarParaFinal()
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
            <PainelConversa
                ref="chat"
                v-model="text"
                :selected="selected"
                :detail="detail"
                :messages="messages"
                :users="users"
                :loading="loading"
                :carregando="carregando"
                @enviar="send"
            />
        </section>
    </main>
</template>

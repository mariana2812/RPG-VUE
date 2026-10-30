import { ref } from "vue"
import { serviceController as api, record } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
export const solicitacoesPendentes = ref([])
export const mensagensRecebidas = ref([])
export const contatosComConversa = ref(new Set())
export const mensagensLidas = ref(new Set())
export const notificacoesAbertas = ref(false)
export const alteracaoSolicitacoes = ref(0)
export const avisos = ref([])
const readKey = () => "frontdReadMessages:" + sessao.userId
export function lerIds(key) {
    try {
        const ids = JSON.parse(localStorage.getItem(key) || "[]")
        return new Set(Array.isArray(ids) ? ids.map(String) : [])
    } catch {
        return new Set()
    }
}
export function contarNaoLidas(type, id) {
    return mensagensRecebidas.value.filter(
        item =>
            !mensagensLidas.value.has(String(item.id)) &&
            (!type ||
                (type === "comunidade"
                    ? String(item.communityId) === String(id)
                    : item.communityId == null && String(item.senderId) === String(id)))
    ).length
}
export function atualizarResumoMensagens(messages, communityIds) {
    const id = sessao.userId
    mensagensRecebidas.value = messages.filter(
        item =>
            item.id != null &&
            String(item.senderId) !== id &&
            (item.communityId != null
                ? communityIds.has(String(item.communityId))
                : String(item.receiverId) === id)
    )
    contatosComConversa.value = new Set(
        messages
            .filter(
                item =>
                    item.communityId == null &&
                    (String(item.senderId) === id || String(item.receiverId) === id)
            )
            .map(item => String(String(item.senderId) === id ? item.receiverId : item.senderId))
    )
}
export function marcarLidas(messages) {
    if (document.hidden) return
    const ids = lerIds(readKey())
    messages.forEach(item => {
        if (item.id != null && String(item.senderId) !== sessao.userId) ids.add(String(item.id))
    })
    mensagensLidas.value = ids
    localStorage.setItem(readKey(), JSON.stringify([...ids]))
}
export async function responderSolicitacao(id, accept) {
    const request = await api.get(record("friends", id))
    if (String(request.friendId) !== sessao.userId || request.status !== "pending")
        throw new Error("Esta solicitação não está mais disponível.")
    if (accept) await api.patch(record("friends", id), { status: "accepted" })
    else await api.remove(record("friends", id))
    solicitacoesPendentes.value = solicitacoesPendentes.value.filter(item => String(item.id) !== String(id))
    alteracaoSolicitacoes.value++
}
export function adicionarAviso(titulo, mensagem, tipo = "info", exibirToast = true, url = "") {
    if (exibirToast) avisos.value.unshift({ id: Date.now() + Math.random(), titulo, mensagem, tipo, url })
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
        const item = new Notification(titulo, { body: mensagem })
        if (url)
            item.onclick = () => {
                window.focus()
                location.href = url
            }
    }
}
export function iniciarNotificacoes() {
    let stopped = false,
        checking = false
    const id = sessao.userId
    mensagensLidas.value = lerIds(readKey())
    async function refresh() {
        if (stopped || checking || !sessao.token || sessao.userId !== id) return
        checking = true
        try {
            const [messages, relations, communities, members] = await Promise.all(
                ["messages", "friends", "communities", "communityMembers"].map(name => api.get("/" + name))
            )
            if (stopped || sessao.userId !== id) return
            const ids = new Set(
                communities
                    .filter(
                        item =>
                            String(item.ownerId) === id ||
                            members.some(
                                member =>
                                    String(member.communityId) === String(item.id) &&
                                    String(member.userId) === id
                            )
                    )
                    .map(item => String(item.id))
            )
            atualizarResumoMensagens(messages, ids)
            solicitacoesPendentes.value = relations.filter(
                item => item.status === "pending" && String(item.friendId) === id
            )
        } catch (error) {
            console.warn("Não foi possível atualizar as notificações.", error.message)
        } finally {
            checking = false
        }
    }
    const visible = () => {
        if (!document.hidden) refresh()
    }
    const storage = event => {
        if (event.key === readKey()) mensagensLidas.value = lerIds(readKey())
    }
    const interval = setInterval(refresh, 5000)
    window.addEventListener("focus", refresh)
    window.addEventListener("storage", storage)
    document.addEventListener("visibilitychange", visible)
    refresh()
    return () => {
        stopped = true
        clearInterval(interval)
        window.removeEventListener("focus", refresh)
        window.removeEventListener("storage", storage)
        document.removeEventListener("visibilitychange", visible)
        solicitacoesPendentes.value = []
        mensagensRecebidas.value = []
        contatosComConversa.value = new Set()
        notificacoesAbertas.value = false
    }
}

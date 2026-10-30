import { ref, computed } from 'vue'
import { serviceController as api, record } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
export const pendingRequests = ref([])
export const receivedMessages = ref([])
export const historyContacts = ref(new Set())
export const readMessages = ref(new Set())
export const notificationsOpen = ref(false)
export const notificationRevision = ref(0)
export const toasts = ref([])
const readKey = () => 'frontdReadMessages:' + session.userId
export function readIds(key) {
    try { const ids = JSON.parse(localStorage.getItem(key) || '[]'); return new Set(Array.isArray(ids) ? ids.map(String) : []) }
    catch { return new Set() }
}
export function unreadCount(type, id) {
    return receivedMessages.value.filter(item => !readMessages.value.has(String(item.id)) && (!type || (type === 'comunidade' ? String(item.communityId) === String(id) : item.communityId == null && String(item.senderId) === String(id)))).length
}
export const unreadTotal = computed(() => unreadCount())
export function updateMessageSummary(messages, communityIds) {
    const id = session.userId
    receivedMessages.value = messages.filter(item => item.id != null && String(item.senderId) !== id && (item.communityId != null ? communityIds.has(String(item.communityId)) : String(item.receiverId) === id))
    historyContacts.value = new Set(messages.filter(item => item.communityId == null && (String(item.senderId) === id || String(item.receiverId) === id)).map(item => String(String(item.senderId) === id ? item.receiverId : item.senderId)))
}
export function markRead(messages) {
    if (document.hidden) return
    const ids = readIds(readKey())
    messages.forEach(item => { if (item.id != null && String(item.senderId) !== session.userId) ids.add(String(item.id)) })
    readMessages.value = ids
    localStorage.setItem(readKey(), JSON.stringify([...ids]))
}
export async function responderSolicitacao(id, accept) {
    const request = await api.get(record('friends', id))
    if (String(request.friendId) !== session.userId || request.status !== 'pending') throw new Error('Esta solicitação não está mais disponível.')
    if (accept) await api.patch(record('friends', id), { status: 'accepted' })
    else await api.remove(record('friends', id))
    pendingRequests.value = pendingRequests.value.filter(item => String(item.id) !== String(id))
    notificationRevision.value++
}
export function adicionarAviso(titulo, mensagem, tipo = 'info', exibirToast = true, url = '') {
    if (exibirToast) toasts.value.unshift({ id: Date.now() + Math.random(), titulo, mensagem, tipo, url })
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
        const item = new Notification(titulo, { body: mensagem })
        if (url) item.onclick = () => { window.focus(); location.href = url }
    }
}
export function startNotifications() {
    let stopped = false, checking = false
    const id = session.userId
    readMessages.value = readIds(readKey())
    async function refresh() {
        if (stopped || checking || !session.token || session.userId !== id) return
        checking = true
        try {
            const [messages, relations, communities, members] = await Promise.all(['messages','friends','communities','communityMembers'].map(name => api.get('/' + name)))
            if (stopped || session.userId !== id) return
            const ids = new Set(communities.filter(item => String(item.ownerId) === id || members.some(member => String(member.communityId) === String(item.id) && String(member.userId) === id)).map(item => String(item.id)))
            updateMessageSummary(messages, ids)
            pendingRequests.value = relations.filter(item => item.status === 'pending' && String(item.friendId) === id)
        } catch (error) { console.warn('Não foi poss?vel atualizar as notificações.', error.message) }
        finally { checking = false }
    }
    const visible = () => { if (!document.hidden) refresh() }
    const storage = event => { if (event.key === readKey()) readMessages.value = readIds(readKey()) }
    const interval = setInterval(refresh, 5000)
    window.addEventListener('focus', refresh)
    window.addEventListener('storage', storage)
    document.addEventListener('visibilitychange', visible)
    refresh()
    return () => {
        stopped = true
        clearInterval(interval)
        window.removeEventListener('focus', refresh)
        window.removeEventListener('storage', storage)
        document.removeEventListener('visibilitychange', visible)
        pendingRequests.value = []; receivedMessages.value = []; historyContacts.value = new Set(); notificationsOpen.value = false
    }
}

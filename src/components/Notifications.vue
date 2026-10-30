<script setup>
import { watch, ref, nextTick, onUnmounted } from 'vue'
import { session } from '../controller/user.controller.js'
import { serviceController as api } from '../controller/service.controller.js'
import { nomeUsuario } from '../controller/community.controller.js'
import { pendingRequests, notificationsOpen, responderSolicitacao, startNotifications, toasts } from '../composables/useNotifications.js'
import { useAction } from '../composables/useAction.js'
import Toast from './Toast.vue'
const modal = ref(null), users = ref([])
const { busy, message, run } = useAction()
let stop, focus
watch(() => session.userId, id => { stop?.(); if (id && session.token) stop = startNotifications() }, { immediate: true })
watch(notificationsOpen, async open => {
    if (!open) return
    focus = document.activeElement
    await nextTick()
    modal.value.showModal()
    run(async () => {
        const [relations, people] = await Promise.all([api.get('/friends'), api.get('/users')])
        pendingRequests.value = relations.filter(item => item.status === 'pending' && String(item.friendId) === session.userId)
        users.value = people
    })
})
function close() { notificationsOpen.value = false; nextTick(() => focus?.isConnected && focus.focus()) }
onUnmounted(() => stop?.())
</script>
<template>
    <Teleport to="body">
        <dialog v-if="notificationsOpen" id="listaSolicitacoes" ref="modal" aria-labelledby="tituloSolicitacoes" @cancel.prevent="close">
            <h2 id="tituloSolicitacoes">Solicitações para seguir</h2>
            <div><article v-for="request in pendingRequests" :key="request.id"><RouterLink :to="{ path: '/perfil', query: { id: request.userId } }">{{ nomeUsuario(users.find(user => String(user.id) === String(request.userId))) }}</RouterLink><button :disabled="busy" @click="run(() => responderSolicitacao(request.id, true))">Aceitar</button><button :disabled="busy" @click="run(() => responderSolicitacao(request.id, false))">Recusar</button></article></div>
            <p role="status">{{ message || (busy ? 'Carregando...' : !pendingRequests.length ? 'Nenhuma solicitação pendente.' : '') }}</p><button type="button" @click="close">Fechar</button>
        </dialog>
        <div class="notification-stack" aria-live="polite"><Toast v-for="toast in toasts" :key="toast.id" :toast="toast" @close="toasts = toasts.filter(item => item.id !== toast.id)" /></div>
    </Teleport>
</template>

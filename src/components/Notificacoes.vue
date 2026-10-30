<script setup>
import { watch, ref, nextTick, onUnmounted } from "vue"
import { sessao } from "../controller/user.controller.js"
import { serviceController as api } from "../controller/service.controller.js"
import { nomeUsuario } from "../controller/comunidade.controller.js"
import {
    solicitacoesPendentes,
    notificacoesAbertas,
    responderSolicitacao,
    iniciarNotificacoes,
    avisos
} from "../composables/useNotificacoes.js"
import { useAcao } from "../composables/useAcao.js"
import Aviso from "./Aviso.vue"
const modal = ref(null),
    users = ref([])
const { carregando, mensagem, executar } = useAcao()
let stop, focus
watch(
    () => sessao.userId,
    id => {
        stop?.()
        if (id && sessao.token) stop = iniciarNotificacoes()
    },
    { immediate: true }
)
watch(notificacoesAbertas, async open => {
    if (!open) return
    focus = document.activeElement
    await nextTick()
    if (!modal.value || !notificacoesAbertas.value) return
    modal.value.showModal()
    executar(async () => {
        const [relations, people] = await Promise.all([api.get("/friends"), api.get("/users")])
        solicitacoesPendentes.value = relations.filter(
            item => item.status === "pending" && String(item.friendId) === sessao.userId
        )
        users.value = people
    })
})
function close() {
    notificacoesAbertas.value = false
    nextTick(() => focus?.isConnected && focus.focus())
}
onUnmounted(() => stop?.())
</script>
<template>
    <Teleport to="body">
        <dialog
            v-if="notificacoesAbertas"
            id="listaSolicitacoes"
            ref="modal"
            aria-labelledby="tituloSolicitacoes"
            @cancel.prevent="close"
        >
            <h2 id="tituloSolicitacoes">Solicitações para seguir</h2>
            <div>
                <article v-for="request in solicitacoesPendentes" :key="request.id">
                    <RouterLink :to="{ path: '/perfil', query: { id: request.userId } }">
                        {{ nomeUsuario(users.find(user => String(user.id) === String(request.userId))) }}
                    </RouterLink>
                    <button
                        :disabled="carregando"
                        @click="executar(() => responderSolicitacao(request.id, true))"
                    >
                        Aceitar
                    </button>
                    <button
                        :disabled="carregando"
                        @click="executar(() => responderSolicitacao(request.id, false))"
                    >
                        Recusar
                    </button>
                </article>
            </div>
            <p role="status">
                {{
                    mensagem ||
                    (carregando
                        ? "Carregando..."
                        : !solicitacoesPendentes.length
                          ? "Nenhuma solicitação pendente."
                          : "")
                }}
            </p>
            <button type="button" @click="close">Fechar</button>
        </dialog>
        <div class="notification-stack" aria-live="polite">
            <Aviso
                v-for="toast in avisos"
                :key="toast.id"
                :toast="toast"
                @close="avisos = avisos.filter(item => item.id !== toast.id)"
            />
        </div>
    </Teleport>
</template>

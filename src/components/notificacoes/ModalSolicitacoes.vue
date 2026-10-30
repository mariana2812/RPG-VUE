<script setup lang="ts">
// Quando o modal abre, busco as solicitações pendentes e os nomes dos usuários.
import { watch, ref, nextTick } from "vue"
import { sessao } from "../../controller/usuario.controller.ts"
import { apiController as api } from "../../controller/api.controller.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import {
    solicitacoesPendentes,
    notificacoesAbertas,
    responderSolicitacao
} from "../../composables/useNotificacoes.ts"
import { useOperacaoAssincrona } from "../../composables/useOperacaoAssincrona.ts"
const modal = ref<HTMLDialogElement | null>(null)
const users = ref([])
const { carregando, mensagem, executar } = useOperacaoAssincrona()
let focus: HTMLElement | null
watch(notificacoesAbertas, async open => {
    if (!open) return
    focus = document.activeElement instanceof HTMLElement ? document.activeElement : null
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
</script>
<template>
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
</template>

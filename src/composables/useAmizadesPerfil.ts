// Aqui eu reúno as ações de seguir, aceitar solicitações e seguir de volta.
import { computed } from "vue"
import type { DadosPerfil } from "./useDadosPerfil.ts"
import { apiController as api, record } from "../controller/api.controller.ts"
import { privado } from "../controller/comunidade.controller.ts"
import { criarAmizadeMutua } from "../controller/amizade.controller.ts"
import { responderSolicitacao } from "./useNotificacoes.ts"

export function useAmizadesPerfil(perfil: DadosPerfil) {
    const { user, userId, id, relations, pair, friendship, following, follower, load, executar, mensagem } =
        perfil
    const friendLabel = computed(() => {
        if (friendship.value) return "Remover amizade"
        if (following.value?.status === "pending") return "Cancelar solicitação"
        if (following.value?.status === "following") return "Deixar de seguir"
        if (follower.value?.status === "pending") return "Solicitação recebida: veja no seu perfil"
        if (follower.value?.status === "following") return "Seguir de volta"
        if (privado(user.value)) return "Solicitar para seguir"
        return "Seguir"
    })

    function toggleFriend() {
        executar(async () => {
            if (friendship.value) {
                for (const item of pair.value)
                    if (item.id != null) await api.remove(record("friends", item.id))
            } else if (["pending", "following"].includes(following.value?.status))
                await api.remove(record("friends", following.value.id))
            else if (follower.value?.status === "pending") return
            else if (follower.value?.status === "following") await criarAmizadeMutua(id, relations.value)
            else
                await api.post("/friends", {
                    userId,
                    friendId: id,
                    status: privado(user.value) ? "pending" : "following"
                })
            await load()
        })
    }

    function respond(request, accept) {
        executar(async () => {
            await responderSolicitacao(request.id, accept)
            await load()
            mensagem.value = accept ? "Solicitação aceita." : "Solicitação recusada."
        })
    }

    function followBack(request) {
        executar(async () => {
            await criarAmizadeMutua(request.userId, await api.get("/friends"))
            await load()
            mensagem.value = "Agora vocês são amigos."
        })
    }
    return { friendLabel, toggleFriend, respond, followBack }
}

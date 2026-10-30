// Aqui ficam funções compartilhadas de publicações, amizades e comunidades.
import type { Usuario } from "../interfaces/usuario.interface.ts"
import type { Relacao } from "../interfaces/comunidade.interface.ts"
import type { Id } from "../interfaces/identificador.interface.ts"
import { apiController as api, query, record } from "./api.controller.ts"
import { abrirModal } from "../composables/useModal.ts"
export async function deleteByIdOrFilter(collection, id, filters = {}) {
    if (id != null && id !== "") {
        try {
            return await api.remove(record(collection, id))
        } catch (error) {
            if (error.status !== 404) throw error
        }
    }

    const items = await api.get(query(collection, filters))

    if (!Array.isArray(items) || items.length === 0) {
        throw new Error("Registro não encontrado para remover.")
    }

    const item = items[0]
    if (item?.id == null) {
        throw new Error("Este registro não possui identificador para exclusão.")
    }

    return api.remove(record(collection, item.id))
}

export function isAcceptedFriendRelation(relation) {
    return !relation.status || relation.status === "accepted" || relation.status === "friend"
}

export async function removerVinculos(colecoes, filtros) {
    for (const colecao of colecoes) {
        const itens = await api.get(query(colecao, filtros))
        for (const item of itens) await api.remove(record(colecao, item.id))
    }
}

export function criarAvatar(nome) {
    return "https://api.dicebear.com/9.x/bottts/svg?seed=" + encodeURIComponent(nome || "RPG")
}

export async function excluirPublicacao(id) {
    const post = await api.get(record("blog", id))
    if (String(post.userId ?? post.user?.id) !== localStorage.getItem("idUser"))
        throw new Error("Somente o autor pode excluir esta publicação.")
    await removerVinculos(["likes", "comments"], { postId: id })
    await deleteByIdOrFilter("blog", id, { id })
}

export async function editarPublicacao(id) {
    const post = await api.get(record("blog", id))
    if (String(post.userId ?? post.user?.id) !== localStorage.getItem("idUser"))
        throw new Error("Somente o autor pode editar esta publicação.")
    const conteudo = await abrirModal({
        titulo: "Editar publicação",
        mensagem: "Atualize sua história.",
        campo: true,
        multilinha: true,
        rotulo: "Publicação",
        valor: post.conteudo || post.body || "",
        confirmar: "Salvar alterações"
    })
    if (typeof conteudo !== "string") return
    if (!conteudo) throw new Error("Escreva o texto da publicação.")
    await api.patch(record("blog", id), { conteudo, updated_at: new Date().toISOString() })
}

export const privado = (usuario?: Usuario) => usuario?.privado === true || usuario?.privado === "true"
export const nomeUsuario = (usuario?: Usuario) =>
    usuario?.nome || usuario?.username || usuario?.email || "Usuário"
export const avatarUsuario = (usuario?: Usuario, estilo = "bottts") =>
    usuario?.avatar ||
    "https://api.dicebear.com/9.x/" + estilo + "/svg?seed=" + encodeURIComponent(nomeUsuario(usuario))
export const relacaoEntre = (relacao: Relacao, a: Id, b: Id) =>
    (String(relacao.userId) === String(a) && String(relacao.friendId) === String(b)) ||
    (String(relacao.userId) === String(b) && String(relacao.friendId) === String(a))
export const amigosDe = (relacoes: Relacao[], id: Id) =>
    new Set(
        relacoes
            .filter(
                item =>
                    isAcceptedFriendRelation(item) &&
                    (String(item.userId) === String(id) || String(item.friendId) === String(id))
            )
            .map(item => String(String(item.userId) === String(id) ? item.friendId : item.userId))
    )

export const participantesDaComunidade = (comunidade, membros) =>
    new Set([
        String(comunidade.ownerId),
        ...membros
            .filter(item => String(item.communityId) === String(comunidade.id))
            .map(item => String(item.userId))
    ])
export const participaDaComunidade = (comunidade, membros, id) =>
    participantesDaComunidade(comunidade, membros).has(String(id))

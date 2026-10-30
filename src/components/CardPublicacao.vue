<script setup lang="ts">
// Cada card cuida das curtidas, dos comentários e das ações daquela publicação.
import { computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { nomeUsuario, excluirPublicacao, editarPublicacao } from "../controller/comunidade.controller.ts"
import { confirmarExclusao } from "../composables/useModal.ts"
import type { Publicacao } from "../interfaces/comunidade.interface.ts"
import type { Usuario } from "../interfaces/usuario.interface.ts"
import { useInteracoesPublicacao } from "../composables/useInteracoesPublicacao.ts"
import AvatarUsuario from "./AvatarUsuario.vue"
import ComentariosPublicacao from "./ComentariosPublicacao.vue"
const props = defineProps<{ post: Publicacao; currentUser?: Usuario }>()
const { likes, comments, people, open, text, carregando, mensagem, executar, mine, liked, loadCounts, like, toggleComments, comment } = useInteracoesPublicacao(props)
const emit = defineEmits(["changed"])
const router = useRouter()
const date = computed(() => {
    const value = new Date(props.post.created_at)
    return !props.post.created_at || Number.isNaN(value.getTime())
        ? "Publicação"
        : value.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit"
          })
})
const validImage = computed(() => /^data:image\/(png|jpeg|webp);base64,/.test(props.post.imagem || ""))
function edit() {
    executar(async () => {
        await editarPublicacao(props.post.id)
        emit("changed")
    })
}
function remove() {
    executar(async () => {
        if (
            !(await confirmarExclusao(
                "Excluir publicação?",
                "Sua publicação será removida do mural. Essa ação não pode ser desfeita.",
                "Excluir publicação"
            ))
        )
            return
        await excluirPublicacao(props.post.id)
        emit("changed")
    })
}
function share() {
    executar(async () => {
        const url = new URL(
            router.resolve({ path: "/taverna", hash: "#post-" + props.post.id }).href,
            location.origin
        ).href
        try {
            await navigator.clipboard.writeText(url)
            mensagem.value = "Link da publicação copiado."
        } catch {
            mensagem.value = "Link da publicação: " + url
        }
    })
}
onMounted(() => executar(loadCounts))
</script>
<template>
    <article
        :id="'post-' + post.id"
        class="post"
        :data-post-id="post.id"
        :data-user-id="post.userId ?? post.user?.id"
    >
        <div class="post-header">
            <AvatarUsuario :user="post.user" style-name="adventurer" class="post-avatar" />
            <div class="post-user">
                <strong>{{ nomeUsuario(post.user) }}</strong>
                <span>{{ date }}</span>
            </div>
        </div>
        <div class="post-content">
            {{ post.conteudo || post.body || "" }}
            <p v-if="post.sistema">{{ post.sistema }}</p>
            <img v-if="validImage" :src="post.imagem" alt="Imagem da publicação" class="post-image" />
        </div>
        <div class="post-actions">
            <button type="button" class="like-button" :class="{ liked }" :disabled="carregando" @click="like">
                ♡ Curtir
                <span class="like-count">{{ likes.length }}</span>
            </button>
            <button type="button" class="comment-button" :disabled="carregando" @click="toggleComments">
                💬 Comentar
                <span class="comment-count">{{ comments.length }}</span>
            </button>
            <button type="button" class="share-button" :disabled="carregando" @click="share">
                ↗ Compartilhar
            </button>
            <template v-if="mine">
                <button
                    type="button"
                    class="delete-post-button botao-perigo"
                    :disabled="carregando"
                    @click="remove"
                >
                    🗑 Excluir
                </button>
                <button type="button" class="edit-post-button" :disabled="carregando" @click="edit">
                    Editar
                </button>
            </template>
        </div>
        <p class="feed-message" role="status">{{ mensagem }}</p>
        <ComentariosPublicacao v-model="text" :comments="comments" :people="people" :open="open" :carregando="carregando" @enviar="comment" />
    </article>
</template>

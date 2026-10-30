<script setup>
import { ref, computed, onMounted } from "vue"
import { useRouter } from "vue-router"
import { serviceController as api, query, record } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
import { nomeUsuario, excluirPublicacao, editarPublicacao } from "../controller/comunidade.controller.js"
import { abrirModal } from "../composables/useModal.js"
import { adicionarAviso } from "../composables/useNotificacoes.js"
import { useAcao } from "../composables/useAcao.js"
import Avatar from "./Avatar.vue"
const props = defineProps({ post: { type: Object, required: true }, currentUser: Object })
const emit = defineEmits(["changed"])
const router = useRouter(),
    userId = sessao.userId
const likes = ref([]),
    comments = ref([]),
    people = ref(new Map()),
    open = ref(false),
    text = ref("")
const { carregando, mensagem, executar } = useAcao()
const mine = computed(() => String(props.post.userId ?? props.post.user?.id) === userId)
const liked = computed(() => likes.value.some(item => String(item.userId) === userId))
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
async function loadCounts() {
    const [reactions, replies] = await Promise.all([
        api.get(query("likes", { postId: props.post.id })),
        api.get(query("comments", { postId: props.post.id }))
    ])
    likes.value = reactions
    comments.value = replies
}
function like() {
    executar(async () => {
        const current = await api.get(query("likes", { postId: props.post.id, userId }))
        if (current[0]) await api.remove(record("likes", current[0].id))
        else {
            await api.post("/likes", {
                postId: String(props.post.id),
                userId: props.currentUser?.id ?? userId
            })
            if (!mine.value) adicionarAviso("Nova curtida", "Sua publicação recebeu uma curtida.", "success")
        }
        likes.value = await api.get(query("likes", { postId: props.post.id }))
    })
}
async function loadComments() {
    comments.value = await api.get(query("comments", { postId: props.post.id }))
    const ids = [...new Set(comments.value.map(item => String(item.userId)))]
    await Promise.all(
        ids.map(async id => {
            if (people.value.has(id)) return
            try {
                people.value.set(id, await api.get(record("users", id)))
            } catch {
                people.value.set(id, null)
            }
        })
    )
}
function toggleComments() {
    open.value = !open.value
    if (open.value) executar(loadComments)
}
function comment() {
    executar(async () => {
        const conteudo = text.value.trim()
        if (!conteudo) return
        await api.post("/comments", {
            postId: String(props.post.id),
            userId: props.currentUser?.id ?? userId,
            conteudo,
            created_at: new Date().toISOString()
        })
        if (!mine.value) adicionarAviso("Novo comentário", "Alguém comentou na sua publicação.", "info")
        text.value = ""
        await loadComments()
    })
}
function edit() {
    executar(async () => {
        await editarPublicacao(props.post.id)
        emit("changed")
    })
}
function remove() {
    executar(async () => {
        if (
            !(await abrirModal({
                titulo: "Excluir publicação?",
                mensagem: "Sua publicação será removida do mural. Essa ação não pode ser desfeita.",
                confirmar: "Excluir publicação",
                perigo: true
            }))
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
            <Avatar :user="post.user" style-name="adventurer" class="post-avatar" />
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
        <div class="comments-area" :class="{ open }">
            <div class="comments-list">
                <div v-if="!comments.length" class="empty-small">Nenhum comentário ainda.</div>
                <div v-for="reply in comments" :key="reply.id" class="comment">
                    <Avatar
                        :user="people.get(String(reply.userId))"
                        style-name="adventurer"
                        class="comment-avatar"
                    />
                    <div class="comment-body">
                        <strong>{{ nomeUsuario(people.get(String(reply.userId))) }}</strong>
                        <p>{{ reply.conteudo }}</p>
                    </div>
                </div>
            </div>
            <form class="comment-form" @submit.prevent="comment">
                <input v-model="text" type="text" placeholder="Escreva um comentário..." maxlength="500" />
                <button type="submit" class="send-comment" :disabled="carregando">Enviar</button>
            </form>
        </div>
    </article>
</template>

// Aqui eu reúno as curtidas e os comentários de cada publicação.
import { ref, computed } from "vue"
import type { Publicacao } from "../interfaces/comunidade.interface.ts"
import type { Usuario } from "../interfaces/usuario.interface.ts"
import { apiController as api, query, record } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { adicionarAviso } from "./useNotificacoes.ts"
import { useOperacaoAssincrona } from "./useOperacaoAssincrona.ts"
export function useInteracoesPublicacao(props: { post: Publicacao; currentUser?: Usuario }) {
    const userId = sessao.userId
    const likes = ref([])
    const comments = ref([])
    const people = ref(new Map())
    const open = ref(false)
    const text = ref("")
    const { carregando, mensagem, executar } = useOperacaoAssincrona()
    const mine = computed(() => String(props.post.userId ?? props.post.user?.id) === userId)
    const liked = computed(() => likes.value.some(item => String(item.userId) === userId))
    async function loadCounts() {
        const [reactions, replies] = await Promise.all([
            api.get(query("likes", { postId: String(props.post.id) })),
            api.get(query("comments", { postId: String(props.post.id) }))
        ])
        likes.value = reactions
        comments.value = replies
    }
    function like() {
        executar(async () => {
            const current = await api.get(query("likes", { postId: String(props.post.id), userId }))
            if (current[0]) await api.remove(record("likes", current[0].id))
            else {
                await api.post("/likes", {
                    postId: String(props.post.id),
                    userId: props.currentUser?.id ?? userId
                })
                if (!mine.value) adicionarAviso("Nova curtida", "Sua publicação recebeu uma curtida.", "success")
            }
            likes.value = await api.get(query("likes", { postId: String(props.post.id) }))
        })
    }
    async function loadComments() {
        comments.value = await api.get(query("comments", { postId: String(props.post.id) }))
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
    return { likes, comments, people, open, text, carregando, mensagem, executar, mine, liked, loadCounts, like, toggleComments, comment }
}

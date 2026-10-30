// Aqui eu carrego os dados do perfil e verifico quais informações podem aparecer.
import { ref, computed, nextTick } from "vue"
import { useRoute } from "vue-router"
import { apiController as api, record, query } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { privado, relacaoEntre, isAcceptedFriendRelation } from "../controller/comunidade.controller.ts"
import { mestreId } from "../controller/campanha.controller.ts"
import { useOperacaoAssincrona } from "./useOperacaoAssincrona.ts"

export function useDadosPerfil() {
    const route = useRoute()
    const userId = sessao.userId
    const id = String(route.query.id || userId)
    const mine = id === userId
    const user = ref(null)
    const relations = ref([])
    const people = ref([])
    const systems = ref([])
    const posts = ref([])
    const campaigns = ref([])
    const { carregando, mensagem, executar } = useOperacaoAssincrona()
    const pair = computed(() => relations.value.filter(item => relacaoEntre(item, userId, id)))
    const friendship = computed(() => pair.value.find(isAcceptedFriendRelation))
    const following = computed(() =>
        pair.value.find(item => String(item.userId) === userId && String(item.friendId) === id)
    )

    const follower = computed(() =>
        pair.value.find(item => String(item.userId) === id && String(item.friendId) === userId)
    )

    const visible = computed(() => mine || !privado(user.value) || !!friendship.value)
    const requests = computed(() =>
        relations.value.filter(
            item =>
                String(item.friendId) === userId &&
                String(item.userId) !== userId &&
                ["pending", "following"].includes(item.status)
        )
    )

    async function loadSystems() {
        const [all, links] = await Promise.all([
            api.get("/systems"),
            api.get(query("userSystems", { userId: id }))
        ])
        systems.value = all.filter(system => links.some(link => String(link.systemId) === String(system.id)))
    }

    async function loadPosts() {
        posts.value = (await api.get("/blog"))
            .filter(post => String(post.userId ?? post.user?.id) === id)
            .reverse()
    }

    async function loadCampaigns() {
        campaigns.value = (await api.get("/campaigns"))
            .filter(item => String(mestreId(item)) === id)
            .reverse()
    }

    async function load() {
        const [person, friends] = await Promise.all([api.get(record("users", id)), api.get("/friends")])
        user.value = person
        relations.value = friends
        if (visible.value) {
            await Promise.all([loadSystems(), loadPosts(), loadCampaigns()])
        } else {
            systems.value = []
            posts.value = []
            campaigns.value = []
        }
        if (mine) people.value = await api.get("/users")
        await nextTick()
        if (route.hash === "#solicitacoesCard")
            document
                .getElementById("solicitacoesCard")
                ?.scrollIntoView({ block: "start", behavior: "smooth" })
    }
    return {
        route,
        userId,
        id,
        mine,
        user,
        relations,
        people,
        systems,
        posts,
        campaigns,
        carregando,
        mensagem,
        executar,
        pair,
        friendship,
        following,
        follower,
        visible,
        requests,
        loadSystems,
        loadPosts,
        loadCampaigns,
        load
    }
}

// Este nome representa os dados que as funções de edição e amizade recebem.
export type DadosPerfil = ReturnType<typeof useDadosPerfil>

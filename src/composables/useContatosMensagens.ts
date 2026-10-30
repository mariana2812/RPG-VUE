// Aqui eu organizo a busca dos contatos e os filtros da lista de conversas.
import { ref, computed } from "vue"
import { useRoute } from "vue-router"
import { apiController as api } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import {
    privado,
    amigosDe,
    participantesDaComunidade,
    participaDaComunidade
} from "../controller/comunidade.controller.ts"
import { contatosComConversa, atualizarResumoMensagens, lerIds } from "./useNotificacoes.ts"

export function useContatosMensagens(
    selecionar: (tipo: string, dados: any) => Promise<void>,
    foiEncerrada: () => boolean
) {
    const route = useRoute()
    const userId = sessao.userId
    const contactsKey = "frontdContatosPerfil:" + userId
    const users = ref([])
    const friends = ref(new Set())
    const companions = ref(new Set())
    const openedProfiles = ref(lerIds(contactsKey))
    const communities = ref([])
    const members = ref([])
    const search = ref("")
    const filter = ref("todos")
    const queryText = computed(() => search.value.trim().toLowerCase())
    const allowed = user =>
        String(user.id) !== userId &&
        (contatosComConversa.value.has(String(user.id)) ||
            friends.value.has(String(user.id)) ||
            companions.value.has(String(user.id)) ||
            (openedProfiles.value.has(String(user.id)) && !privado(user)))

    const contacts = computed(() =>
        filter.value === "comunidade"
            ? []
            : users.value.filter(
                  user =>
                      allowed(user) &&
                      (filter.value !== "amigos" || friends.value.has(String(user.id))) &&
                      `${user.nome || ""} ${user.email || ""}`.toLowerCase().includes(queryText.value)
              )
    )

    const groups = computed(() =>
        filter.value === "amigos"
            ? []
            : communities.value.filter(item => item.nome.toLowerCase().includes(queryText.value))
    )

    const conversas = computed(() => [
        ...contacts.value.map(data => ({ type: "usuario", data })),
        ...groups.value.map(data => ({ type: "comunidade", data }))
    ])

    const communityIds = computed(() => new Set(communities.value.map(item => String(item.id))))
    const groupParticipants = community => {
        const ids = participantesDaComunidade(community, members.value)
        return users.value.filter(item => ids.has(String(item.id)))
    }

    const member = community => participaDaComunidade(community, members.value, userId)

    async function load() {
        const [people, relations, groups, links, history] = await Promise.all(
            ["users", "friends", "communities", "communityMembers", "messages"].map(name =>
                api.get("/" + name)
            )
        )
        if (foiEncerrada()) return
        users.value = people
        friends.value = amigosDe(relations, userId)
        members.value = links
        communities.value = groups.filter(item => member(item))
        const ids = new Set()
        communities.value.forEach(group =>
            groupParticipants(group).forEach(person => ids.add(String(person.id)))
        )
        ids.delete(userId)
        companions.value = ids
        atualizarResumoMensagens(history, communityIds.value)
        const group = communities.value.find(item => String(item.id) === String(route.query.comunidade))
        if (group) {
            await selecionar("comunidade", group)
            return
        }
        const contact = users.value.find(
            item => String(item.id) === String(route.query.contato) && String(item.id) !== userId
        )
        if (contact) {
            openedProfiles.value.add(String(contact.id))
            localStorage.setItem(contactsKey, JSON.stringify([...openedProfiles.value]))
            await selecionar("usuario", contact)
        }
    }
    return {
        userId,
        users,
        search,
        filter,
        conversas,
        communityIds,
        groupParticipants,
        member,
        allowed,
        load
    }
}

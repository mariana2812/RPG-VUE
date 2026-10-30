<script setup lang="ts">
// Esta página reúne os dados do perfil e controla suas ações de edição e amizade.
import { ref, computed, onMounted, watch, nextTick } from "vue"
import { useRoute } from "vue-router"
import { apiController as api, record, query } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import {
    nomeUsuario,
    avatarUsuario,
    criarAvatar,
    privado,
    relacaoEntre,
    isAcceptedFriendRelation,
    excluirPublicacao
} from "../controller/comunidade.controller.ts"
import { mestreId, excluirCampanha } from "../controller/campanha.controller.ts"
import { criarAmizadeMutua } from "../controller/amizade.controller.ts"
import { responderSolicitacao, alteracaoSolicitacoes } from "../composables/useNotificacoes.ts"
import { confirmarExclusao } from "../composables/useModal.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import AvatarUsuario from "../components/AvatarUsuario.vue"
import FormularioPerfil from "../components/perfil/FormularioPerfil.vue"
import SolicitacoesPerfil from "../components/perfil/SolicitacoesPerfil.vue"
import AtividadesPerfil from "../components/perfil/AtividadesPerfil.vue"
import TituloPagina from "../components/TituloPagina.vue"
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
const avatars = ref([])
const editing = ref(false)
const formulario = ref({ nome: "", biografia: "", privacidade: "publico", avatar: "" })
const systemName = ref("")
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
const friendLabel = computed(() =>
    friendship.value
        ? "Remover amizade"
        : following.value?.status === "pending"
          ? "Cancelar solicitação"
          : following.value?.status === "following"
            ? "Deixar de seguir"
            : follower.value?.status === "pending"
              ? "Solicitação recebida: veja no seu perfil"
              : follower.value?.status === "following"
                ? "Seguir de volta"
                : privado(user.value)
                  ? "Solicitar para seguir"
                  : "Seguir"
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
    campaigns.value = (await api.get("/campaigns")).filter(item => String(mestreId(item)) === id).reverse()
}
async function load() {
    const [person, friends] = await Promise.all([api.get(record("users", id)), api.get("/friends")])
    user.value = person
    relations.value = friends
    if (visible.value) await Promise.all([loadSystems(), loadPosts(), loadCampaigns()])
    else {
        systems.value = []
        posts.value = []
        campaigns.value = []
    }
    if (mine) people.value = await api.get("/users")
    await nextTick()
    if (route.hash === "#solicitacoesCard")
        document.getElementById("solicitacoesCard")?.scrollIntoView({ block: "start", behavior: "smooth" })
}
// Copio os dados para o formulário para só salvar as alterações após a confirmação.
async function startEdit() {
    if (!mine || !user.value) return
    formulario.value.nome = user.value.nome || ""
    formulario.value.biografia = user.value.biografia || ""
    formulario.value.privacidade = privado(user.value) ? "privado" : "publico"
    formulario.value.avatar = avatarUsuario(user.value)
    let catalog
    try {
        catalog = await api.get("/avatar")
    } catch (error) {
        if (error.status !== 404) throw error
        catalog = ["novo", "Mariana", "Olivier"].map(name => ({ url: criarAvatar(name) }))
    }
    if (!Array.isArray(catalog)) throw new Error("A lista de avatares está inválida.")
    avatars.value = [
        { url: formulario.value.avatar },
        ...catalog.filter(
            item => item?.url && typeof item.url === "string" && item.url !== formulario.value.avatar
        )
    ]
    editing.value = true
    await nextTick()
    document.getElementById("nome")?.focus()
}
async function cancelEdit() {
    editing.value = false
    await nextTick()
    document.getElementById("abrirEdicao")?.focus()
}
function save() {
    executar(async () => {
        if (!mine) return
        const nome = formulario.value.nome.trim()
        if (!nome) throw new Error("Digite seu nome.")
        await api.patch(record("users", userId), {
            nome,
            biografia: formulario.value.biografia.trim(),
            avatar: formulario.value.avatar,
            privado: formulario.value.privacidade === "privado"
        })
        editing.value = false
        await load()
        mensagem.value = "Perfil salvo com sucesso."
    })
}
function addSystem() {
    executar(async () => {
        if (!mine) return
        const nome = systemName.value.trim()
        if (!nome) return
        const all = await api.get("/systems")
        let system = all.find(item => item.nome.toLowerCase() === nome.toLowerCase())
        if (!system) system = await api.post("/systems", { nome })
        const links = await api.get(query("userSystems", { userId, systemId: system.id }))
        if (!links.length) await api.post("/userSystems", { userId, systemId: system.id })
        systemName.value = ""
        await loadSystems()
    })
}
function removeSystem(system) {
    executar(async () => {
        if (!mine || sessao.userId !== userId)
            throw new Error("Você só pode remover sistemas do seu próprio perfil.")
        const links = (await api.get(query("userSystems", { userId, systemId: system.id }))).filter(
            item => String(item.userId) === userId && String(item.systemId) === String(system.id)
        )
        if (links.some(item => item.id == null || item.id === ""))
            throw new Error(
                "Não foi possível remover: o vínculo do sistema está sem identificador no servidor."
            )
        for (const item of links) await api.remove(record("userSystems", item.id))
        await loadSystems()
        mensagem.value = "Sistema removido do perfil."
    })
}
function toggleFriend() {
    executar(async () => {
        if (friendship.value) {
            for (const item of pair.value) if (item.id != null) await api.remove(record("friends", item.id))
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
function removePost(post) {
    executar(async () => {
        if (
            !(await confirmarExclusao(
                "Excluir publicação?",
                "A publicação será removida do mural. Essa ação não pode ser desfeita.",
                "Excluir publicação"
            ))
        )
            return
        await excluirPublicacao(post.id)
        await loadPosts()
    })
}
function removeCampaign(campaign) {
    executar(async () => {
        if (
            !(await confirmarExclusao(
                "Excluir campanha?",
                "A campanha, seus participantes e mensagens serão removidos. Essa ação não pode ser desfeita.",
                "Excluir campanha"
            ))
        )
            return
        await excluirCampanha(campaign.id)
        await loadCampaigns()
        mensagem.value = "Campanha removida do perfil."
    })
}
watch(alteracaoSolicitacoes, () => executar(load))
watch(
    () => route.hash,
    hash => {
        if (hash === "#editar" && mine) executar(startEdit)
    }
)
onMounted(() =>
    executar(async () => {
        await load()
        if (mine && route.hash === "#editar") await startEdit()
    })
)
</script>
<template>
    <main class="pagina">
        <TituloPagina label="AVENTUREIRO" :title="mine ? 'Meu perfil' : 'Perfil'" />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="card">
            <div class="perfil-grande">
                <AvatarUsuario id="avatarPerfil" :user="user" alt="Avatar" />
                <div>
                    <h2 id="nomePerfil">{{ user ? nomeUsuario(user) : "Carregando..." }}</h2>
                    <p id="emailPerfil">{{ mine ? user?.email : "" }}</p>
                    <p id="bioPerfil">
                        {{ visible ? user?.biografia || "Sem biografia" : "Este perfil é privado." }}
                    </p>
                    <div id="tagsPerfil" class="tags" style="margin-top: 12px">
                        <span v-for="system in systems" :key="system.id" class="tag">{{ system.nome }}</span>
                    </div>
                </div>
            </div>
            <div v-if="!mine && user" id="acoesPerfil" style="margin-top: 20px">
                <button
                    class="botao"
                    :disabled="carregando || (!friendship && !following && follower?.status === 'pending')"
                    @click="toggleFriend"
                >
                    {{ friendLabel }}
                </button>
                <RouterLink
                    v-if="!privado(user) || friendship"
                    class="botao-secundario"
                    :to="{ path: '/mensagens', query: { contato: id } }"
                >
                    Enviar mensagem
                </RouterLink>
            </div>
            <button
                v-if="mine && !editing"
                id="abrirEdicao"
                class="botao"
                type="button"
                aria-controls="editarPerfil"
                :aria-expanded="editing"
                :disabled="carregando"
                @click="executar(startEdit)"
            >
                Editar perfil
            </button>
        </section>
        <FormularioPerfil
            v-if="editing"
            v-model="formulario"
            :avatars="avatars"
            :avatar-atual="user?.avatar"
            :carregando="carregando"
            @salvar="save"
            @cancelar="cancelEdit"
        />
        <SolicitacoesPerfil
            v-if="mine"
            :requests="requests"
            :people="people"
            :carregando="carregando"
            @responder="respond"
            @seguir="followBack"
        />
        <section v-if="!visible" id="perfilPrivadoAviso" class="card">
            <h2>Perfil privado</h2>
            <p>Envie uma solicitação para ver as publicações, os sistemas e as campanhas deste jogador.</p>
        </section>
        <section v-if="visible" id="sistemasCard" class="card">
            <h2>Sistemas de RPG</h2>
            <form v-if="editing" id="adicionarSistemaArea" class="comentar" @submit.prevent="addSystem">
                <input id="nomeSistema" v-model="systemName" placeholder="Ex: D&D 5e" />
                <button id="adicionarSistema" class="botao" :disabled="carregando">Adicionar</button>
            </form>
            <div id="sistemas" class="tags" style="margin-top: 15px">
                <span v-for="system in systems" :key="system.id" class="tag tag-removivel">
                    <span>{{ system.nome }}</span>
                    <button
                        v-if="mine"
                        type="button"
                        class="tag-remover"
                        title="Remover sistema"
                        :aria-label="'Remover sistema ' + system.nome"
                        :disabled="carregando"
                        @click="removeSystem(system)"
                    >
                        ×
                    </button>
                </span>
            </div>
        </section>
        <AtividadesPerfil
            :visible="visible"
            :mine="mine"
            :campaigns="campaigns"
            :posts="posts"
            :carregando="carregando"
            @excluir-campanha="removeCampaign"
            @excluir-publicacao="removePost"
        />
    </main>
</template>

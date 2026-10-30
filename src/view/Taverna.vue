<script setup>
import { ref, computed, onMounted, nextTick, watch } from "vue"
import { useRoute } from "vue-router"
import { links } from "../routes/menu.js"
import { serviceController as api, query, record } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
import {
    amigosDe,
    nomeUsuario,
    privado,
    mestreId,
    aberta,
    lerImagem
} from "../controller/comunidade.controller.js"
import { useAcao } from "../composables/useAcao.js"
import { abrirModal } from "../composables/useModal.js"
import Icone from "../components/Icone.vue"
import Avatar from "../components/Avatar.vue"
import Publicacao from "../components/Publicacao.vue"
import SinoNotificacoes from "../components/SinoNotificacoes.vue"
import ContadorMensagens from "../components/ContadorMensagens.vue"
const route = useRoute(),
    userId = sessao.userId
const user = ref(null),
    users = ref([]),
    posts = ref([]),
    campaigns = ref([]),
    participations = ref([]),
    systems = ref([]),
    friends = ref(new Set())
const search = ref(""),
    text = ref(""),
    image = ref(""),
    system = ref(""),
    loading = ref(false),
    imageLoading = ref(false)
const postInput = ref(null),
    imageInput = ref(null)
const { carregando, mensagem, executar } = useAcao()
const openCampaigns = computed(() => campaigns.value.filter(aberta).slice(0, 4))
const campaignCount = computed(
    () =>
        campaigns.value.filter(
            item =>
                String(mestreId(item)) === userId ||
                participations.value.some(member => String(member.campaignId) === String(item.id))
        ).length
)
const filteredPosts = computed(() =>
    posts.value.filter(post =>
        `${nomeUsuario(post.user)} ${post.conteudo || post.body || ""} ${post.sistema || ""}`
            .toLowerCase()
            .includes(search.value.trim().toLowerCase())
    )
)
async function focusHash() {
    await nextTick()
    if (route.hash.startsWith("#post-"))
        document.getElementById(decodeURIComponent(route.hash.slice(1)))?.scrollIntoView({ block: "center" })
}
watch(() => route.hash, focusHash)
async function loadPosts() {
    loading.value = true
    try {
        const [data, relations] = await Promise.all([api.get("/blog"), api.get("/friends")])
        if (!Array.isArray(data)) throw new Error("A rota do blog precisa retornar uma lista.")
        friends.value = amigosDe(relations, userId)
        const ids = [...new Set(data.map(post => post.userId ?? post.user?.id).filter(id => id != null))]
        const authors = new Map(
            await Promise.all(
                ids.map(async id => {
                    try {
                        return [String(id), await api.get(record("users", id))]
                    } catch {
                        return [String(id), null]
                    }
                })
            )
        )
        posts.value = data
            .map(post => ({
                ...post,
                user: authors.get(String(post.userId ?? post.user?.id)) || post.user
            }))
            .filter(
                post =>
                    String(post.userId ?? post.user?.id) === userId ||
                    !privado(post.user) ||
                    friends.value.has(String(post.userId ?? post.user?.id))
            )
            .reverse()
        await focusHash()
    } finally {
        loading.value = false
    }
}
async function carregar(estado, caminho) {
    estado.value = await api.get(caminho)
}
async function load() {
    const results = await Promise.allSettled([
        carregar(user, record("users", userId)),
        carregar(users, "/users"),
        (async () => {
            const [all, links] = await Promise.all([
                api.get("/systems"),
                api.get(query("userSystems", { userId }))
            ])
            systems.value = all.filter(item => links.some(link => String(link.systemId) === String(item.id)))
        })(),
        (async () => {
            const [all, links] = await Promise.all([
                api.get("/campaigns"),
                api.get(query("campaignMembers", { userId }))
            ])
            campaigns.value = all
            participations.value = links
        })(),
        loadPosts()
    ])
    const errors = results.filter(result => result.status === "rejected").map(result => result.reason.message)
    if (errors.length) mensagem.value = [...new Set(errors)].join(" ")
}
function focusPost() {
    postInput.value?.scrollIntoView({ behavior: "smooth", block: "center" })
    postInput.value?.focus({ preventScroll: true })
}
function toggleImage() {
    if (image.value) {
        image.value = ""
        imageInput.value.value = ""
    } else imageInput.value?.click()
}
async function chooseImage(file) {
    imageLoading.value = true
    try {
        image.value = await lerImagem(file)
    } catch (error) {
        mensagem.value = error.message
    } finally {
        imageLoading.value = false
    }
}
async function chooseSystem() {
    const name = await abrirModal({
        titulo: "Qual é o sistema da aventura?",
        mensagem: "Adicione um sistema à sua publicação. Deixe em branco para remover.",
        campo: true,
        valor: system.value,
        confirmar: "Adicionar sistema"
    })
    if (name !== null) system.value = name.trim()
}
function publish() {
    executar(async () => {
        const conteudo = text.value.trim()
        if (!conteudo) {
            focusPost()
            return
        }
        await api.post("/blog", {
            userId: user.value?.id ?? userId,
            imagem: image.value,
            sistema: system.value,
            user: { id: user.value?.id ?? userId },
            conteudo,
            created_at: new Date().toISOString()
        })
        text.value = image.value = system.value = ""
        if (imageInput.value) imageInput.value.value = ""
        await loadPosts()
    })
}
onMounted(() => executar(load))
</script>

<template>
    <nav class="guild-rail" aria-label="Atalhos">
        <RouterLink class="guild-home" to="/taverna" title="FrontD">
            <Icone name="dices" />
            <span class="sr-only">FrontD</span>
        </RouterLink>
        <span class="rail-divider"></span>
        <RouterLink
            v-for="[path, name, icon] in links.filter(item =>
                ['/taverna', '/campanhas', '/comunidades'].includes(item[0])
            )"
            :key="path"
            :to="path"
            :class="{ selected: path === '/taverna' }"
            :title="path === '/taverna' ? 'A taverna' : name"
        >
            <Icone :name="icon" />
            <span class="sr-only">{{ path === "/taverna" ? "A taverna" : name }}</span>
        </RouterLink>
        <RouterLink class="rail-add" to="/campanhas" title="Criar campanha">
            <Icone name="plus" />
            <span class="sr-only">Criar campanha</span>
        </RouterLink>
        <RouterLink class="rail-bottom" to="/configuracoes" title="Configurações">
            <Icone name="settings" />
            <span class="sr-only">Configurações</span>
        </RouterLink>
    </nav>

    <header class="topbar">
        <RouterLink to="/taverna" class="brand">
            <span class="brand-emblem"><Icone name="dices" /></span>
            <strong> Front<span>D</span> </strong>
            <span class="brand-caption">A sua próxima aventura</span>
        </RouterLink>
        <div class="channel-title">
            <Icone name="hash" />
            <strong>taverna-geral</strong>
            <span>O ponto de encontro dos aventureiros</span>
        </div>
        <div class="top-actions">
            <button
                id="atualizarFeed"
                :disabled="carregando"
                @click="executar(load)"
                type="button"
                title="Atualizar feed"
                aria-label="Atualizar feed"
            >
                <Icone name="refresh-cw" />
            </button>
            <button
                id="abrirMensagens"
                @click="$router.push('/mensagens')"
                type="button"
                title="Mensagens"
                aria-label="Mensagens"
            >
                <Icone name="message-circle" />
                <ContadorMensagens />
            </button>
            <SinoNotificacoes />
            <button
                class="user-button"
                @click="$router.push('/perfil')"
                title="Meu perfil"
                aria-label="Meu perfil"
            >
                <Avatar id="topAvatar" :user="user" style-name="adventurer" />
            </button>
        </div>
    </header>

    <main class="layout">
        <aside class="left-sidebar">
            <RouterLink class="sidebar-inbox" to="/mensagens">
                <Icone name="messages-square" />
                <span>
                    Suas conversas
                    <small>Mensagens diretas</small>
                </span>
                <Icone name="chevron-right" />
                <ContadorMensagens />
            </RouterLink>
            <div class="sidebar-heading">SEU PONTO DE ENCONTRO</div>
            <nav class="main-menu" aria-label="Navegação principal">
                <RouterLink
                    v-for="[path, name, icon] in links.slice(0, 5)"
                    :key="path"
                    :to="path"
                    :class="{ active: path === '/taverna' }"
                    :aria-current="path === '/taverna' ? 'page' : undefined"
                >
                    <Icone :name="icon" />
                    {{ path === "/taverna" ? "taverna-geral" : name }}
                    <ContadorMensagens v-if="path === '/mensagens'" />
                </RouterLink>
            </nav>
            <div class="sidebar-heading">A PRÓXIMA SESSÃO</div>
            <button id="createCampaignButton" @click="$router.push('/campanhas')" class="create-campaign">
                <Icone name="plus" />
                Criar campanha
            </button>
            <section class="profile-card">
                <div class="profile-summary">
                    <Avatar
                        id="profileAvatar"
                        :user="user"
                        style-name="adventurer"
                        class="profile-avatar"
                        alt="Seu avatar"
                    />
                    <div class="profile-info">
                        <h2 id="profileName">{{ user ? nomeUsuario(user) : "Carregando..." }}</h2>
                        <p id="profileDescription">{{ user?.biografia || "" }}</p>
                    </div>
                    <RouterLink to="/perfil" title="Editar perfil"><Icone name="settings" /></RouterLink>
                </div>
                <div id="profileSystems" class="profile-systems">
                    <span v-for="system in systems" :key="system.id">{{ system.nome }}</span>
                </div>
                <div class="profile-stats">
                    <div>
                        <strong id="campaignCount">{{ campaignCount }}</strong>
                        <span>Campanhas</span>
                    </div>
                    <div>
                        <strong id="friendCount">{{ friends.size }}</strong>
                        <span>Amigos</span>
                    </div>
                </div>
            </section>
        </aside>

        <section class="feed-column">
            <header class="feed-header">
                <div>
                    <span class="section-label">SEU PONTO DE ENCONTRO</span>
                    <h1>A taverna</h1>
                    <p>Boas histórias. Novas companhias. A próxima sessão.</p>
                </div>
                <RouterLink class="header-discover" to="/descobrir">
                    <Icone name="user-plus" />
                    <span>Encontrar jogadores</span>
                </RouterLink>
            </header>
            <div class="feed-toolbar">
                <label class="search-box">
                    <Icone name="search" />
                    <input
                        type="search"
                        id="searchInput"
                        v-model="search"
                        placeholder="Buscar no mural"
                        aria-label="Buscar publicações"
                    />
                </label>
            </div>
            <section class="create-post" aria-label="Nova publicação">
                <Avatar
                    id="createPostAvatar"
                    :user="user"
                    style-name="adventurer"
                    class="create-avatar"
                    alt="Seu avatar"
                />
                <div class="create-content">
                    <textarea
                        id="postContent"
                        ref="postInput"
                        v-model="text"
                        placeholder="Que história você traz para a taverna?"
                        aria-label="Texto da publicação"
                        maxlength="5000"
                    ></textarea>
                    <img
                        v-if="image"
                        :src="image"
                        class="previa-publicacao"
                        alt="Imagem selecionada para publicar"
                    />
                    <input
                        ref="imageInput"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        hidden
                        @change="chooseImage($event.target.files[0])"
                    />
                    <div class="create-footer">
                        <div class="create-tools">
                            <button
                                type="button"
                                :title="image ? 'Remover imagem' : 'Adicionar imagem'"
                                @click="toggleImage"
                            >
                                <Icone name="image" />
                                <span>{{ image ? "Remover imagem" : "Imagem" }}</span>
                            </button>
                            <button type="button" title="Escolher sistema" @click="chooseSystem">
                                <Icone name="dices" />
                                <span>{{ system || "Sistema" }}</span>
                            </button>
                        </div>
                        <button
                            id="publishButton"
                            :disabled="carregando || imageLoading"
                            @click="publish"
                            class="publish-button"
                            type="button"
                        >
                            Publicar
                        </button>
                    </div>
                </div>
            </section>
            <div class="mural-label">
                <span>AO REDOR DA FOGUEIRA</span>
                <span>Publicações recentes</span>
            </div>
            <p class="feed-message" role="status">{{ mensagem }}</p>
            <div id="feed">
                <div v-if="loading" class="loading">Carregando publicações...</div>
                <template v-else>
                    <Publicacao
                        v-for="post in filteredPosts"
                        :key="post.id"
                        :post="post"
                        :current-user="user"
                        @changed="executar(loadPosts)"
                    />
                    <div v-if="!filteredPosts.length" class="empty-feed">
                        <h3>
                            {{
                                posts.length
                                    ? "Nenhuma publicação encontrada."
                                    : "Nenhuma publicação disponível"
                            }}
                        </h3>
                        <p v-if="!posts.length">
                            Publicações de perfis privados aparecem apenas para amigos.
                        </p>
                    </div>
                </template>
            </div>
        </section>

        <aside class="right-sidebar">
            <div class="right-heading">
                <span>EXPLORAR</span>
                <h2>Além da taverna</h2>
            </div>
            <section class="side-card">
                <div class="side-title">
                    <h3>
                        <Icone name="swords" />
                        Campanhas abertas
                    </h3>
                    <RouterLink to="/campanhas" title="Ver todas as campanhas">
                        <Icone name="arrow-right" />
                    </RouterLink>
                </div>
                <div id="openCampaigns">
                    <RouterLink
                        v-for="campaign in openCampaigns"
                        :key="campaign.id"
                        class="campaign-item"
                        :class="{ 'sem-capa': !campaign.capa }"
                        :to="{ path: '/campanha', query: { id: campaign.id } }"
                    >
                        <img v-if="campaign.capa" :src="campaign.capa" class="campaign-cover" alt="" />
                        <strong>{{ campaign.nome }}</strong>
                        <span>{{ campaign.sistema || campaign.sistemaNome }}</span>
                        <small>
                            {{ campaign.vagas != null ? campaign.vagas + " vaga(s)" : "Inscrições abertas" }}
                        </small>
                    </RouterLink>
                    <div v-if="!openCampaigns.length" class="empty-small">Nenhuma campanha disponível.</div>
                </div>
            </section>
            <section class="community-panel">
                <div class="community-total">
                    <Icone name="users" />
                    <div>
                        <strong id="onlineCount">{{ users.length }}</strong>
                        <small>aventureiros na comunidade</small>
                    </div>
                    <RouterLink to="/descobrir" title="Ver jogadores">
                        <Icone name="arrow-up-right" />
                    </RouterLink>
                </div>
                <div id="communityPlayers" class="community-players">
                    <RouterLink
                        v-for="person in users.slice(0, 5)"
                        :key="person.id"
                        class="community-player"
                        :to="{ path: '/perfil', query: { id: person.id } }"
                    >
                        <Avatar :user="person" />
                        <span>{{ nomeUsuario(person) }}</span>
                    </RouterLink>
                </div>
            </section>
            <RouterLink class="explore-community" to="/comunidades">
                <Icone name="users-round" />
                <span>
                    Encontre seu grupo
                    <small>Explorar comunidades</small>
                </span>
                <Icone name="arrow-up-right" />
            </RouterLink>
            <p class="sidebar-credit">FrontD · Comunidade RPG</p>
        </aside>
    </main>

    <nav class="mobile-nav" aria-label="Navegação móvel">
        <RouterLink to="/taverna" aria-current="page">
            <Icone name="hash" />
            <small>Taverna</small>
        </RouterLink>
        <RouterLink to="/descobrir">
            <Icone name="compass" />
            <small>Explorar</small>
        </RouterLink>
        <button @click="focusPost" title="Nova publicação" aria-label="Nova publicação">
            <Icone name="plus" />
        </button>
        <RouterLink to="/campanhas">
            <Icone name="swords" />
            <small>Mesas</small>
        </RouterLink>
        <RouterLink to="/perfil">
            <Icone name="user-round" />
            <small>Perfil</small>
        </RouterLink>
    </nav>
</template>

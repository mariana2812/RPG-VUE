<script setup lang="ts">
// Aqui eu organizo o mural e passo os dados para os componentes da Taverna.
import { ref, computed, onMounted, nextTick, watch } from "vue"
import { useRoute } from "vue-router"
import { apiController as api, query, record } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { nomeUsuario } from "../controller/comunidade.controller.ts"
import { carregarMural } from "../controller/mural.controller.ts"
import { mestreId, aberta } from "../controller/campanha.controller.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import Icone from "../components/Icone.vue"
import CardPublicacao from "../components/CardPublicacao.vue"
import CabecalhoTaverna from "../components/taverna/CabecalhoTaverna.vue"
import ResumoPerfilTaverna from "../components/taverna/ResumoPerfilTaverna.vue"
import PainelExploracao from "../components/taverna/PainelExploracao.vue"
import MenuMovelTaverna from "../components/taverna/MenuMovelTaverna.vue"
import FormularioPublicacao from "../components/taverna/FormularioPublicacao.vue"
const novaPublicacao = ref<InstanceType<typeof FormularioPublicacao> | null>(null)
const route = useRoute()
const userId = sessao.userId
const user = ref(null)
const users = ref([])
const posts = ref([])
const campaigns = ref([])
const participations = ref([])
const systems = ref([])
const friends = ref(new Set())
const search = ref("")
const loading = ref(false)
const { carregando, mensagem, executar } = useOperacaoAssincrona()
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
// Busco os autores e filtro as publicações privadas conforme as amizades.
async function loadPosts() {
    loading.value = true
    try {
        const mural = await carregarMural(userId)
        posts.value = mural.posts
        friends.value = mural.friends
        await focusHash()
    } finally {
        loading.value = false
    }
}
async function carregar(estado, caminho) {
    estado.value = await api.get(caminho)
}
async function carregarSistemas() {
    const [sistemas, vinculos] = await Promise.all([
        api.get("/systems"), api.get(query("userSystems", { userId }))
    ])
    systems.value = sistemas.filter(sistema =>
        vinculos.some(vinculo => String(vinculo.systemId) === String(sistema.id))
    )
}
async function carregarCampanhas() {
    const [campanhas, membros] = await Promise.all([
        api.get("/campaigns"), api.get(query("campaignMembers", { userId }))
    ])
    campaigns.value = campanhas
    participations.value = membros
}
async function load() {
    // Se uma consulta falhar, as outras partes da página ainda podem carregar.
    const resultados = await Promise.allSettled([
        carregar(user, record("users", userId)),
        carregar(users, "/users"),
        carregarSistemas(),
        carregarCampanhas(),
        loadPosts()
    ])
    const erros = []
    for (const resultado of resultados) {
        if (resultado.status === "rejected") erros.push(resultado.reason.message)
    }
    if (erros.length) mensagem.value = [...new Set(erros)].join(" ")
}
function focusPost() {
    novaPublicacao.value?.focar()
}
onMounted(() => executar(load))
</script>

<template>
    <CabecalhoTaverna :user="user" :carregando="carregando" @atualizar="executar(load)" />

    <main class="layout">
        <ResumoPerfilTaverna
            :user="user"
            :systems="systems"
            :campaign-count="campaignCount"
            :friend-count="friends.size"
        />

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
            <FormularioPublicacao
                ref="novaPublicacao"
                :user="user"
                :bloqueado="carregando"
                @publicada="executar(loadPosts)"
            />
            <div class="mural-label">
                <span>AO REDOR DA FOGUEIRA</span>
                <span>Publicações recentes</span>
            </div>
            <p class="feed-message" role="status">{{ mensagem }}</p>
            <div id="feed">
                <div v-if="loading" class="loading">Carregando publicações...</div>
                <template v-else>
                    <CardPublicacao
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

        <PainelExploracao :users="users" :open-campaigns="openCampaigns" />
    </main>

    <MenuMovelTaverna @nova-publicacao="focusPost" />
</template>

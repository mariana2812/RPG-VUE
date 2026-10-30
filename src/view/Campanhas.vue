<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { serviceController as api } from "../controller/service.controller.js"
import { sessao } from "../controller/user.controller.js"
import { useImagem } from "../composables/useImagem.js"
import { useAcao } from "../composables/useAcao.js"
import TituloPagina from "../components/TituloPagina.vue"
import CamposCampanha from "../components/CamposCampanha.vue"
const router = useRouter()
const campaigns = ref([])
const form = ref({ nome: "", sistema: "", descricao: "", maxJogadores: 5 })
const { carregando, mensagem, executar } = useAcao()
const { imagem: preview, lendo: imageLoading, selecionar: image } = useImagem(mensagem, true)
function create() {
    executar(async () => {
        const { maxJogadores } = form.value
        const nome = form.value.nome.trim(),
            sistema = form.value.sistema.trim(),
            descricao = form.value.descricao.trim()
        if (!nome || !sistema || !descricao) throw new Error("Preencha todos os campos.")
        if (!Number.isInteger(maxJogadores) || maxJogadores < 2 || maxJogadores > 20)
            throw new Error("Escolha entre 2 e 20 jogadores.")
        const campaign = await api.post("/campaigns", {
            nome,
            sistema,
            descricao,
            maxJogadores,
            capa: preview.value,
            masterId: sessao.userId,
            status: "aberta",
            created_at: new Date().toISOString()
        })
        await router.push({ path: "/campanha", query: { id: campaign.id } })
    })
}
onMounted(() =>
    executar(async () => {
        campaigns.value = (await api.get("/campaigns")).reverse()
    })
)
</script>
<template>
    <main class="pagina">
        <TituloPagina
            label="AVENTURAS"
            title="Campanhas"
            description="Crie uma campanha ou encontre uma mesa."
        />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="card">
            <h2>Criar campanha</h2>
            <form id="formCampanha" class="formulario" @submit.prevent="create">
                <CamposCampanha v-model="form" :preview="preview" @image="image" />
                <button class="botao" type="submit" :disabled="carregando || imageLoading">
                    Criar campanha
                </button>
            </form>
        </section>
        <section class="card">
            <h2>Campanhas disponíveis</h2>
            <div id="campanhas" class="grid">
                <p v-if="!campaigns.length && !carregando">Nenhuma campanha criada.</p>
                <article v-for="campaign in campaigns" :key="campaign.id" class="card">
                    <img
                        v-if="campaign.capa"
                        :src="campaign.capa"
                        class="capa-lista"
                        :alt="'Capa de ' + campaign.nome"
                    />
                    <h3>{{ campaign.nome }}</h3>
                    <span class="tag">{{ campaign.sistema || campaign.sistemaNome }}</span>
                    <p>{{ campaign.descricao }}</p>
                    <RouterLink class="botao" :to="{ path: '/campanha', query: { id: campaign.id } }">
                        Ver campanha
                    </RouterLink>
                </article>
            </div>
        </section>
    </main>
</template>

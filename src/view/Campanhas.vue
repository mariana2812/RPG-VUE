<script setup lang="ts">
// Esta página lista as campanhas e permite criar uma nova mesa.
import type { FormularioCampanha } from "../interfaces/campanha.interface.ts"
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { apiController as api } from "../controller/api.controller.ts"
import { validarCampanha } from "../controller/campanha.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { useImagem } from "../composables/useImagem.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import TituloPagina from "../components/TituloPagina.vue"
import CamposCampanha from "../components/CamposCampanha.vue"
const roteador = useRouter()
const campanhas = ref([])
const formulario = ref<FormularioCampanha>({ nome: "", sistema: "", descricao: "", maxJogadores: 5 })
const { carregando, mensagem, executar } = useOperacaoAssincrona()
const { imagem: previa, lendo: lendoImagem, selecionar: selecionarCapa } = useImagem(mensagem, true)
function criarCampanha() {
    executar(async () => {
        const dados = validarCampanha(formulario.value)
        const campanha = await api.post("/campaigns", {
            ...dados,
            capa: previa.value,
            masterId: sessao.userId,
            status: "aberta",
            created_at: new Date().toISOString()
        })
        await roteador.push({ path: "/campanha", query: { id: campanha.id } })
    })
}
async function carregarCampanhas() {
    campanhas.value = (await api.get("/campaigns")).reverse()
}
onMounted(() => executar(carregarCampanhas))
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
            <form id="formCampanha" class="formulario" @submit.prevent="criarCampanha">
                <CamposCampanha v-model="formulario" :preview="previa" @image="selecionarCapa" />
                <button class="botao" type="submit" :disabled="carregando || lendoImagem">
                    Criar campanha
                </button>
            </form>
        </section>
        <section class="card">
            <h2>Campanhas disponíveis</h2>
            <div id="campanhas" class="grid">
                <p v-if="!campanhas.length && !carregando">Nenhuma campanha criada.</p>
                <article v-for="campanha in campanhas" :key="campanha.id" class="card">
                    <img
                        v-if="campanha.capa"
                        :src="campanha.capa"
                        class="capa-lista"
                        :alt="'Capa de ' + campanha.nome"
                    />
                    <h3>{{ campanha.nome }}</h3>
                    <span class="tag">{{ campanha.sistema || campanha.sistemaNome }}</span>
                    <p>{{ campanha.descricao }}</p>
                    <RouterLink class="botao" :to="{ path: '/campanha', query: { id: campanha.id } }">
                        Ver campanha
                    </RouterLink>
                </article>
            </div>
        </section>
    </main>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { serviceController as api } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
import { lerImagem } from '../controller/community.controller.js'
import { useAction } from '../composables/useAction.js'
import PageTitle from '../components/PageTitle.vue'
import CampaignFields from '../components/CampaignFields.vue'
const router = useRouter()
const campaigns = ref([]),
  preview = ref('')
const form = ref({ nome: '', sistema: '', descricao: '', maxJogadores: 5 })
const { busy, message, run } = useAction()
let imageVersion = 0
const imageLoading = ref(false)
async function image(file) {
  const version = ++imageVersion
  imageLoading.value = true
  try {
    const value = await lerImagem(file)
    if (version === imageVersion) preview.value = value
  } catch (error) {
    message.value = error.message
    preview.value = ''
  } finally {
    if (version === imageVersion) imageLoading.value = false
  }
}
function create() {
  run(async () => {
    const { maxJogadores } = form.value
    const nome = form.value.nome.trim(),
      sistema = form.value.sistema.trim(),
      descricao = form.value.descricao.trim()
    if (!nome || !sistema || !descricao) throw new Error('Preencha todos os campos.')
    if (!Number.isInteger(maxJogadores) || maxJogadores < 2 || maxJogadores > 20)
      throw new Error('Escolha entre 2 e 20 jogadores.')
    const campaign = await api.post('/campaigns', {
      nome,
      sistema,
      descricao,
      maxJogadores,
      capa: preview.value,
      masterId: session.userId,
      status: 'aberta',
      created_at: new Date().toISOString(),
    })
    await router.push({ path: '/campanha', query: { id: campaign.id } })
  })
}
onMounted(() =>
  run(async () => {
    campaigns.value = (await api.get('/campaigns')).reverse()
  }),
)
</script>
<template>
  <main class="pagina">
    <PageTitle
      label="AVENTURAS"
      title="Campanhas"
      description="Crie uma campanha ou encontre uma mesa."
    />
    <p class="mensagem" role="status">{{ message }}</p>
    <section class="card">
      <h2>Criar campanha</h2>
      <form id="formCampanha" class="formulario" @submit.prevent="create">
        <CampaignFields v-model="form" :preview="preview" @image="image" /><button
          class="botao"
          type="submit"
          :disabled="busy || imageLoading"
        >
          Criar campanha
        </button>
      </form>
    </section>
    <section class="card">
      <h2>Campanhas disponíveis</h2>
      <div id="campanhas" class="grid">
        <p v-if="!campaigns.length && !busy">Nenhuma campanha criada.</p>
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
          <RouterLink class="botao" :to="{ path: '/campanha', query: { id: campaign.id } }"
            >Ver campanha</RouterLink
          >
        </article>
      </div>
    </section>
  </main>
</template>

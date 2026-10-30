<script setup lang="ts">
// Aqui eu carrego as comunidades e trato as ações enviadas pelos cards.
import { ref, computed, onMounted, nextTick } from "vue"
import { apiController as api, query, record } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import TituloPagina from "../components/TituloPagina.vue"
import CampoFormulario from "../components/CampoFormulario.vue"
import CardComunidade from "../components/comunidades/CardComunidade.vue"
const userId = sessao.userId
const communities = ref([])
const members = ref([])
const users = ref([])
const expanded = ref(new Set())
const name = ref("")
const description = ref("")
const editing = ref(null)
const { carregando, mensagem, executar } = useOperacaoAssincrona()
const title = computed(() => (editing.value != null ? "Editar comunidade" : "Criar comunidade"))
const owner = community => String(community.ownerId) === userId
const membership = community =>
    members.value.find(
        item => String(item.communityId) === String(community.id) && String(item.userId) === userId
    )
async function load() {
    const [data, relations] = await Promise.all([api.get("/communities"), api.get("/communityMembers")])
    communities.value = data
    members.value = relations
}
function reset() {
    editing.value = null
    name.value = description.value = ""
}
async function edit(community) {
    editing.value = community.id
    name.value = community.nome
    description.value = community.descricao
    await nextTick()
    document.getElementById("nome")?.focus()
}
function save() {
    executar(async () => {
        const nome = name.value.trim()
        const descricao = description.value.trim()
        if (!nome || !descricao) throw new Error("Preencha o nome e a descrição.")
        if (editing.value != null) {
            const current = await api.get(record("communities", editing.value))
            if (!owner(current)) throw new Error("Somente o criador pode editar a comunidade.")
            await api.patch(record("communities", editing.value), { nome, descricao })
        } else await api.post("/communities", { nome, descricao, ownerId: userId })
        reset()
        await load()
    })
}
function join(community) {
    executar(async () => {
        const relations = await api.get(query("communityMembers", { communityId: community.id, userId }))
        if (membership(community)) {
            for (const item of relations) await api.remove(record("communityMembers", item.id))
        } else if (!relations.length)
            await api.post("/communityMembers", { communityId: community.id, userId })
        await load()
    })
}
function showParticipants(community) {
    executar(async () => {
        if (expanded.value.has(community.id)) expanded.value.delete(community.id)
        else {
            users.value = await api.get("/users")
            expanded.value.add(community.id)
        }
    })
}
onMounted(() => executar(load))
</script>
<template>
    <main class="pagina">
        <TituloPagina
            label="GRUPOS"
            title="Comunidades"
            description="Crie espaços para conversar sobre seus sistemas favoritos."
        />
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <section class="card">
            <h2>{{ title }}</h2>
            <form id="formComunidade" class="formulario" @submit.prevent="save">
                <CampoFormulario id="nome" v-model="name" label="Nome" required />
                <CampoFormulario id="descricao" v-model="description" label="Descrição" multiline required />
                <button class="botao" :disabled="carregando">
                    {{ editing != null ? "Salvar alterações" : "Criar comunidade" }}
                </button>
                <button v-if="editing != null" type="button" class="botao-secundario" @click="reset">
                    Cancelar
                </button>
            </form>
        </section>
        <section class="card">
            <h2>Comunidades</h2>
            <div id="comunidades" class="grid">
                <p v-if="!communities.length && !carregando">Nenhuma comunidade criada.</p>
                <CardComunidade
                    v-for="community in communities"
                    :key="community.id"
                    :community="community"
                    :members="members"
                    :users="users"
                    :expanded="expanded.has(community.id)"
                    :carregando="carregando"
                    @participar="join(community)"
                    @editar="edit(community)"
                    @participantes="showParticipants(community)"
                />
            </div>
        </section>
    </main>
</template>

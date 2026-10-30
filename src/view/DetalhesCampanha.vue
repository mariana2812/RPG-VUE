<script setup lang="ts">
// Aqui eu coordeno as ações da campanha; o resumo e o mural ficam em componentes separados.
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { apiController as api, query, record } from "../controller/api.controller.ts"
import { sessao } from "../controller/usuario.controller.ts"
import { nomeUsuario } from "../controller/comunidade.controller.ts"
import { mestreId, aberta, excluirCampanha } from "../controller/campanha.controller.ts"
import { confirmarExclusao } from "../composables/useModal.ts"
import { useOperacaoAssincrona } from "../composables/useOperacaoAssincrona.ts"
import ResumoCampanha from "../components/campanha/ResumoCampanha.vue"
import MuralCampanha from "../components/campanha/MuralCampanha.vue"
import AvatarUsuario from "../components/AvatarUsuario.vue"
import FormularioEdicaoCampanha from "../components/campanha/FormularioEdicaoCampanha.vue"
const edicaoCampanha = ref<InstanceType<typeof FormularioEdicaoCampanha> | null>(null)
const rota = useRoute()
const roteador = useRouter()
const id = String(rota.query.id ?? "")
const userId = sessao.userId
const campanha = ref(null)
const usuarios = ref([])
const inscricoes = ref([])
const publicacoes = ref([])
const texto = ref("")
const { carregando, mensagem, executar } = useOperacaoAssincrona()
const ehMestre = computed(() => String(mestreId(campanha.value)) === userId)
const inscricao = computed(() => inscricoes.value.find(item => String(item.userId) === userId))
const participa = computed(() => ehMestre.value || !!inscricao.value)
const jogadores = computed(
    () =>
        new Set(
            inscricoes.value
                .filter(item => String(item.userId) !== String(mestreId(campanha.value)))
                .map(item => String(item.userId))
        )
)
const participantes = computed(() =>
    usuarios.value.filter(
        user => String(user.id) === String(mestreId(campanha.value)) || jogadores.value.has(String(user.id))
    )
)
const lotada = computed(() => jogadores.value.size >= campanha.value?.maxJogadores)
const buscarUsuario = id => usuarios.value.find(person => String(person.id) === String(id))
async function carregarCampanha() {
    const [data, people, relations, wall] = await Promise.all([
        api.get(record("campaigns", id)),
        api.get("/users"),
        api.get(query("campaignMembers", { campaignId: id })),
        api.get(query("campaignPosts", { campaignId: id }))
    ])
    campanha.value = data
    usuarios.value = people
    inscricoes.value = relations
    publicacoes.value = wall
}
async function verificarMestre() {
    const data = await api.get(record("campaigns", id))
    if (String(mestreId(data)) !== userId) throw new Error("Somente o mestre pode editar esta campanha.")
    return data
}
function alterarStatus() {
    executar(async () => {
        const data = await verificarMestre()
        await api.patch(record("campaigns", id), { status: aberta(data) ? "fechada" : "aberta" })
        await carregarCampanha()
    })
}
function excluir() {
    executar(async () => {
        if (
            !(await confirmarExclusao(
                "Excluir campanha?",
                "A campanha, seus participantes e mensagens do mural serão removidos. Essa ação não pode ser desfeita.",
                "Excluir campanha"
            ))
        )
            return
        await excluirCampanha(id)
        await roteador.replace("/campanhas")
    })
}
function entrarOuSair() {
    executar(async () => {
        const [current, data] = await Promise.all([
            api.get(query("campaignMembers", { campaignId: id })),
            api.get(record("campaigns", id))
        ])
        const member = current.find(item => String(item.userId) === userId)
        if (inscricao.value) {
            if (member) await api.remove(record("campaignMembers", member.id))
        } else if (!member) {
            if (!aberta(data)) throw new Error("A campanha está fechada.")
            const jogadores = new Set(
                current
                    .filter(item => String(item.userId) !== String(mestreId(data)))
                    .map(item => String(item.userId))
            )
            if (jogadores.size >= data.maxJogadores) throw new Error("A campanha está cheia.")
            await api.post("/campaignMembers", { campaignId: data.id, userId })
        }
        await carregarCampanha()
    })
}
function editarCampanha() {
    edicaoCampanha.value?.abrir()
}
function campanhaSalva() {
    executar(async () => {
        await carregarCampanha()
        mensagem.value = "Campanha atualizada."
    })
}
function enviarMensagem() {
    executar(async () => {
        const conteudo = texto.value.trim()
        if (!conteudo) return
        const relations = await api.get(query("campaignMembers", { campaignId: id }))
        if (!ehMestre.value && !relations.some(item => String(item.userId) === userId))
            throw new Error("Entre na campanha para publicar no mural.")
        await api.post("/campaignPosts", {
            campaignId: campanha.value.id,
            userId,
            conteudo,
            created_at: new Date().toISOString()
        })
        texto.value = ""
        publicacoes.value = await api.get(query("campaignPosts", { campaignId: id }))
    })
}
function excluirMensagem(post) {
    executar(async () => {
        if (!(await confirmarExclusao("Excluir mensagem?", "Esta mensagem será removida do mural."))) return
        await api.remove(record("campaignPosts", post.id))
        publicacoes.value = await api.get(query("campaignPosts", { campaignId: id }))
    })
}
onMounted(() => {
    if (id) executar(carregarCampanha)
    else roteador.replace("/campanhas")
})
</script>
<template>
    <main class="pagina">
        <p class="mensagem" role="status">{{ mensagem }}</p>
        <ResumoCampanha
            :campanha="campanha"
            :mestre="nomeUsuario(buscarUsuario(mestreId(campanha)))"
            :eh-mestre="ehMestre"
            :inscrito="!!inscricao"
            :lotada="lotada"
            :carregando="carregando"
            @alterar-status="alterarStatus"
            @editar="editarCampanha"
            @excluir="excluir"
            @entrar-ou-sair="entrarOuSair"
        />
        <FormularioEdicaoCampanha ref="edicaoCampanha" :campanha="campanha" :bloqueado="carregando" @salva="campanhaSalva" />
        <section class="card">
            <h2>Participantes</h2>
            <div id="participantes" class="lista">
                <div v-for="person in participantes" :key="person.id" class="item-lista">
                    <AvatarUsuario :user="person" class="avatar" />
                    <RouterLink :to="{ path: '/perfil', query: { id: person.id } }">
                        {{ nomeUsuario(person) }}
                    </RouterLink>
                </div>
            </div>
        </section>
        <MuralCampanha
            v-model="texto"
            :publicacoes="publicacoes"
            :usuarios="usuarios"
            :participa="participa"
            :eh-mestre="ehMestre"
            :carregando="carregando"
            @enviar="enviarMensagem"
            @excluir="excluirMensagem"
        />
    </main>
</template>

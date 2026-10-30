<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { serviceController as api, query, record } from '../controller/service.controller.js'
import { session } from '../controller/user.controller.js'
import { nomeUsuario, mestreId, aberta, excluirCampanha, lerImagem } from '../controller/community.controller.js'
import { abrirModal } from '../composables/useDialog.js'
import { useAction } from '../composables/useAction.js'
import Avatar from '../components/Avatar.vue'
import CampaignFields from '../components/CampaignFields.vue'
const route = useRoute(), router = useRouter(), id = route.query.id, userId = session.userId
const campaign = ref(null), users = ref([]), members = ref([]), posts = ref([]), text = ref('')
const editing = ref(false), form = ref({}), preview = ref(''), imageLoading = ref(false)
const { busy, message, run } = useAction()
const master = computed(() => String(mestreId(campaign.value)) === userId)
const membership = computed(() => members.value.find(item => String(item.userId) === userId))
const participant = computed(() => master.value || !!membership.value)
const players = computed(() => new Set(members.value.filter(item => String(item.userId) !== String(mestreId(campaign.value))).map(item => String(item.userId))))
const participants = computed(() => users.value.filter(user => String(user.id) === String(mestreId(campaign.value)) || players.value.has(String(user.id))))
const full = computed(() => players.value.size >= campaign.value?.maxJogadores)
const user = id => users.value.find(person => String(person.id) === String(id))
async function load() {
    const [data, people, relations, wall] = await Promise.all([api.get(record('campaigns', id)), api.get('/users'), api.get(query('campaignMembers', { campaignId: id })), api.get(query('campaignPosts', { campaignId: id }))])
    campaign.value = data; users.value = people; members.value = relations; posts.value = wall
}
async function requireMaster() {
    const data = await api.get(record('campaigns', id))
    if (String(mestreId(data)) !== userId) throw new Error('Somente o mestre pode editar esta campanha.')
    return data
}
function toggleStatus() { run(async () => { const data = await requireMaster(); await api.patch(record('campaigns', id), { status: aberta(data) ? 'fechada' : 'aberta' }); await load() }) }
function remove() { run(async () => {
    if (!await abrirModal({ titulo: 'Excluir campanha?', mensagem: 'A campanha, seus participantes e mensagens do mural serão removidos. Essa ação não pode ser desfeita.', confirmar: 'Excluir campanha', perigo: true })) return
    await excluirCampanha(id); await router.replace('/campanhas')
}) }
function join() { run(async () => {
    const [current, data] = await Promise.all([api.get(query('campaignMembers', { campaignId: id })), api.get(record('campaigns', id))])
    const member = current.find(item => String(item.userId) === userId)
    if (membership.value) {
        if (member) await api.remove(record('campaignMembers', member.id))
    } else if (!member) {
        if (!aberta(data)) throw new Error('A campanha está fechada.')
        const players = new Set(current.filter(item => String(item.userId) !== String(mestreId(data))).map(item => String(item.userId)))
        if (players.size >= data.maxJogadores) throw new Error('A campanha está cheia.')
        await api.post('/campaignMembers', { campaignId: data.id, userId })
    }
    await load()
}) }
async function edit() {
    form.value = { nome: campaign.value.nome || '', sistema: campaign.value.sistema || campaign.value.sistemaNome || '', descricao: campaign.value.descricao || '', maxJogadores: campaign.value.maxJogadores || 5, removerCapa: false }
    preview.value = campaign.value.capa || ''; editing.value = true
    await nextTick(); document.getElementById('editarNome')?.focus()
}
let imageVersion = 0
async function image(file) {
    const version = ++imageVersion; imageLoading.value = true
    try { const value = await lerImagem(file); if (version === imageVersion) { preview.value = value; form.value.removerCapa = false } }
    catch (error) { message.value = error.message }
    finally { if (version === imageVersion) imageLoading.value = false }
}
function removeImage() { if (form.value.removerCapa) { imageVersion++; preview.value = ''; imageLoading.value = false } }
function save() { run(async () => {
    await requireMaster()
    const { maxJogadores } = form.value
    const nome = form.value.nome.trim(), sistema = form.value.sistema.trim(), descricao = form.value.descricao.trim()
    if (!nome || !sistema || !descricao) throw new Error('Preencha todos os campos.')
    const relations = await api.get(query('campaignMembers', { campaignId: id }))
    const count = new Set(relations.filter(item => String(item.userId) !== userId).map(item => String(item.userId))).size
    if (!Number.isInteger(maxJogadores) || maxJogadores < Math.max(2, count) || maxJogadores > 20) throw new Error('O limite deve comportar os participantes atuais e ficar entre 2 e 20.')
    await api.patch(record('campaigns', id), { nome, sistema, descricao, maxJogadores, capa: form.value.removerCapa ? '' : preview.value })
    editing.value = false; await load(); message.value = 'Campanha atualizada.'
}) }
function send() { run(async () => {
    const conteudo = text.value.trim(); if (!conteudo) return
    const relations = await api.get(query('campaignMembers', { campaignId: id }))
    if (!master.value && !relations.some(item => String(item.userId) === userId)) throw new Error('Entre na campanha para publicar no mural.')
    await api.post('/campaignPosts', { campaignId: campaign.value.id, userId, conteudo, created_at: new Date().toISOString() })
    text.value = ''; posts.value = await api.get(query('campaignPosts', { campaignId: id }))
}) }
function removePost(post) { run(async () => {
    if (!await abrirModal({ titulo: 'Excluir mensagem?', mensagem: 'Esta mensagem será removida do mural.', confirmar: 'Excluir', perigo: true })) return
    await api.remove(record('campaignPosts', post.id)); posts.value = await api.get(query('campaignPosts', { campaignId: id }))
}) }
onMounted(() => { if (id) run(load); else router.replace('/campanhas') })
</script>
<template>
    <main class="pagina"><p class="mensagem" role="status">{{ message }}</p>
        <section class="card"><img v-if="campaign?.capa" id="capaCampanha" :src="campaign.capa" class="capa-campanha" alt="Capa da campanha"><small id="sistema" style="color:var(--dourado)">{{ campaign?.sistema || campaign?.sistemaNome }}</small><h1 id="nome" style="margin:8px 0">{{ campaign?.nome || 'Carregando...' }}</h1><p id="descricao" style="color:#aaa;line-height:1.6">{{ campaign?.descricao }}</p><p id="mestre" style="margin-top:15px">Mestre: {{ nomeUsuario(user(mestreId(campaign))) }}</p>
            <div v-if="campaign" id="acao" style="margin-top:20px"><template v-if="master">Você é o mestre <button class="botao-secundario" :disabled="busy" @click="toggleStatus">{{ aberta(campaign) ? 'Fechar inscrições' : 'Reabrir inscrições' }}</button><button class="botao" @click="edit">Editar campanha</button><button class="botao-perigo" :disabled="busy" @click="remove">Excluir campanha</button></template><button v-else class="botao" :disabled="busy || (!membership && (!aberta(campaign) || full))" @click="join">{{ membership ? 'Sair da campanha' : !aberta(campaign) ? 'Inscrições fechadas' : full ? 'Campanha cheia' : 'Entrar na campanha' }}</button></div>
        </section>
        <section v-if="editing" id="editarCampanha" class="card"><h2>Editar campanha</h2><form id="formEditarCampanha" class="formulario" @submit.prevent="save"><CampaignFields v-model="form" edit :preview="preview" @image="image" @remove-image="removeImage" /><button type="submit" class="botao" :disabled="busy || imageLoading">Salvar alterações</button><button type="button" class="botao-secundario" @click="editing = false">Cancelar</button></form></section>
        <section class="card"><h2>Participantes</h2><div id="participantes" class="lista"><div v-for="person in participants" :key="person.id" class="item-lista"><Avatar :user="person" class="avatar" /><RouterLink :to="{ path: '/perfil', query: { id: person.id } }">{{ nomeUsuario(person) }}</RouterLink></div></div></section>
        <section class="card"><h2>Mural da campanha</h2><div class="comentar"><input id="mensagem" v-model="text" placeholder="Escreva algo para a campanha..." :disabled="!participant"><button id="enviar" class="botao" :disabled="busy || !participant" @click="send">Enviar</button></div><div id="mural" class="lista" style="margin-top:15px"><p v-if="!posts.length">Nenhuma mensagem no mural.</p><div v-for="post in posts" :key="post.id" class="item-lista"><div class="item-info"><strong>{{ nomeUsuario(user(post.userId)) }}</strong><p>{{ post.conteudo }}</p></div><button v-if="master || String(post.userId) === userId" class="botao-perigo" :disabled="busy" @click="removePost(post)">Excluir</button></div></div></section>
    </main>
</template>

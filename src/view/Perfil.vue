<script setup lang="ts">
// A página conecta os componentes às funções de consulta, edição e amizade.
import { onMounted, watch } from "vue"
import { nomeUsuario, privado, excluirPublicacao } from "../controller/comunidade.controller.ts"
import { excluirCampanha } from "../controller/campanha.controller.ts"
import { alteracaoSolicitacoes } from "../composables/useNotificacoes.ts"
import { confirmarExclusao } from "../composables/useModal.ts"
import { useDadosPerfil } from "../composables/useDadosPerfil.ts"
import { useEdicaoPerfil } from "../composables/useEdicaoPerfil.ts"
import { useAmizadesPerfil } from "../composables/useAmizadesPerfil.ts"
import AvatarUsuario from "../components/AvatarUsuario.vue"
import FormularioPerfil from "../components/perfil/FormularioPerfil.vue"
import SolicitacoesPerfil from "../components/perfil/SolicitacoesPerfil.vue"
import AtividadesPerfil from "../components/perfil/AtividadesPerfil.vue"
import TituloPagina from "../components/TituloPagina.vue"
const perfil = useDadosPerfil()
const {
    route,
    id,
    mine,
    user,
    people,
    systems,
    posts,
    campaigns,
    carregando,
    mensagem,
    executar,
    friendship,
    following,
    follower,
    visible,
    requests,
    load,
    loadPosts,
    loadCampaigns
} = perfil
const { avatars, editing, formulario, systemName, startEdit, cancelEdit, save, addSystem, removeSystem } =
    useEdicaoPerfil(perfil)
const { friendLabel, toggleFriend, respond, followBack } = useAmizadesPerfil(perfil)
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

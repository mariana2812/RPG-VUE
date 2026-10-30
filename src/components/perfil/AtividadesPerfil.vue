<script setup lang="ts">
// Reúno as campanhas e publicações do perfil, deixando as exclusões para a página tratar.
import type { Publicacao } from "../../interfaces/comunidade.interface.ts"
import type { Campanha } from "../../interfaces/campanha.interface.ts"
defineProps<{
    visible: boolean
    mine: boolean
    campaigns: Campanha[]
    posts: Publicacao[]
    carregando: boolean
}>()
const emit = defineEmits<{ excluirCampanha: [campaign: Campanha]; excluirPublicacao: [post: Publicacao] }>()
</script>
<template>
    <section v-if="visible" id="campanhasCard" class="card">
        <h2>Campanhas criadas</h2>
        <div id="campanhasPerfil" class="lista">
            <p v-if="!campaigns.length">Nenhuma campanha criada.</p>
            <div v-for="campaign in campaigns" :key="campaign.id" class="item-lista">
                <RouterLink class="item-info" :to="{ path: '/campanha', query: { id: campaign.id } }">
                    <strong>{{ campaign.nome }}</strong>
                    <p>
                        {{ campaign.sistema || campaign.sistemaNome || "Sistema não informado" }} ·
                        {{ campaign.status || "aberta" }}
                    </p>
                </RouterLink>
                <button
                    v-if="mine"
                    class="botao-perigo"
                    :disabled="carregando"
                    @click="emit('excluirCampanha', campaign)"
                >
                    Excluir
                </button>
            </div>
        </div>
    </section>
    <section class="card">
        <h2>Publicações</h2>
        <div id="postsPerfil" class="lista">
            <p v-if="!visible">Conteúdo disponível após aceitar sua solicitação.</p>
            <p v-else-if="!posts.length">Nenhuma publicação.</p>
            <div v-for="post in posts" :key="post.id" class="item-lista">
                <RouterLink class="item-info" :to="{ path: '/taverna', hash: '#post-' + post.id }">
                    {{ post.conteudo || post.body || "" }}
                </RouterLink>
                <button
                    v-if="mine"
                    class="botao-perigo"
                    :disabled="carregando"
                    @click="emit('excluirPublicacao', post)"
                >
                    Excluir
                </button>
            </div>
        </div>
    </section>
</template>

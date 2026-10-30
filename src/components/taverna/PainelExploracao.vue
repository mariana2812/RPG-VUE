<script setup lang="ts">
// Este painel apresenta campanhas abertas e alguns jogadores da comunidade.
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import type { CampanhaResumo } from "../../interfaces/taverna.interface.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import Icone from "../Icone.vue"
import AvatarUsuario from "../AvatarUsuario.vue"
defineProps<{ users: Usuario[]; openCampaigns: CampanhaResumo[] }>()
</script>
<template>
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
                    <AvatarUsuario :user="person" />
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
</template>

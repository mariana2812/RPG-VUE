<script setup lang="ts">
// Mostro um resumo do perfil e os atalhos na lateral da Taverna.
import type { ResumoPerfilTavernaProps } from "../../interfaces/taverna.interface.ts"
import { links } from "../../routes/menu.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import Icone from "../Icone.vue"
import AvatarUsuario from "../AvatarUsuario.vue"
import ContadorMensagens from "../ContadorMensagens.vue"
defineProps<ResumoPerfilTavernaProps>()
</script>
<template>
    <aside class="left-sidebar">
        <RouterLink class="sidebar-inbox" to="/mensagens">
            <Icone name="messages-square" />
            <span>
                Suas conversas
                <small>Mensagens diretas</small>
            </span>
            <Icone name="chevron-right" />
            <ContadorMensagens />
        </RouterLink>
        <div class="sidebar-heading">SEU PONTO DE ENCONTRO</div>
        <nav class="main-menu" aria-label="Navegação principal">
            <RouterLink
                v-for="[path, name, icon] in links.slice(0, 5)"
                :key="path"
                :to="path"
                :class="{ active: path === '/taverna' }"
                :aria-current="path === '/taverna' ? 'page' : undefined"
            >
                <Icone :name="icon" />
                {{ path === "/taverna" ? "taverna-geral" : name }}
                <ContadorMensagens v-if="path === '/mensagens'" />
            </RouterLink>
        </nav>
        <div class="sidebar-heading">A PRÓXIMA SESSÃO</div>
        <button id="createCampaignButton" @click="$router.push('/campanhas')" class="create-campaign">
            <Icone name="plus" />
            Criar campanha
        </button>
        <section class="profile-card">
            <div class="profile-summary">
                <AvatarUsuario
                    id="profileAvatar"
                    :user="user"
                    style-name="adventurer"
                    class="profile-avatar"
                    alt="Seu avatar"
                />
                <div class="profile-info">
                    <h2 id="profileName">{{ user ? nomeUsuario(user) : "Carregando..." }}</h2>
                    <p id="profileDescription">{{ user?.biografia || "" }}</p>
                </div>
                <RouterLink to="/perfil" title="Editar perfil"><Icone name="settings" /></RouterLink>
            </div>
            <div id="profileSystems" class="profile-systems">
                <span v-for="system in systems" :key="system.id">{{ system.nome }}</span>
            </div>
            <div class="profile-stats">
                <div>
                    <strong id="campaignCount">{{ campaignCount }}</strong>
                    <span>Campanhas</span>
                </div>
                <div>
                    <strong id="friendCount">{{ friendCount }}</strong>
                    <span>Amigos</span>
                </div>
            </div>
        </section>
    </aside>
</template>

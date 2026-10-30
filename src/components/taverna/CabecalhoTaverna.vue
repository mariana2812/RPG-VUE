<script setup lang="ts">
// Este cabeçalho recebe os dados por props e avisa a página quando é preciso atualizar.
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import { links } from "../../routes/menu.ts"
import Icone from "../Icone.vue"
import AvatarUsuario from "../AvatarUsuario.vue"
import SinoNotificacoes from "../SinoNotificacoes.vue"
import ContadorMensagens from "../ContadorMensagens.vue"
defineProps<{ user?: Usuario; carregando: boolean }>()
const emit = defineEmits(["atualizar"])
</script>
<template>
    <nav class="guild-rail" aria-label="Atalhos">
        <RouterLink class="guild-home" to="/taverna" title="FrontD">
            <Icone name="dices" />
            <span class="sr-only">FrontD</span>
        </RouterLink>
        <span class="rail-divider"></span>
        <RouterLink
            v-for="[path, name, icon] in links.filter(item =>
                ['/taverna', '/campanhas', '/comunidades'].includes(item[0])
            )"
            :key="path"
            :to="path"
            :class="{ selected: path === '/taverna' }"
            :title="path === '/taverna' ? 'A taverna' : name"
        >
            <Icone :name="icon" />
            <span class="sr-only">{{ path === "/taverna" ? "A taverna" : name }}</span>
        </RouterLink>
        <RouterLink class="rail-add" to="/campanhas" title="Criar campanha">
            <Icone name="plus" />
            <span class="sr-only">Criar campanha</span>
        </RouterLink>
        <RouterLink class="rail-bottom" to="/configuracoes" title="Configurações">
            <Icone name="settings" />
            <span class="sr-only">Configurações</span>
        </RouterLink>
    </nav>
    <header class="topbar">
        <RouterLink to="/taverna" class="brand">
            <span class="brand-emblem"><Icone name="dices" /></span>
            <strong> Front<span>D</span> </strong>
            <span class="brand-caption">A sua próxima aventura</span>
        </RouterLink>
        <div class="channel-title">
            <Icone name="hash" />
            <strong>taverna-geral</strong>
            <span>O ponto de encontro dos aventureiros</span>
        </div>
        <div class="top-actions">
            <button
                id="atualizarFeed"
                :disabled="carregando"
                @click="emit('atualizar')"
                type="button"
                title="Atualizar feed"
                aria-label="Atualizar feed"
            >
                <Icone name="refresh-cw" />
            </button>
            <button
                id="abrirMensagens"
                @click="$router.push('/mensagens')"
                type="button"
                title="Mensagens"
                aria-label="Mensagens"
            >
                <Icone name="message-circle" />
                <ContadorMensagens />
            </button>
            <SinoNotificacoes />
            <button
                class="user-button"
                @click="$router.push('/perfil')"
                title="Meu perfil"
                aria-label="Meu perfil"
            >
                <AvatarUsuario id="topAvatar" :user="user" style-name="adventurer" />
            </button>
        </div>
    </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Icon from './Icon.vue'
import NotificationBell from './NotificationBell.vue'
import MessageBadge from './MessageBadge.vue'
const route = useRoute()
const open = ref(false)
const links = [['/taverna','Taverna','hash'],['/descobrir','Descobrir jogadores','compass'],['/campanhas','Campanhas','swords'],['/mensagens','Mensagens','message-circle'],['/comunidades','Comunidades','castle'],['/perfil','Meu perfil','user-round'],['/configuracoes','Configura??es','settings']]
const active = path => route.meta.section === path
const escape = event => { if (event.key === 'Escape') open.value = false }
onMounted(() => document.addEventListener('keydown', escape))
onUnmounted(() => { document.removeEventListener('keydown', escape); document.body.classList.remove('menu-aberto') })
function toggle(value) { open.value = value; document.body.classList.toggle('menu-aberto', value) }
</script>
<template>
    <aside class="app-lateral">
        <RouterLink class="app-marca" to="/taverna">Front<span>D</span><small>A sua pr?xima aventura</small></RouterLink>
        <RouterLink class="app-conversas" to="/mensagens"><Icon name="messages-square" /><span>Suas conversas<small>Mensagens diretas</small></span><Icon name="chevron-right" /><MessageBadge /></RouterLink>
        <p class="app-grupo">PONTO DE ENCONTRO</p>
        <nav aria-label="Navega??o principal"><RouterLink v-for="[path, name, icon] in links" :key="path" :to="path" :aria-current="active(path) ? 'page' : undefined"><Icon :name="icon" /><span>{{ name }}</span><MessageBadge v-if="path === '/mensagens'" /></RouterLink></nav>
        <RouterLink class="app-criar" to="/campanhas#formCampanha"><Icon name="plus" /> Criar campanha</RouterLink><RouterLink class="app-voltar" to="/taverna"><Icon name="arrow-left" /> Voltar ? taverna</RouterLink>
    </aside>
    <button v-show="open" type="button" class="app-menu-fundo" aria-label="Fechar navega??o" @click="toggle(false)"></button>
    <header class="topo"><button type="button" class="app-menu-botao" title="Abrir navega??o" aria-label="Abrir navega??o" :aria-expanded="open" @click="toggle(!open)"><Icon name="menu" /></button><strong># {{ route.meta.title }}</strong><NotificationBell class="app-notificacoes" /><RouterLink to="/perfil">Meu perfil</RouterLink></header>
</template>

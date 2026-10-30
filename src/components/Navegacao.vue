<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { links } from "../routes/menu.js"
import Icone from "./Icone.vue"
import SinoNotificacoes from "./SinoNotificacoes.vue"
import ContadorMensagens from "./ContadorMensagens.vue"
const route = useRoute()
const open = ref(false)

const active = path => route.meta.section === path
const escape = event => {
    if (event.key === "Escape") toggle(false)
}
onMounted(() => document.addEventListener("keydown", escape))
onUnmounted(() => {
    document.removeEventListener("keydown", escape)
    document.body.classList.remove("menu-aberto")
})
function toggle(value) {
    open.value = value
    document.body.classList.toggle("menu-aberto", value)
}
</script>
<template>
    <aside class="app-lateral">
        <RouterLink class="app-marca" to="/taverna">
            Front<span>D</span>
            <small>A sua próxima aventura</small>
        </RouterLink>
        <RouterLink class="app-conversas" to="/mensagens">
            <Icone name="messages-square" />
            <span>
                Suas conversas
                <small>Mensagens diretas</small>
            </span>
            <Icone name="chevron-right" />
            <ContadorMensagens />
        </RouterLink>
        <p class="app-grupo">PONTO DE ENCONTRO</p>
        <nav aria-label="Navegação principal">
            <RouterLink
                v-for="[path, name, icon] in links"
                :key="path"
                :to="path"
                :aria-current="active(path) ? 'page' : undefined"
            >
                <Icone :name="icon" />
                <span>{{ name }}</span>
                <ContadorMensagens v-if="path === '/mensagens'" />
            </RouterLink>
        </nav>
        <RouterLink class="app-criar" to="/campanhas#formCampanha">
            <Icone name="plus" />
            Criar campanha
        </RouterLink>
        <RouterLink class="app-voltar" to="/taverna">
            <Icone name="arrow-left" />
            Voltar à taverna
        </RouterLink>
    </aside>
    <button
        v-show="open"
        type="button"
        class="app-menu-fundo"
        aria-label="Fechar navegação"
        @click="toggle(false)"
    ></button>
    <header class="topo">
        <button
            type="button"
            class="app-menu-botao"
            title="Abrir navegação"
            aria-label="Abrir navegação"
            :aria-expanded="open"
            @click="toggle(!open)"
        >
            <Icone name="menu" />
        </button>
        <strong># {{ route.meta.title }}</strong>
        <SinoNotificacoes class="app-notificacoes" />
        <RouterLink to="/perfil">Meu perfil</RouterLink>
    </header>
</template>

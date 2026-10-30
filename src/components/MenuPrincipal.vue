<script setup lang="ts">
// Este componente reúne os links e controla a abertura do menu no celular.
import { ref, onMounted, onUnmounted } from "vue"
import { useRoute } from "vue-router"
import { links } from "../routes/menu.ts"
import Icone from "./Icone.vue"
import SinoNotificacoes from "./SinoNotificacoes.vue"
import ContadorMensagens from "./ContadorMensagens.vue"
const rota = useRoute()
const aberto = ref(false)

const estaAtivo = (path: string) => rota.meta.section === path
const fecharComEscape = (event: KeyboardEvent) => {
    if (event.key === "Escape") alternarMenu(false)
}
onMounted(() => document.addEventListener("keydown", fecharComEscape))
onUnmounted(() => {
    document.removeEventListener("keydown", fecharComEscape)
    document.body.classList.remove("menu-aberto")
})
function alternarMenu(value: boolean) {
    aberto.value = value
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
                :aria-current="estaAtivo(path) ? 'page' : undefined"
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
        v-show="aberto"
        type="button"
        class="app-menu-fundo"
        aria-label="Fechar navegação"
        @click="alternarMenu(false)"
    ></button>
    <header class="topo">
        <button
            type="button"
            class="app-menu-botao"
            title="Abrir navegação"
            aria-label="Abrir navegação"
            :aria-expanded="aberto"
            @click="alternarMenu(!aberto)"
        >
            <Icone name="menu" />
        </button>
        <strong># {{ rota.meta.title }}</strong>
        <SinoNotificacoes class="app-notificacoes" />
        <RouterLink to="/perfil">Meu perfil</RouterLink>
    </header>
</template>

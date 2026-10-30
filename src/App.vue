<script setup>
import { useRoute } from "vue-router"
import Modal from "./components/Modal.vue"
import Navegacao from "./components/Navegacao.vue"
import Notificacoes from "./components/Notificacoes.vue"
const route = useRoute()
</script>
<template>
    <Navegacao v-if="route.meta.protected && route.name !== 'Taverna'" :key="route.path" />
    <RouterView v-slot="{ Component, route: current }">
        <component :is="Component" :key="current.path + JSON.stringify(current.query)" />
    </RouterView>
    <Modal />
    <Notificacoes />
</template>

<script setup lang="ts">
// Deixo aqui a estrutura principal e os componentes que aparecem junto das páginas.
import { useRoute } from "vue-router"
import DialogoConfirmacao from "./components/DialogoConfirmacao.vue"
import MenuPrincipal from "./components/MenuPrincipal.vue"
import CentralNotificacoes from "./components/CentralNotificacoes.vue"
const route = useRoute()
</script>
<template>
    <MenuPrincipal v-if="route.meta.protected && route.name !== 'Taverna'" :key="route.path" />
    <RouterView :key="route.path + JSON.stringify(route.query)" />
    <DialogoConfirmacao />
    <CentralNotificacoes />
</template>

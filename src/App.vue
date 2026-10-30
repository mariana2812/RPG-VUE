<script setup>
import { useRoute } from 'vue-router'
import AppModal from './components/AppModal.vue'
import AppNavigation from './components/AppNavigation.vue'
import Notifications from './components/Notifications.vue'
const route = useRoute()
</script>
<template><AppNavigation v-if="route.meta.protected && route.name !== 'Tavern'" :key="route.path" /><RouterView v-slot="{ Component, route: current }"><component :is="Component" :key="current.path + JSON.stringify(current.query)" /></RouterView><AppModal /><Notifications /></template>

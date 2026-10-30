<script setup>
import AppModal from './components/AppModal.vue'
</script>
<template><RouterView v-slot="{ Component, route }"><component :is="Component" :key="route.path + JSON.stringify(route.query)" /></RouterView><AppModal /></template>

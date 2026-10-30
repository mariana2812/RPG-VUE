<script setup>
import { icons } from 'lucide-vue-next'
import { computed } from 'vue'
const props = defineProps({ name: { type: String, required: true } })
const icon = computed(() => icons[props.name.split('-').map(part => part[0].toUpperCase() + part.slice(1)).join('')])
</script>
<template><component :is="icon" :data-lucide="name" aria-hidden="true" /></template>

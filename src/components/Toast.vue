<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
defineProps({ toast: Object })
const emit = defineEmits(['close'])
const show = ref(false)
let timer, remove
onMounted(() => { show.value = true; timer = setTimeout(() => { show.value = false; remove = setTimeout(() => emit('close'), 400) }, 3200) })
onUnmounted(() => { clearTimeout(timer); clearTimeout(remove) })
</script>
<template><div class="toast" :class="['toast-' + toast.tipo, { show, 'toast-link': toast.url }]" :role="toast.url ? 'link' : 'status'" :tabindex="toast.url ? 0 : undefined" @click="toast.url && $router.push(toast.url)" @keydown.enter="toast.url && $router.push(toast.url)"><div class="toast-icon">{{ toast.tipo === 'success' ? '?' : toast.tipo === 'warning' ? '!' : '?' }}</div><div class="toast-copy"><strong>{{ toast.titulo }}</strong><span>{{ toast.mensagem }}</span></div></div></template>

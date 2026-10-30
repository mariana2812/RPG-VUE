<script setup lang="ts">
// Este aviso aparece por alguns segundos e depois pede para ser removido da lista.
import { onMounted, onUnmounted, ref } from "vue"
interface AvisoTemporarioProps {
    toast: {
        titulo: string
        mensagem: string
        tipo: string
        url?: string
    }
}
defineProps<AvisoTemporarioProps>()
const emit = defineEmits(["close"])
const show = ref(false)
let timer
let remove
onMounted(() => {
    show.value = true
    timer = setTimeout(() => {
        show.value = false
        remove = setTimeout(() => emit("close"), 400)
    }, 3200)
})
onUnmounted(() => {
    clearTimeout(timer)
    clearTimeout(remove)
})
</script>
<template>
    <div
        class="toast"
        :class="['toast-' + toast.tipo, { show, 'toast-link': toast.url }]"
        :role="toast.url ? 'link' : 'status'"
        :tabindex="toast.url ? 0 : undefined"
        @click="toast.url && $router.push(toast.url)"
        @keydown.enter="toast.url && $router.push(toast.url)"
    >
        <div class="toast-icon">
            {{ toast.tipo === "success" ? "✓" : toast.tipo === "warning" ? "!" : "•" }}
        </div>
        <div class="toast-copy">
            <strong>{{ toast.titulo }}</strong>
            <span>{{ toast.mensagem }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
// Aqui eu inicio as atualizações e reúno o modal e os avisos temporários.
import { watch, onUnmounted } from "vue"
import { sessao } from "../controller/usuario.controller.ts"
import { iniciarNotificacoes, avisos } from "../composables/useNotificacoes.ts"
import ModalSolicitacoes from "./notificacoes/ModalSolicitacoes.vue"
import AvisoTemporario from "./AvisoTemporario.vue"
let parar: (() => void) | undefined
watch(
    () => sessao.userId,
    id => {
        parar?.()
        if (id && sessao.token) parar = iniciarNotificacoes()
    },
    { immediate: true }
)
onUnmounted(() => parar?.())
</script>
<template>
    <Teleport to="body">
        <ModalSolicitacoes />
        <div class="notification-stack" aria-live="polite">
            <AvisoTemporario
                v-for="toast in avisos"
                :key="toast.id"
                :toast="toast"
                @close="avisos = avisos.filter(item => item.id !== toast.id)"
            />
        </div>
    </Teleport>
</template>

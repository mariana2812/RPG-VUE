<script setup lang="ts">
// Mostro apenas a quantidade de mensagens que ainda não foram lidas.
import { computed } from "vue"
import { contarNaoLidas } from "../composables/useNotificacoes.ts"
interface ContadorMensagensProps {
    type?: string
    id?: string | number
}
const props = defineProps<ContadorMensagensProps>()
const count = computed(() => contarNaoLidas(props.type, props.id))
</script>
<template>
    <span v-if="count" class="contador-mensagens" :aria-label="count + ' mensagens não lidas'">
        {{ count }}
    </span>
</template>

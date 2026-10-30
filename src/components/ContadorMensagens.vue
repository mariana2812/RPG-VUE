<script setup>
import { computed } from "vue"
import { contarNaoLidas } from "../composables/useNotificacoes.js"
const props = defineProps({ type: String, id: [String, Number] })
const count = computed(() => contarNaoLidas(props.type, props.id))
</script>
<template>
    <span v-if="count" class="contador-mensagens" :aria-label="count + ' mensagens não lidas'">
        {{ count }}
    </span>
</template>

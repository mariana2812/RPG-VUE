<script setup>
import { computed } from 'vue'
import { unreadCount } from '../composables/useNotifications.js'
const props = defineProps({ type: String, id: [String, Number] })
const count = computed(() => unreadCount(props.type, props.id))
</script>
<template>
  <span v-if="count" class="contador-mensagens" :aria-label="count + ' mensagens não lidas'">{{
    count
  }}</span>
</template>

<script setup>
import Icon from './Icon.vue'
import { pendingRequests, notificationsOpen } from '../composables/useNotifications.js'
</script>
<template><button type="button" title="Notificações" aria-label="Notificações" @click="notificationsOpen = true"><Icon name="bell" /><span v-if="pendingRequests.length" class="notification-badge">{{ pendingRequests.length > 9 ? '9+' : pendingRequests.length }}</span></button></template>

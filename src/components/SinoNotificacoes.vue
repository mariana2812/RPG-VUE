<script setup>
import Icone from "./Icone.vue"
import { solicitacoesPendentes, notificacoesAbertas } from "../composables/useNotificacoes.js"
</script>
<template>
    <button type="button" title="Notificações" aria-label="Notificações" @click="notificacoesAbertas = true">
        <Icone name="bell" />
        <span v-if="solicitacoesPendentes.length" class="notification-badge">
            {{ solicitacoesPendentes.length > 9 ? "9+" : solicitacoesPendentes.length }}
        </span>
    </button>
</template>

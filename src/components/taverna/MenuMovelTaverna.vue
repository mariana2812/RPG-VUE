<script setup lang="ts">
// Separo os atalhos do celular para não deixar a página principal tão grande.
import Icone from "../Icone.vue"
const emit = defineEmits(["nova-publicacao"])
</script>
<template>
    <nav class="mobile-nav" aria-label="Navegação móvel">
        <RouterLink to="/taverna" aria-current="page">
            <Icone name="hash" />
            <small>Taverna</small>
        </RouterLink>
        <RouterLink to="/descobrir">
            <Icone name="compass" />
            <small>Explorar</small>
        </RouterLink>
        <button @click="emit('nova-publicacao')" title="Nova publicação" aria-label="Nova publicação">
            <Icone name="plus" />
        </button>
        <RouterLink to="/campanhas">
            <Icone name="swords" />
            <small>Mesas</small>
        </RouterLink>
        <RouterLink to="/perfil">
            <Icone name="user-round" />
            <small>Perfil</small>
        </RouterLink>
    </nav>
</template>

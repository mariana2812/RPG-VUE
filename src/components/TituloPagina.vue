<script setup lang="ts">
// Reutilizo este cabeçalho para manter os títulos das páginas no mesmo padrão.
interface TituloPaginaProps {
    label: string
    title: string
    description?: string
}
defineProps<TituloPaginaProps>()
</script>
<template>
    <div class="titulo-pagina">
        <small>{{ label }}</small>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
    </div>
</template>

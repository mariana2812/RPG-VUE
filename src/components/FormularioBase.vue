<script setup lang="ts">
// Uso os slots para trocar os campos e o rodapé sem repetir a estrutura do formulário.
interface FormularioBaseProps {
    title: string
    buttonLabel: string
    loading?: boolean
}
defineProps<FormularioBaseProps>()
</script>

<template>
    <form>
        <h1>{{ title }}</h1>
        <slot></slot>
        <button type="submit" :disabled="loading">{{ buttonLabel }}</button>
        <slot name="rodape"></slot>
    </form>
</template>

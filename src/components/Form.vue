<script setup>
defineProps({
    title: String,
    buttonLabel: String,
    loading: Boolean
})
</script>

<template>
    <form>
        <h1>{{ title }}</h1>
        <slot></slot>
        <button type="submit" :disabled="loading">{{ buttonLabel }}</button>
        <slot name="rodape"></slot>
    </form>
</template>

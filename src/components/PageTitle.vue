<script setup>defineProps(['label', 'title', 'description'])</script>
<template><div class="titulo-pagina"><small>{{ label }}</small><h1>{{ title }}</h1><p v-if="description">{{ description }}</p></div></template>

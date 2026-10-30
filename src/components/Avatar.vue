<script setup>
import { avatarUsuario } from "../controller/comunidade.controller.js"
defineProps({ user: Object, styleName: { type: String, default: "bottts" } })
</script>
<template><img :src="avatarUsuario(user, styleName)" alt="" /></template>

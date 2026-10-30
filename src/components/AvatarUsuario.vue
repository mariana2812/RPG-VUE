<script setup lang="ts">
// Uso o avatar salvo ou uma imagem gerada a partir dos dados do usuário.
import { avatarUsuario } from "../controller/comunidade.controller.ts"
import type { Usuario } from "../interfaces/usuario.interface.ts"
interface AvatarUsuarioProps {
    user?: Usuario
    styleName?: string
}
withDefaults(defineProps<AvatarUsuarioProps>(), { styleName: "bottts" })
</script>
<template><img :src="avatarUsuario(user, styleName)" alt="" /></template>

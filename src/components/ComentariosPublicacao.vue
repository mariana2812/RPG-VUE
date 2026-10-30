<script setup lang="ts">
// Este componente mostra os comentários e avisa quando um novo texto é enviado.
import type { Publicacao } from "../interfaces/comunidade.interface.ts"
import type { Usuario } from "../interfaces/usuario.interface.ts"
import { nomeUsuario } from "../controller/comunidade.controller.ts"
import AvatarUsuario from "./AvatarUsuario.vue"
defineProps<{ comments: Publicacao[]; people: Map<string, Usuario>; open: boolean; carregando: boolean }>()
const text = defineModel<string>({ required: true })
const emit = defineEmits(["enviar"])
</script>
<template>
    <div class="comments-area" :class="{ open }">
        <div class="comments-list">
            <div v-if="!comments.length" class="empty-small">Nenhum comentário ainda.</div>
            <div v-for="reply in comments" :key="reply.id" class="comment">
                <AvatarUsuario
                    :user="people.get(String(reply.userId))"
                    style-name="adventurer"
                    class="comment-avatar"
                />
                <div class="comment-body">
                    <strong>{{ nomeUsuario(people.get(String(reply.userId))) }}</strong>
                    <p>{{ reply.conteudo }}</p>
                </div>
            </div>
        </div>
        <form class="comment-form" @submit.prevent="emit('enviar')">
            <input v-model="text" type="text" placeholder="Escreva um comentário..." maxlength="500" />
            <button type="submit" class="send-comment" :disabled="carregando">Enviar</button>
        </form>
    </div>
</template>

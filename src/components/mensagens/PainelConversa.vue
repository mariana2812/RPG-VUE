<script setup lang="ts">
// Este painel mostra as mensagens; o envio continua sendo tratado pela página.
import { ref } from "vue"
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import type { Conversa, Mensagem } from "../../interfaces/mensagem.interface.ts"
import { sessao } from "../../controller/usuario.controller.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import Icone from "../Icone.vue"
const props = defineProps<{
    selected?: Conversa
    detail: string
    messages: Mensagem[]
    users: Usuario[]
    loading: boolean
    carregando: boolean
}>()
const text = defineModel<string>({ required: true })
const emit = defineEmits(["enviar"])
const chat = ref<HTMLElement | null>(null)
const userId = sessao.userId
const author = (id: string | number) =>
    String(id) === userId ? "Você" : nomeUsuario(props.users.find(user => String(user.id) === String(id)))
function estaNoFinal() {
    return !chat.value || chat.value.scrollHeight - chat.value.scrollTop - chat.value.clientHeight < 40
}
function rolarParaFinal() {
    if (chat.value) chat.value.scrollTop = chat.value.scrollHeight
}
defineExpose({ estaNoFinal, rolarParaFinal })
</script>
<template>
    <section class="chat">
        <header class="chat-cabecalho">
            <h3 id="nomeContato">
                {{ selected ? nomeUsuario(selected.data) : "Mensagens diretas" }}
            </h3>
            <p id="detalheContato">{{ detail }}</p>
        </header>
        <div id="chat" ref="chat" class="chat-mensagens">
            <div v-if="!selected" class="chat-vazio">
                <Icone name="messages-square" />
                <h2>A próxima aventura começa com uma conversa.</h2>
                <p>Seus amigos e companheiros de comunidade estão ao lado.</p>
                <RouterLink class="botao" to="/descobrir">Encontrar jogador</RouterLink>
            </div>
            <template v-else>
                <p v-if="loading">Carregando conversa...</p>
                <p v-else-if="!messages.length">Nenhuma mensagem nesta conversa.</p>
                <div
                    v-for="item in messages"
                    :key="item.id"
                    class="balao"
                    :class="{ meu: String(item.senderId) === userId }"
                >
                    <strong v-if="selected.type === 'comunidade'" class="mensagem-autor">
                        {{ author(item.senderId) }}
                    </strong>
                    <span>{{ item.conteudo }}</span>
                </div>
            </template>
        </div>
        <form class="enviar-mensagem" @submit.prevent="emit('enviar')">
            <input
                id="mensagem"
                v-model="text"
                placeholder="Digite uma mensagem..."
                aria-label="Mensagem"
                maxlength="5000"
                :disabled="!selected"
                @keydown.enter="
                    event => {
                        if (event.isComposing) event.preventDefault()
                    }
                "
            />
            <button id="enviar" class="botao" :disabled="carregando || !selected">Enviar</button>
        </form>
    </section>
</template>

<script setup lang="ts">
// O mural recebe as mensagens e avisa a página quando o usuário envia ou exclui uma.
import type { Publicacao } from "../../interfaces/comunidade.interface.ts"
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import { nomeUsuario } from "../../controller/comunidade.controller.ts"
import { sessao } from "../../controller/usuario.controller.ts"
const props = defineProps<{
    publicacoes: Publicacao[]
    usuarios: Usuario[]
    participa: boolean
    ehMestre: boolean
    carregando: boolean
}>()
const texto = defineModel<string>({ required: true })
const emit = defineEmits<{ enviar: []; excluir: [post: Publicacao] }>()
const userId = sessao.userId
const buscarUsuario = (id: string | number) =>
    props.usuarios.find(usuario => String(usuario.id) === String(id))
</script>
<template>
    <section class="card">
        <h2>Mural da campanha</h2>
        <div class="comentar">
            <input
                id="mensagem"
                v-model="texto"
                placeholder="Escreva algo para a campanha..."
                :disabled="!participa"
            />
            <button id="enviar" class="botao" :disabled="carregando || !participa" @click="emit('enviar')">
                Enviar
            </button>
        </div>
        <div id="mural" class="lista" style="margin-top: 15px">
            <p v-if="!publicacoes.length">Nenhuma mensagem no mural.</p>
            <div v-for="post in publicacoes" :key="post.id" class="item-lista">
                <div class="item-info">
                    <strong>{{ nomeUsuario(buscarUsuario(post.userId)) }}</strong>
                    <p>{{ post.conteudo }}</p>
                </div>
                <button
                    v-if="ehMestre || String(post.userId) === userId"
                    class="botao-perigo"
                    :disabled="carregando"
                    @click="emit('excluir', post)"
                >
                    Excluir
                </button>
            </div>
        </div>
    </section>
</template>

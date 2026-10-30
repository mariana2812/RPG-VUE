<script setup lang="ts">
// Aqui eu preparo o texto, a imagem e o sistema antes de publicar no mural.
import type { Usuario } from "../../interfaces/usuario.interface.ts"
import { ref } from "vue"
import { apiController as api } from "../../controller/api.controller.ts"
import { sessao } from "../../controller/usuario.controller.ts"
import { useOperacaoAssincrona } from "../../composables/useOperacaoAssincrona.ts"
import { useImagem } from "../../composables/useImagem.ts"
import { abrirModal } from "../../composables/useModal.ts"
import AvatarUsuario from "../AvatarUsuario.vue"
import Icone from "../Icone.vue"
const props = defineProps<{ user?: Usuario; bloqueado?: boolean }>()
const emit = defineEmits(["publicada"])
const userId = sessao.userId
const text = ref("")
const system = ref("")
const postInput = ref<HTMLTextAreaElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const { carregando, mensagem, executar } = useOperacaoAssincrona()
const {
    imagem: image,
    lendo: imageLoading,
    selecionar: chooseImage,
    limpar: limparImagem
} = useImagem(mensagem)
function focusPost() {
    postInput.value?.scrollIntoView({ behavior: "smooth", block: "center" })
    postInput.value?.focus({ preventScroll: true })
}
function toggleImage() {
    if (image.value) {
        limparImagem()
        imageInput.value.value = ""
    } else imageInput.value?.click()
}
async function chooseSystem() {
    const name = await abrirModal({
        titulo: "Qual é o sistema da aventura?",
        mensagem: "Adicione um sistema à sua publicação. Deixe em branco para remover.",
        campo: true,
        valor: system.value,
        confirmar: "Adicionar sistema"
    })
    if (typeof name === "string") system.value = name.trim()
}
function publish() {
    executar(async () => {
        const conteudo = text.value.trim()
        if (!conteudo) {
            focusPost()
            return
        }
        await api.post("/blog", {
            userId: props.user?.id ?? userId,
            imagem: image.value,
            sistema: system.value,
            user: { id: props.user?.id ?? userId },
            conteudo,
            created_at: new Date().toISOString()
        })
        text.value = system.value = ""
        limparImagem()
        if (imageInput.value) imageInput.value.value = ""
        emit("publicada")
    })
}

defineExpose({ focar: focusPost })
</script>
<template>
    <section class="create-post" aria-label="Nova publicação">
        <AvatarUsuario
            id="createPostAvatar"
            :user="user"
            style-name="adventurer"
            class="create-avatar"
            alt="Seu avatar"
        />
        <div class="create-content">
            <textarea
                id="postContent"
                ref="postInput"
                v-model="text"
                placeholder="Que história você traz para a taverna?"
                aria-label="Texto da publicação"
                maxlength="5000"
            ></textarea>
            <img v-if="image" :src="image" class="previa-publicacao" alt="Imagem selecionada para publicar" />
            <input
                ref="imageInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                @change="chooseImage(($event.target as HTMLInputElement).files?.[0])"
            />
            <div class="create-footer">
                <div class="create-tools">
                    <button
                        type="button"
                        :title="image ? 'Remover imagem' : 'Adicionar imagem'"
                        @click="toggleImage"
                    >
                        <Icone name="image" />
                        <span>{{ image ? "Remover imagem" : "Imagem" }}</span>
                    </button>
                    <button type="button" title="Escolher sistema" @click="chooseSystem">
                        <Icone name="dices" />
                        <span>{{ system || "Sistema" }}</span>
                    </button>
                </div>
                <button
                    id="publishButton"
                    :disabled="bloqueado || carregando || imageLoading"
                    @click="publish"
                    class="publish-button"
                    type="button"
                >
                    Publicar
                </button>
            </div>
        </div>
    </section>
    <p v-if="mensagem" class="feed-message" role="status">{{ mensagem }}</p>
</template>

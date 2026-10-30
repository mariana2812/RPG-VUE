<script setup lang="ts">
// Este formulário altera o modelo recebido e envia os eventos de salvar ou cancelar.
import CampoFormulario from "../CampoFormulario.vue"
interface DadosPerfil {
    nome: string
    biografia: string
    privacidade: string
    avatar: string
}
const formulario = defineModel<DadosPerfil>({ required: true })
defineProps<{ avatars: { url: string }[]; avatarAtual?: string; carregando: boolean }>()
const emit = defineEmits(["salvar", "cancelar"])
</script>
<template>
    <section id="editarPerfil" class="card">
        <h2>Editar perfil</h2>
        <form id="formPerfil" class="formulario" @submit.prevent="emit('salvar')">
            <CampoFormulario id="nome" v-model="formulario.nome" label="Nome" required />
            <CampoFormulario id="biografia" v-model="formulario.biografia" label="Biografia" multiline />
            <div class="campo">
                <label for="privacidadePerfil">Privacidade da conta</label>
                <select id="privacidadePerfil" v-model="formulario.privacidade">
                    <option value="publico">Pública</option>
                    <option value="privado">Privada</option>
                </select>
            </div>
            <div class="campo">
                <label>Escolha um avatar</label>
                <div id="avatarOpcoes" class="avatar-opcoes">
                    <button
                        v-for="(option, index) in avatars"
                        :key="option.url"
                        type="button"
                        class="avatar-escolha"
                        :title="option.url === avatarAtual ? 'Seu avatar atual' : 'Avatar ' + (index + 1)"
                        :aria-pressed="option.url === formulario.avatar"
                        @click="formulario.avatar = option.url"
                    >
                        <img
                            :src="option.url"
                            :alt="'Avatar ' + (index + 1)"
                            :class="{ selecionado: option.url === formulario.avatar }"
                        />
                    </button>
                </div>
            </div>
            <button class="botao" :disabled="carregando">Salvar perfil</button>
            <button id="cancelarEdicao" class="botao-secundario" type="button" @click="emit('cancelar')">
                Cancelar
            </button>
        </form>
    </section>
</template>

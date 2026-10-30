<script setup lang="ts">
// Reutilizo estes campos tanto para criar quanto para editar uma campanha.
import type { FormularioCampanha } from "../interfaces/campanha.interface.ts"
import CampoFormulario from "./CampoFormulario.vue"
const form = defineModel<FormularioCampanha>({ required: true })
interface CamposCampanhaProps {
    edit?: boolean
    preview?: string
}
defineProps<CamposCampanhaProps>()
const emit = defineEmits(["image", "remove-image"])
</script>
<template>
    <CampoFormulario
        :id="edit ? 'editarNome' : 'nome'"
        v-model="form.nome"
        label="Nome"
        :maxlength="100"
        required
    />
    <CampoFormulario
        :id="edit ? 'editarSistema' : 'sistema'"
        v-model="form.sistema"
        label="Sistema"
        :maxlength="100"
        placeholder="Ex: D&D 5e"
        required
    />
    <CampoFormulario
        :id="edit ? 'editarDescricao' : 'descricao'"
        v-model="form.descricao"
        label="Descrição"
        :maxlength="5000"
        multiline
        required
    />
    <CampoFormulario
        :id="edit ? 'editarLimite' : 'maxJogadores'"
        v-model="form.maxJogadores"
        label="Quantidade máxima de jogadores"
        type="number"
        :min="2"
        :max="20"
        required
    />
    <div class="campo">
        <label :for="edit ? 'editarCapa' : 'capa'">{{ edit ? "Nova capa" : "Capa da campanha" }}</label>
        <input
            :id="edit ? 'editarCapa' : 'capa'"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="emit('image', ($event.target as HTMLInputElement).files?.[0])"
        />
        <img v-if="preview" id="previaCapa" :src="preview" class="previa-capa" alt="Prévia da capa" />
    </div>
    <label v-if="edit" class="opcao-checkbox">
        <input id="removerCapa" v-model="form.removerCapa" type="checkbox" @change="emit('remove-image')" />
        Remover capa atual
    </label>
</template>

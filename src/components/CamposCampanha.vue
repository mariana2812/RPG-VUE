<script setup>
import Input from "./input/Input.vue"
const form = defineModel({ required: true })
defineProps({ edit: Boolean, preview: String })
const emit = defineEmits(["image", "remove-image"])
const campos = [
    ["nome", "editarNome", "Nome", { maxlength: 100 }],
    ["sistema", "editarSistema", "Sistema", { maxlength: 100, placeholder: "Ex: D&D 5e" }],
    ["descricao", "editarDescricao", "Descrição", { maxlength: 5000, multiline: true }],
    ["maxJogadores", "editarLimite", "Quantidade máxima de jogadores", { type: "number", min: 2, max: 20 }]
]
</script>
<template>
    <Input
        v-for="[nome, idEdicao, label, opcoes] in campos"
        :key="nome"
        :id="edit ? idEdicao : nome"
        v-model="form[nome]"
        :label="label"
        v-bind="opcoes"
        required
    />
    <div class="campo">
        <label :for="edit ? 'editarCapa' : 'capa'">{{ edit ? "Nova capa" : "Capa da campanha" }}</label>
        <input
            :id="edit ? 'editarCapa' : 'capa'"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            @change="emit('image', $event.target.files[0])"
        />
        <img v-if="preview" id="previaCapa" :src="preview" class="previa-capa" alt="Prévia da capa" />
    </div>
    <label v-if="edit" class="opcao-checkbox">
        <input id="removerCapa" v-model="form.removerCapa" type="checkbox" @change="emit('remove-image')" />
        Remover capa atual
    </label>
</template>

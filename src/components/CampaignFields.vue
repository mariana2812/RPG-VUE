<script setup>
import FormField from './FormField.vue'
const form = defineModel({ required: true })
defineProps({ edit: Boolean, preview: String })
const emit = defineEmits(['image', 'remove-image'])
</script>
<template>
  <FormField
    :id="edit ? 'editarNome' : 'nome'"
    v-model="form.nome"
    label="Nome"
    required
    maxlength="100"
  />
  <FormField
    :id="edit ? 'editarSistema' : 'sistema'"
    v-model="form.sistema"
    label="Sistema"
    placeholder="Ex: D&D 5e"
    required
    maxlength="100"
  />
  <FormField
    :id="edit ? 'editarDescricao' : 'descricao'"
    v-model="form.descricao"
    label="Descrição"
    multiline
    required
    maxlength="5000"
  />
  <FormField
    :id="edit ? 'editarLimite' : 'maxJogadores'"
    v-model="form.maxJogadores"
    label="Quantidade máxima de jogadores"
    type="number"
    min="2"
    max="20"
    required
  />
  <div class="campo">
    <label :for="edit ? 'editarCapa' : 'capa'">{{ edit ? 'Nova capa' : 'Capa da campanha' }}</label
    ><input
      :id="edit ? 'editarCapa' : 'capa'"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      @change="emit('image', $event.target.files[0])"
    /><img v-if="preview" id="previaCapa" :src="preview" class="previa-capa" alt="Prévia da capa" />
  </div>
  <label v-if="edit" class="opcao-checkbox"
    ><input
      id="removerCapa"
      v-model="form.removerCapa"
      type="checkbox"
      @change="emit('remove-image')"
    />
    Remover capa atual</label
  >
</template>

<script setup lang="ts">
// Este campo funciona com v-model e pode ser um input ou uma área de texto.
defineOptions({ inheritAttrs: false })
interface CampoFormularioProps {
    modelValue?: string | number
    id: string
    label: string
    multiline?: boolean
    type?: string
}
const props = withDefaults(defineProps<CampoFormularioProps>(), { type: "text" })
const emit = defineEmits(["update:modelValue"])

// Devolvo o novo valor ao componente pai; nos campos numéricos, converto para número.
function atualizar(event: Event) {
    const valor = (event.target as HTMLInputElement | HTMLTextAreaElement).value
    emit("update:modelValue", props.type === "number" ? Number(valor) : valor)
}
</script>

<template>
    <div class="campo">
        <label :for="id">{{ label }}</label>
        <component
            :is="multiline ? 'textarea' : 'input'"
            :id="id"
            :type="multiline ? undefined : type"
            :value="modelValue"
            v-bind="$attrs"
            @input="atualizar"
        />
    </div>
</template>

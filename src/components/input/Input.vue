<script setup>
defineOptions({ inheritAttrs: false })
const props = defineProps({
    modelValue: [String, Number],
    id: String,
    label: String,
    multiline: Boolean,
    type: { type: String, default: "text" }
})
const emit = defineEmits(["update:modelValue"])

function atualizar(event) {
    const valor = event.target.value
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

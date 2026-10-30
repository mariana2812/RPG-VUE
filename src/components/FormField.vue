<script setup>
defineProps({ modelValue: [String, Number], id: String, label: String, multiline: Boolean, type: { type: String, default: 'text' } })
const emit = defineEmits(['update:modelValue'])
</script>
<template><div class="campo"><label :for="id">{{ label }}</label><textarea v-if="multiline" :id="id" :value="modelValue" v-bind="$attrs" @input="emit('update:modelValue', $event.target.value)"></textarea><input v-else :id="id" :type="type" :value="modelValue" v-bind="$attrs" @input="emit('update:modelValue', type === 'number' ? Number($event.target.value) : $event.target.value)"></div></template>

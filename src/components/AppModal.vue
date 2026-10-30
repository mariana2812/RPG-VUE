<script setup>
import { ref, watch, nextTick } from 'vue'
import { dialog, closeDialog } from '../composables/useDialog.js'
const element = ref(null)
const input = ref(null)
const cancel = ref(null)
const confirm = ref(null)
const value = ref('')
let previousFocus
watch(dialog, async options => {
    if (!options) return
    previousFocus = document.activeElement
    value.value = options.valor
    await nextTick()
    element.value.showModal()
    ;(options.campo ? input.value : options.perigo ? cancel.value : confirm.value)?.focus()
})
function finish(result = null) {
    closeDialog(result)
    nextTick(() => { if (previousFocus?.isConnected) previousFocus.focus() })
}
function outside(event) {
    if (event.target !== element.value) return
    const box = element.value.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) finish()
}
</script>
<template>
    <Teleport to="body">
        <dialog v-if="dialog" ref="element" class="modal-frontd" aria-labelledby="tituloModal" aria-describedby="textoModal" @cancel.prevent="finish()" @click="outside">
            <form method="dialog" class="modal-form" @submit.prevent="finish(dialog.campo ? value.trim() : true)">
                <div class="modal-topo"><span class="modal-marca">Front<span>D</span></span><button type="button" class="modal-fechar" aria-label="Fechar" @click="finish()">?</button></div>
                <h2 id="tituloModal">{{ dialog.titulo }}</h2><p id="textoModal">{{ dialog.mensagem }}</p>
                <div v-if="dialog.campo" class="modal-campo"><label for="valorModal">{{ dialog.rotulo }}</label>
                    <textarea v-if="dialog.multilinha" id="valorModal" ref="input" v-model="value" maxlength="5000" rows="6"></textarea>
                    <input v-else id="valorModal" ref="input" v-model="value" type="text" maxlength="100" autocomplete="off" placeholder="Ex.: D&D 5e, Tormenta 20">
                </div>
                <div class="modal-acoes"><button v-if="dialog.cancelar" ref="cancel" type="button" class="modal-cancelar" @click="finish()">Cancelar</button><button ref="confirm" type="submit" class="modal-confirmar" :class="{ 'modal-perigo': dialog.perigo }">{{ dialog.confirmar }}</button></div>
            </form>
        </dialog>
    </Teleport>
</template>

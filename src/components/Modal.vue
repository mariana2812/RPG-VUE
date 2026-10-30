<script setup>
import { ref, watch, nextTick } from "vue"
import { modal, fecharModal } from "../composables/useModal.js"
const element = ref(null)
const input = ref(null)
const cancel = ref(null)
const confirm = ref(null)
const value = ref("")
let previousFocus
watch(modal, async options => {
    if (!options) return
    previousFocus = document.activeElement
    value.value = options.valor
    await nextTick()
    if (!element.value || modal.value !== options) return
    element.value.showModal()
    ;(options.campo ? input.value : options.perigo ? cancel.value : confirm.value)?.focus()
})
function finish(result = null) {
    fecharModal(result)
    nextTick(() => {
        if (previousFocus?.isConnected) previousFocus.focus()
    })
}
function outside(event) {
    if (event.target !== element.value) return
    const box = element.value.getBoundingClientRect()
    if (
        event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom
    )
        finish()
}
</script>
<template>
    <Teleport to="body">
        <dialog
            v-if="modal"
            ref="element"
            class="modal-frontd"
            aria-labelledby="tituloModal"
            aria-describedby="textoModal"
            @cancel.prevent="finish()"
            @click="outside"
        >
            <form
                method="dialog"
                class="modal-form"
                @submit.prevent="finish(modal.campo ? value.trim() : true)"
            >
                <div class="modal-topo">
                    <span class="modal-marca"> Front<span>D</span> </span>
                    <button type="button" class="modal-fechar" aria-label="Fechar" @click="finish()">
                        ×
                    </button>
                </div>
                <h2 id="tituloModal">{{ modal.titulo }}</h2>
                <p id="textoModal">{{ modal.mensagem }}</p>
                <div v-if="modal.campo" class="modal-campo">
                    <label for="valorModal">{{ modal.rotulo }}</label>
                    <textarea
                        v-if="modal.multilinha"
                        id="valorModal"
                        ref="input"
                        v-model="value"
                        maxlength="5000"
                        rows="6"
                    ></textarea>
                    <input
                        v-else
                        id="valorModal"
                        ref="input"
                        v-model="value"
                        type="text"
                        maxlength="100"
                        autocomplete="off"
                        placeholder="Ex.: D&D 5e, Tormenta 20"
                    />
                </div>
                <div class="modal-acoes">
                    <button
                        v-if="modal.cancelar"
                        ref="cancel"
                        type="button"
                        class="modal-cancelar"
                        @click="finish()"
                    >
                        Cancelar
                    </button>
                    <button
                        ref="confirm"
                        type="submit"
                        class="modal-confirmar"
                        :class="{ 'modal-perigo': modal.perigo }"
                    >
                        {{ modal.confirmar }}
                    </button>
                </div>
            </form>
        </dialog>
    </Teleport>
</template>

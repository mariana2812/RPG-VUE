import { shallowRef } from "vue"
export const modal = shallowRef(null)
let resolver
export function abrirModal(options) {
    if (modal.value) return Promise.resolve(null)
    return new Promise(resolve => {
        resolver = resolve
        modal.value = {
            campo: false,
            valor: "",
            confirmar: "Confirmar",
            perigo: false,
            cancelar: true,
            multilinha: false,
            rotulo: "Sistema de RPG",
            ...options
        }
    })
}
export function fecharModal(value = null) {
    const resolve = resolver
    resolver = null
    modal.value = null
    resolve?.(value)
}

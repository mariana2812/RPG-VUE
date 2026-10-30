import { shallowRef } from 'vue'
export const dialog = shallowRef(null)
let resolver
export function abrirModal(options) {
    if (dialog.value) return Promise.resolve(null)
    return new Promise(resolve => {
        resolver = resolve
        dialog.value = { campo: false, valor: '', confirmar: 'Confirmar', perigo: false, cancelar: true, multilinha: false, rotulo: 'Sistema de RPG', ...options }
    })
}
export function closeDialog(value = null) {
    const resolve = resolver
    resolver = null
    dialog.value = null
    resolve?.(value)
}

// Uso este estado compartilhado para abrir o diálogo a partir de qualquer componente.
import { shallowRef } from "vue"
export interface OpcoesModal {
    titulo: string
    mensagem?: string
    campo?: boolean
    valor?: string
    confirmar?: string
    perigo?: boolean
    cancelar?: boolean
    multilinha?: boolean
    rotulo?: string
}
export type ResultadoModal = string | boolean | null
export const modal = shallowRef<OpcoesModal | null>(null)
let resolver: ((value: ResultadoModal) => void) | null = null
export function abrirModal(options: OpcoesModal): Promise<ResultadoModal> {
    if (modal.value) return Promise.resolve(null)
    return new Promise<ResultadoModal>(resolve => {
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
export function fecharModal(value: ResultadoModal = null) {
    const resolve = resolver
    resolver = null
    modal.value = null
    resolve?.(value)
}

export function confirmarExclusao(titulo: string, mensagem: string, confirmar = "Excluir") {
    return abrirModal({ titulo, mensagem, confirmar, perigo: true })
}

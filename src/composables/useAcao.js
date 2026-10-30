import { ref } from "vue"
export function useAcao() {
    const carregando = ref(false)
    const mensagem = ref("")
    async function executar(action) {
        if (carregando.value) return
        carregando.value = true
        mensagem.value = ""
        try {
            return await action()
        } catch (error) {
            mensagem.value = error.message || "Não foi possível concluir a operação."
        } finally {
            carregando.value = false
        }
    }
    return { carregando, mensagem, executar }
}

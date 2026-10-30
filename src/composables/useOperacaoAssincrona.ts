// Reutilizo esta função para mostrar o carregamento e tratar os erros das operações.
import { ref } from "vue"
export function useOperacaoAssincrona() {
    const carregando = ref(false)
    const mensagem = ref("")
    async function executar(acao: () => unknown) {
        // Evito executar a mesma ação de novo enquanto a anterior ainda está em andamento.
        if (carregando.value) return
        carregando.value = true
        mensagem.value = ""
        try {
            await acao()
        } catch (error) {
            mensagem.value = error.message || "Não foi possível concluir a operação."
        } finally {
            carregando.value = false
        }
    }
    return { carregando, mensagem, executar }
}
